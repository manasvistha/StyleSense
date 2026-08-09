import type { FactorKey } from '../../config/constants';
import { DEFAULT_RULE_WEIGHTS, RECOMMENDATION } from '../../config/constants';
import { SCORERS } from './scorers';
import type { CandidateDress, FactorScore, ScoredDress, ScoringContext } from './recommendation.types';

export type WeightMap = Partial<Record<FactorKey, number>>;

/**
 * Normalizes raw factor weights so they always sum to 1.0, even if an admin's
 * configured numbers don't. Only weights for registered scorers are considered.
 */
export function normalizeWeights(raw: WeightMap): Record<FactorKey, number> {
  const keys = SCORERS.map((s) => s.key);
  const merged = {} as Record<FactorKey, number>;
  let sum = 0;
  for (const key of keys) {
    const w = raw[key] ?? DEFAULT_RULE_WEIGHTS[key] ?? 0;
    merged[key] = Math.max(0, w);
    sum += merged[key];
  }
  if (sum === 0) {
    // Degenerate config — fall back to equal weighting.
    for (const key of keys) merged[key] = 1 / keys.length;
    return merged;
  }
  for (const key of keys) merged[key] = merged[key] / sum;
  return merged;
}

/**
 * Scores a single dress, producing the full explainable breakdown.
 *
 * Two behaviours differ from a plain weighted sum:
 *  1. Factors the user gave us no data for are dropped and their weight is
 *     redistributed across the rest, so a sparse profile yields an honest score
 *     over what we actually know rather than one padded with neutral 0.5s.
 *  2. Factors reporting active harm apply a multiplicative penalty, and factors
 *     reporting a disqualifying problem mark the candidate for removal — a bad
 *     match can now be ruled out, not merely ranked slightly lower.
 */
export function scoreDress(
  dress: CandidateDress,
  ctx: ScoringContext,
  weights: Record<FactorKey, number>,
): ScoredDress {
  const results = SCORERS.map((scorer) => ({ key: scorer.key, ...scorer.score(dress, ctx) }));

  const applicableWeight = results
    .filter((r) => r.applicable !== false)
    .reduce((acc, r) => acc + (weights[r.key] ?? 0), 0);

  const factors: FactorScore[] = results.map((r) => {
    const applicable = r.applicable !== false;
    // Redistribute the dropped weight proportionally across the surviving factors.
    const weight = applicable && applicableWeight > 0 ? (weights[r.key] ?? 0) / applicableWeight : 0;
    return {
      key: r.key,
      weight: Math.round(weight * 1000) / 1000,
      subScore: Math.round(r.subScore * 1000) / 1000,
      contribution: Math.round(weight * r.subScore * 1000) / 1000,
      label: r.label,
      matched: r.matched,
      applicable,
    };
  });

  const baseScore = factors.reduce((acc, f) => acc + f.contribution, 0);
  const penalty = results.reduce((acc, r) => acc * (r.penalty ?? 1), 1);
  const score = baseScore * penalty;

  const disqualified = results.find((r) => r.hardFail)?.hardFail;

  // Surface positive signals as reasons, ordered by contribution (impact).
  const reasons = factors
    .filter((f) => f.matched)
    .sort((a, b) => b.contribution - a.contribution)
    .map((f) => `✔ ${f.label}`);

  const caveats = results.filter((r) => r.caveat).map((r) => `! ${r.caveat}`);

  // Never present a weak match as if it were a strong one: if nothing matched,
  // say what the dress is rather than dressing up its least-bad attribute.
  if (reasons.length === 0) {
    const best = factors.filter((f) => f.applicable).sort((a, b) => b.subScore - a.subScore)[0];
    if (best) reasons.push(`• ${best.label}`);
  }

  return {
    dressId: dress.id,
    score: Math.round(score * 1000) / 1000,
    baseScore: Math.round(baseScore * 1000) / 1000,
    penalty: Math.round(penalty * 1000) / 1000,
    confidence: calibrateConfidence(score, applicableWeight),
    coverage: Math.round(applicableWeight * 1000) / 1000,
    factors,
    reasons,
    caveats,
    ...(disqualified ? { disqualified } : {}),
  };
}

/**
 * Turns a raw score into a confidence percentage the user can trust.
 *
 * A score computed from half a profile is not as reliable as one computed from
 * a complete profile, so incomplete coverage pulls the figure toward neutral.
 * This stops a user who has entered nothing but measurements from being shown a
 * confident-looking 90%, and is what the UI keys off to ask for more data.
 */
export function calibrateConfidence(score: number, coverage: number): number {
  const shrink = 1 - RECOMMENDATION.COVERAGE_SHRINK * (1 - Math.max(0, Math.min(1, coverage)));
  return Math.round((0.5 + (score - 0.5) * shrink) * 100);
}

