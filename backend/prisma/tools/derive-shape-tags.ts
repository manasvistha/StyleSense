/**
 * One-off maintenance script: rewrites the `shapes:` and `sizes:` fields of the
 * seed catalogue so the seed data stops flattening the ranking.
 *
 *  * shapes — was averaging 3.1 of 5 shapes per dress (RECTANGLE on 93% of the
 *    catalogue), which made the heaviest scoring factor non-discriminative.
 *    Replaced with the 1–2 shapes the garment's own attributes actually suit,
 *    graded by the same rule matrix the engine uses.
 *  * sizes — every dress stocked M, so "does a size fit?" was constant across
 *    the catalogue. Replaced with realistic, varied size runs.
 */
import fs from 'fs';
import { fileURLToPath } from 'url';
import { deriveBodyShapeFit } from '../../src/modules/recommendation/style-rules';
import type { BodyShapeKey } from '../../src/config/constants';
import type { CandidateDress } from '../../src/modules/recommendation/recommendation.types';

const SHAPES: BodyShapeKey[] = ['HOURGLASS', 'PEAR', 'APPLE', 'RECTANGLE', 'INVERTED_TRIANGLE'];

const RUNS: { labels: string[]; weight: number }[] = [
  { labels: ['XS', 'S', 'M'], weight: 1 },
  { labels: ['S', 'M', 'L'], weight: 2 },
  { labels: ['M', 'L', 'XL'], weight: 2 },
  { labels: ['L', 'XL', 'XXL'], weight: 1 },
  { labels: ['XS', 'S', 'M', 'L'], weight: 2 },
  { labels: ['S', 'M', 'L', 'XL'], weight: 2 },
  { labels: ['M', 'L', 'XL', 'XXL'], weight: 1 },
  { labels: ['XS', 'S', 'M', 'L', 'XL', 'XXL'], weight: 1 },
];
const RUN_POOL = RUNS.flatMap((r) => Array.from({ length: r.weight }, () => r.labels));

/** Stable pseudo-random in [0,1) from a string — keeps the seed reproducible. */
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 100000) / 100000;
}

const path = fileURLToPath(new URL('../seed.ts', import.meta.url));
const src = fs.readFileSync(path, 'utf8');

const start = src.indexOf('const dresses: DressSeed[] = [');
const open = src.indexOf('[', src.indexOf('= [', start));
let depth = 0;
let end = -1;
for (let i = open; i < src.length; i++) {
  if (src[i] === '[') depth++;
  else if (src[i] === ']') {
    depth--;
    if (depth === 0) {
      end = i;
      break;
    }
  }
}
const literal = src.slice(open, end + 1);
// eslint-disable-next-line no-eval
const dresses: any[] = eval(literal);

let block = literal;
let tagTotal = 0;

const probeOf = (d: any) =>
  ({
    styleName: d.style,
    neckStyle: d.neckStyle,
    sleeveType: d.sleeveType,
    length: d.length,
    pattern: d.pattern,
    suitableBodyShapeKeys: [],
  }) as unknown as CandidateDress;

/**
 * Raw suitability is not comparable across shapes — each shape's rule table has
 * its own scale, so the most generous table would win the tag on almost every
 * dress. Standardising each shape's scores across the catalogue instead asks
 * "which shape is this dress *unusually* good for?", which is what a curated
 * tag is supposed to mean.
 */
const rawByShape = new Map<BodyShapeKey, number[]>(
  SHAPES.map((shape) => [shape, dresses.map((d) => deriveBodyShapeFit(probeOf(d), shape).score)]),
);
const stats = new Map<BodyShapeKey, { mean: number; sd: number }>();
for (const [shape, values] of rawByShape) {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const sd = Math.sqrt(values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length) || 1;
  stats.set(shape, { mean, sd });
}

for (const [index, d] of dresses.entries()) {
  const probe = probeOf(d);

  const graded = SHAPES.map((shape) => {
    const { mean, sd } = stats.get(shape)!;
    const raw = rawByShape.get(shape)![index]!;
    return { shape, raw, fit: (raw - mean) / sd };
  }).sort((a, b) => b.fit - a.fit);

  // Always keep the best shape; keep the runner-up only if it is genuinely
  // well suited in absolute terms and close behind, so tags stay sparse and
  // meaningful rather than drifting back toward tagging everything.
  const chosen = [graded[0]!.shape];
  const second = graded[1]!;
  if (second.raw >= 0.25 && graded[0]!.fit - second.fit <= 0.35) chosen.push(second.shape);
  tagTotal += chosen.length;

  const run = RUN_POOL[Math.floor(hash(d.name) * RUN_POOL.length)]!;
  const sizes = run.map((label, i) => {
    // Mid-run sizes carry deeper stock, as real buying patterns do.
    const centrality = 1 - Math.abs(i - (run.length - 1) / 2) / ((run.length - 1) / 2 || 1);
    const stock = Math.max(0, Math.round(2 + centrality * 9 * (0.55 + hash(d.name + label) * 0.9)));
    return { label, stock };
  });
  // Guarantee at least one size is actually purchasable.
  if (sizes.every((s) => s.stock === 0)) sizes[Math.floor(sizes.length / 2)]!.stock = 4;

  const shapesLiteral = `shapes: [${chosen.map((s) => `'${s}'`).join(', ')}]`;
  const sizesLiteral = `sizes: [${sizes.map((s) => `{ label: '${s.label}', stock: ${s.stock} }`).join(', ')}]`;

  const oldShapes = new RegExp(
    `(name: '${d.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}',[\\s\\S]*?)shapes: \\[[^\\]]*\\]`,
  );
  const oldSizes = new RegExp(
    `(name: '${d.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}',[\\s\\S]*?)sizes: \\[[^\\]]*\\]`,
  );
  block = block.replace(oldShapes, `$1${shapesLiteral}`);
  block = block.replace(oldSizes, `$1${sizesLiteral}`);
}

fs.writeFileSync(path, src.slice(0, open) + block + src.slice(end + 1), 'utf8');

const freq = new Map<string, number>();
for (const m of block.matchAll(/shapes: \[([^\]]*)\]/g)) {
  for (const s of m[1]!.matchAll(/'([A-Z_]+)'/g)) freq.set(s[1]!, (freq.get(s[1]!) ?? 0) + 1);
}
console.log(`Rewrote ${dresses.length} dresses.`);
console.log(`Average shape tags per dress: ${(tagTotal / dresses.length).toFixed(2)} (was 3.11)`);
console.log('Shape tag frequency:');
for (const [k, v] of [...freq.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${k.padEnd(18)} ${v}/${dresses.length} (${Math.round((v / dresses.length) * 100)}%)`);
}
const stockM = block.match(/label: 'M'/g)?.length ?? 0;
console.log(`Dresses stocking size M: ${stockM}/${dresses.length} (was ${dresses.length}/${dresses.length})`);
