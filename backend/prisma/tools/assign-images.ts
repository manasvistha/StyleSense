/**
 * Assigns catalogue photography to every dress in `prisma/seed.ts`.
 *
 *   npm run assign-images
 *
 * The catalogue previously shared 13 photos across 70 dresses — one image
 * appeared on eight different products and 69 of 70 listings had a single
 * picture, so the storefront looked repetitive and several dresses were
 * illustrated by garments that looked nothing like their description.
 *
 * This assigns each dress a primary and secondary image drawn from the verified
 * pool, preferring photos whose colour and formality actually match the garment
 * and spreading usage so no single photo dominates the grid.
 */
import fs from 'fs';
import { fileURLToPath } from 'url';
import { CATEGORY_FORMALITY, IMAGE_POOL, type PoolImage } from './image-pool';

const IMAGES_PER_DRESS = 2;

const path = fileURLToPath(new URL('../seed.ts', import.meta.url));
const src = fs.readFileSync(path, 'utf8');
const nl = src.includes('\r\n') ? '\r\n' : '\n';

const declaration = src.indexOf('const dresses: DressSeed[] = [');
const open = src.indexOf('[', src.indexOf('= [', declaration));
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

/** How well a photo suits a dress: colour agreement dominates, formality breaks ties. */
function affinity(image: PoolImage, dress: any): number {
  const colorHits = image.colors.filter((c) => dress.colors.includes(c)).length;
  if (colorHits === 0) return -1; // never pair a garment with an unrelated colour
  const wantedFormality = CATEGORY_FORMALITY[dress.category] ?? 'casual';
  const formalityMatch = image.formality === wantedFormality ? 1 : 0;
  // Reward matching the dress's *primary* colour most strongly.
  const primaryMatch = image.colors.includes(dress.colors[0]) ? 1 : 0;
  return colorHits + primaryMatch * 1.5 + formalityMatch * 0.75;
}

const usage = new Map<string, number>(IMAGE_POOL.map((i) => [i.id, 0]));

function pick(dress: any): string[] {
  const ranked = IMAGE_POOL.map((image) => ({ image, score: affinity(image, dress) }))
    .filter((r) => r.score >= 0)
    // Balance quality of match against how heavily a photo is already used, so
    // popular colours do not all collapse onto the same picture.
    .sort((a, b) => b.score - usage.get(b.image.id)! * 0.6 - (a.score - usage.get(a.image.id)! * 0.6));

  const chosen = ranked.slice(0, IMAGES_PER_DRESS).map((r) => r.image.id);

  // Nothing matched on colour (rare) — fall back to the least-used photo in the
  // right formality band rather than leaving the listing without an image.
  if (chosen.length === 0) {
    const wanted = CATEGORY_FORMALITY[dress.category] ?? 'casual';
    const fallback = [...IMAGE_POOL]
      .sort((a, b) => usage.get(a.id)! - usage.get(b.id)!)
      .find((i) => i.formality === wanted) ?? IMAGE_POOL[0]!;
    chosen.push(fallback.id);
  }

  for (const id of chosen) usage.set(id, usage.get(id)! + 1);
  return chosen;
}

let block = literal;
for (const d of dresses) {
  const images = pick(d);
  const escaped = d.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`(name: '${escaped}',[\\s\\S]*?)images: \\[[^\\]]*\\]`);
  if (!re.test(block)) {
    console.warn(`  ! could not locate images field for "${d.name}"`);
    continue;
  }
  block = block.replace(re, `$1images: [${images.map((i) => `'${i}'`).join(', ')}]`);
}

fs.writeFileSync(path, src.slice(0, open) + block + src.slice(end + 1), 'utf8');

const counts = [...usage.entries()].sort((a, b) => b[1] - a[1]);
const used = counts.filter(([, n]) => n > 0).length;
console.log(`Assigned ${IMAGES_PER_DRESS} images to ${dresses.length} dresses.`);
console.log(`Distinct photos in use: ${used}/${IMAGE_POOL.length}`);
console.log(`Most reused: ${counts[0]![1]} dresses · least used: ${counts.filter(([, n]) => n > 0).slice(-1)[0]![1]}`);
const unused = counts.filter(([, n]) => n === 0).map(([id]) => id);
if (unused.length) console.log(`Unused photos (${unused.length}): ${unused.join(', ')}`);
void nl;