/**
 * Attribute-level similarity between two garments, 0 (unlike) … 1 (near
 * duplicate). Used by the diversity re-ranker so the final list is not five
 * variations on the same dress.
 */
export function dressSimilarity(a: CandidateDress, b: CandidateDress): number {
  const colorOverlap = a.colorIds.length && b.colorIds.length
    ? a.colorIds.filter((id) => b.colorIds.includes(id)).length /
      new Set([...a.colorIds, ...b.colorIds]).size
    : 0;

  return (
    (a.styleId === b.styleId ? 0.3 : 0) +
    (a.length === b.length ? 0.15 : 0) +
    (a.categoryId === b.categoryId ? 0.15 : 0) +
    (a.neckStyle === b.neckStyle ? 0.1 : 0) +
    (a.brandId === b.brandId ? 0.1 : 0) +
    colorOverlap * 0.2
  );
}

/**
 * Stable ordering for equally-scored candidates. Without this, ties fall back
 * to whatever order the database returned, which made the top of the list
 * effectively arbitrary whenever the scores bunched up.
 */
function compareScored(
  a: ScoredDress,
  b: ScoredDress,
  byId: Map<string, CandidateDress>,
): number {
  if (b.score !== a.score) return b.score - a.score;
  const da = byId.get(a.dressId)!;
  const db = byId.get(b.dressId)!;
  if (db.ratingAvg !== da.ratingAvg) return db.ratingAvg - da.ratingAvg;
  const priceA = da.basePrice * (1 - da.discountPct / 100);
  const priceB = db.basePrice * (1 - db.discountPct / 100);
  if (priceA !== priceB) return priceA - priceB;
  return da.id.localeCompare(db.id);
}

/**
 * Maximal Marginal Relevance: repeatedly take the candidate with the best
 * blend of relevance and dissimilarity to what has already been picked.
 */
function diversify(
  pool: ScoredDress[],
  byId: Map<string, CandidateDress>,
  limit: number,
  lambda: number,
): ScoredDress[] {
  const selected: ScoredDress[] = [];
  const remaining = [...pool];

  while (selected.length < limit && remaining.length > 0) {
    let bestIdx = 0;
    let bestValue = -Infinity;

    for (let i = 0; i < remaining.length; i++) {
      const candidate = byId.get(remaining[i]!.dressId)!;
      const maxSim = selected.length
        ? Math.max(...selected.map((s) => dressSimilarity(candidate, byId.get(s.dressId)!)))
        : 0;
      const value = lambda * remaining[i]!.score - (1 - lambda) * maxSim;
      // Strict > keeps the incoming order (already tie-broken) as the decider.
      if (value > bestValue) {
        bestValue = value;
        bestIdx = i;
      }
    }

    selected.push(remaining.splice(bestIdx, 1)[0]!);
  }

  return selected;
}

export interface RankResult {
  ranked: ScoredDress[];
  /** Candidates removed by a hard constraint, with the reason why. */
  excluded: { dressId: string; reason: string }[];
  /** Share of scoring weight backed by real user data for this run (0..1). */
  coverage: number;
}

export interface RankOptions {
  /** Set false to inspect pure relevance ordering (used by the evaluation harness). */
  diversify?: boolean;
  lambda?: number;
}

/** Scores, filters, ranks and diversifies all candidates. */
export function rankCandidates(
  candidates: CandidateDress[],
  ctx: ScoringContext,
  weights: Record<FactorKey, number>,
  limit: number,
  options: RankOptions = {},
): RankResult {
  const byId = new Map(candidates.map((c) => [c.id, c]));
  const scored = candidates.map((d) => scoreDress(d, ctx, weights));

  const excluded = scored
    .filter((s) => s.disqualified)
    .map((s) => ({ dressId: s.dressId, reason: s.disqualified! }));

  const eligible = scored
    .filter((s) => !s.disqualified)
    .sort((a, b) => compareScored(a, b, byId));

  const coverage = scored[0]?.coverage ?? 0;

  if (options.diversify === false) {
    return { ranked: eligible.slice(0, limit), excluded, coverage };
  }

  // Diversify within a relevance-ordered shortlist so novelty can reorder good
  // candidates but cannot promote genuinely poor ones.
  const pool = eligible.slice(0, Math.max(limit, limit * RECOMMENDATION.MMR_POOL_MULTIPLIER));
  const lambda = options.lambda ?? RECOMMENDATION.MMR_LAMBDA;
  const selected = diversify(pool, byId, limit, lambda);

  // MMR decides *which* dresses make the list; it should not decide the order
  // they are shown in. Presenting its selection order would show the user
  // confidence percentages that jump around (a 63% sitting below a 56%), which
  // reads as a bug. Re-sorting by relevance keeps the diverse set intact while
  // presenting it best-first.
  return { ranked: selected.sort((a, b) => compareScored(a, b, byId)), excluded, coverage };
}
