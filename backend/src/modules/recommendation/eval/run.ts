/**
 * Offline evaluation harness for the recommendation engine.
 *
 *   npm run eval            # summary table
 *   npm run eval -- --full  # adds per-persona factor diagnostics
 *
 * Runs both the current engine and a reimplementation of the original one over
 * the same catalogue, the same personas and the same relevance labels, so the
 * reported deltas isolate the algorithm change. Requires no database.
 */
import { normalizeWeights, rankCandidates, scoreDress } from '../engine';
import { DEFAULT_RULE_WEIGHTS } from '../../../config/constants';
import { SCORERS } from '../scorers';
import type { CandidateDress, ScoringContext } from '../recommendation.types';
import { loadCatalogue, personas } from './catalogue';
import { GROUND_TRUTH } from './ground-truth';
import { legacyRank, legacyRankByBodyShape } from './legacy';
import {
  catalogueCoverage,
  distributionMetrics,
  intraListDiversity,
  rankingMetrics,
  type DistributionMetrics,
  type RankingMetrics,
} from './metrics';

const K = 12;
const full = process.argv.includes('--full');

const catalogue = loadCatalogue();
const byId = new Map(catalogue.map((d) => [d.id, d]));
const weights = normalizeWeights(DEFAULT_RULE_WEIGHTS);

const pct = (n: number): string => `${(n * 100).toFixed(1)}%`;
const pad = (s: string | number, n: number): string => String(s).padEnd(n);

interface Row {
  persona: string;
  ranking: RankingMetrics;
  distribution: DistributionMetrics;
  diversity: number;
  slugs: string[];
}

function evaluateCurrent(name: string, shape: keyof typeof GROUND_TRUTH, ctx: ScoringContext): Row {
  // Rank the whole catalogue for distribution stats, then take the delivered list.
  const all = rankCandidates(catalogue, ctx, weights, catalogue.length, { diversify: false });
  const delivered = rankCandidates(catalogue, ctx, weights, K);

  const slugs = delivered.ranked.map((r) => byId.get(r.dressId)!.slug);
  return {
    persona: name,
    ranking: rankingMetrics(slugs, GROUND_TRUTH[shape], K),
    distribution: distributionMetrics(
      all.ranked.map((r) => r.confidence),
      all.ranked.map((r) => r.score),
      delivered.ranked.map((r) => r.score),
      K,
    ),
    diversity: intraListDiversity(delivered.ranked.map((r) => byId.get(r.dressId)!)),
    slugs,
  };
}

function evaluateLegacy(name: string, shape: keyof typeof GROUND_TRUTH, ctx: ScoringContext): Row {
  const all = legacyRank(catalogue, ctx, catalogue.length);
  const delivered = all.slice(0, K);
  const slugs = delivered.map((r) => byId.get(r.dressId)!.slug);

  return {
    persona: name,
    ranking: rankingMetrics(slugs, GROUND_TRUTH[shape], K),
    distribution: distributionMetrics(
      all.map((r) => r.confidence),
      all.map((r) => r.score),
      delivered.map((r) => r.score),
      K,
    ),
    diversity: intraListDiversity(delivered.map((r) => byId.get(r.dressId)!)),
    slugs,
  };
}

const people = personas();
const legacyRows = people.map((p) => evaluateLegacy(p.name, p.shape, p.ctx));
const currentRows = people.map((p) => evaluateCurrent(p.name, p.shape, p.ctx));

const mean = (xs: number[]): number => xs.reduce((a, b) => a + b, 0) / xs.length;

console.log(`\nCatalogue: ${catalogue.length} dresses · k = ${K} · ${people.length} personas\n`);

// ── Ranking quality ──────────────────────────────────────
console.log('RANKING QUALITY (vs. hand-authored stylist labels)');
console.log(`  ${pad('persona', 42)}${pad('P@12', 18)}${pad('nDCG@12', 18)}${pad('mean rel.', 16)}unsuitable@12`);
for (let i = 0; i < people.length; i++) {
  const l = legacyRows[i]!.ranking;
  const c = currentRows[i]!.ranking;
  console.log(
    `  ${pad(people[i]!.name, 42)}` +
      pad(`${pct(l.precisionAtK)} → ${pct(c.precisionAtK)}`, 18) +
      pad(`${l.ndcgAtK.toFixed(3)} → ${c.ndcgAtK.toFixed(3)}`, 18) +
      pad(`${l.meanRelevance.toFixed(2)} → ${c.meanRelevance.toFixed(2)}`, 16) +
      `${l.unsuitableInTopK} → ${c.unsuitableInTopK}`,
  );
}
console.log(
  `  ${pad('AVERAGE', 42)}` +
    pad(
      `${pct(mean(legacyRows.map((r) => r.ranking.precisionAtK)))} → ${pct(mean(currentRows.map((r) => r.ranking.precisionAtK)))}`,
      18,
    ) +
    pad(
      `${mean(legacyRows.map((r) => r.ranking.ndcgAtK)).toFixed(3)} → ${mean(currentRows.map((r) => r.ranking.ndcgAtK)).toFixed(3)}`,
      18,
    ) +
    pad(
      `${mean(legacyRows.map((r) => r.ranking.meanRelevance)).toFixed(2)} → ${mean(currentRows.map((r) => r.ranking.meanRelevance)).toFixed(2)}`,
      16,
    ) +
    `${legacyRows.reduce((a, r) => a + r.ranking.unsuitableInTopK, 0)} → ${currentRows.reduce((a, r) => a + r.ranking.unsuitableInTopK, 0)}`,
);

// ── Styling factor in isolation ──────────────────────────
// The labels grade silhouette flattery only, so the delivered list is judged on
// a metric that cannot see fit, budget, occasion or stock. Isolating the
// body-shape factor compares the old tag lookup against the new attribute rule
// matrix on the one thing the labels actually measure.
console.log('\nSTYLING FACTOR IN ISOLATION (old tag lookup vs. new rule matrix)');
console.log(`  ${pad('persona', 42)}${pad('P@12', 18)}nDCG@12`);
const shapeOnlyWeights = normalizeWeights({ bodyShape: 1 });
const isolated = people.map((p) => {
  const legacySlugs = legacyRankByBodyShape(catalogue, p.ctx, K).map((r) => byId.get(r.dressId)!.slug);
  const currentSlugs = rankCandidates(catalogue, p.ctx, shapeOnlyWeights, K, { diversify: false }).ranked.map(
    (r) => byId.get(r.dressId)!.slug,
  );
  return {
    legacy: rankingMetrics(legacySlugs, GROUND_TRUTH[p.shape], K),
    current: rankingMetrics(currentSlugs, GROUND_TRUTH[p.shape], K),
  };
});
for (let i = 0; i < people.length; i++) {
  const { legacy, current } = isolated[i]!;
  console.log(
    `  ${pad(people[i]!.name, 42)}` +
      pad(`${pct(legacy.precisionAtK)} → ${pct(current.precisionAtK)}`, 18) +
      `${legacy.ndcgAtK.toFixed(3)} → ${current.ndcgAtK.toFixed(3)}`,
  );
}
console.log(
  `  ${pad('AVERAGE', 42)}` +
    pad(
      `${pct(mean(isolated.map((r) => r.legacy.precisionAtK)))} → ${pct(mean(isolated.map((r) => r.current.precisionAtK)))}`,
      18,
    ) +
    `${mean(isolated.map((r) => r.legacy.ndcgAtK)).toFixed(3)} → ${mean(isolated.map((r) => r.current.ndcgAtK)).toFixed(3)}`,
);

// ── Discrimination ───────────────────────────────────────
console.log('\nDISCRIMINATION (can the ranking actually separate candidates?)');
console.log(`  ${pad('persona', 42)}${pad('score SD', 20)}${pad('top-1..12 spread', 22)}${pad('distinct scores@12', 22)}within 5pts of #1`);
for (let i = 0; i < people.length; i++) {
  const l = legacyRows[i]!.distribution;
  const c = currentRows[i]!.distribution;
  console.log(
    `  ${pad(people[i]!.name, 42)}` +
      pad(`${l.scoreSd.toFixed(4)} → ${c.scoreSd.toFixed(4)}`, 20) +
      pad(`${l.topKSpread} → ${c.topKSpread} pts`, 22) +
      pad(`${l.distinctScoresInTopK}/${K} → ${c.distinctScoresInTopK}/${K}`, 22) +
      `${l.withinFiveOfWinner} → ${c.withinFiveOfWinner}`,
  );
}

// ── Calibration ──────────────────────────────────────────
console.log('\nCONFIDENCE CALIBRATION');
console.log(`  ${pad('persona', 42)}${pad('max', 18)}${pad('mean', 18)}min`);
for (let i = 0; i < people.length; i++) {
  const l = legacyRows[i]!.distribution;
  const c = currentRows[i]!.distribution;
  console.log(
    `  ${pad(people[i]!.name, 42)}` +
      pad(`${l.confidenceMax} → ${c.confidenceMax}`, 18) +
      pad(`${l.confidenceMean.toFixed(1)} → ${c.confidenceMean.toFixed(1)}`, 18) +
      `${l.confidenceMin} → ${c.confidenceMin}`,
  );
}

// ── List health ──────────────────────────────────────────
console.log('\nLIST HEALTH');
console.log(
  `  intra-list diversity   ${mean(legacyRows.map((r) => r.diversity)).toFixed(3)} → ${mean(currentRows.map((r) => r.diversity)).toFixed(3)}`,
);
console.log(
  `  catalogue coverage     ${pct(catalogueCoverage(legacyRows.map((r) => r.slugs), catalogue.length))} → ${pct(catalogueCoverage(currentRows.map((r) => r.slugs), catalogue.length))}`,
);

// Identical lists across personas mean the engine is not personalising at all.
const overlap = (a: string[], b: string[]): number => a.filter((x) => b.includes(x)).length;
let legacyPairs = 0;
let currentPairs = 0;
let pairCount = 0;
for (let i = 0; i < people.length; i++) {
  for (let j = i + 1; j < people.length; j++) {
    legacyPairs += overlap(legacyRows[i]!.slugs, legacyRows[j]!.slugs);
    currentPairs += overlap(currentRows[i]!.slugs, currentRows[j]!.slugs);
    pairCount++;
  }
}
console.log(
  `  mean top-12 overlap    ${(legacyPairs / pairCount).toFixed(1)}/12 → ${(currentPairs / pairCount).toFixed(1)}/12  (lower = more personalised)`,
);

// ── Per-factor discriminative power ──────────────────────
if (full) {
  console.log('\nPER-FACTOR DISCRIMINATIVE POWER (current engine)');
  for (const p of people) {
    // Score directly: ranking a single candidate would drop it entirely when a
    // hard constraint fires, and disqualified dresses still carry a breakdown.
    const scored = catalogue.map((c) => scoreDress(c, p.ctx, weights));
    console.log(`\n  ${p.name}`);
    console.log(`    ${pad('factor', 16)}${pad('weight', 10)}${pad('SD', 12)}${pad('range', 12)}distinct`);
    const rows = SCORERS.map((s) => {
      const vals = scored.map((x) => x.factors.find((f) => f.key === s.key)!.contribution);
      const m = mean(vals);
      return {
        key: s.key,
        weight: scored[0]!.factors.find((f) => f.key === s.key)!.weight,
        sd: Math.sqrt(mean(vals.map((v) => (v - m) ** 2))),
        range: Math.max(...vals) - Math.min(...vals),
        distinct: new Set(vals.map((v) => v.toFixed(3))).size,
      };
    }).sort((a, b) => b.sd - a.sd);
    for (const r of rows) {
      console.log(
        `    ${pad(r.key, 16)}${pad(r.weight.toFixed(2), 10)}${pad(r.sd.toFixed(4), 12)}${pad(r.range.toFixed(3), 12)}${r.distinct}`,
      );
    }
  }

  console.log('\nHARD-CONSTRAINT EXCLUSIONS (current engine)');
  for (const p of people) {
    const { excluded } = rankCandidates(catalogue, p.ctx, weights, K);
    const grouped = new Map<string, number>();
    for (const e of excluded) {
      const key = e.reason.replace(/\d+/g, 'N');
      grouped.set(key, (grouped.get(key) ?? 0) + 1);
    }
    console.log(`  ${p.name}: ${excluded.length}/${catalogue.length} removed`);
    for (const [reason, count] of [...grouped].sort((a, b) => b[1] - a[1])) {
      console.log(`      ${count.toString().padStart(3)}  ${reason}`);
    }
  }
}

console.log('');
