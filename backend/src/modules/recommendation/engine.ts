import type { FactorKey } from '../../config/constants';
import { DEFAULT_RULE_WEIGHTS } from '../../config/constants';
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

/** Scores a single dress, producing the full explainable breakdown. */
export function scoreDress(
  dress: CandidateDress,
  ctx: ScoringContext,
  weights: Record<FactorKey, number>,
): ScoredDress {
  const factors: FactorScore[] = SCORERS.map((scorer) => {
    const partial = scorer.score(dress, ctx);
    const weight = weights[scorer.key];
    return {
      ...partial,
      weight,
      contribution: Math.round(weight * partial.subScore * 1000) / 1000,
    };
  });

  const score = factors.reduce((acc, f) => acc + f.contribution, 0);
  const confidence = Math.round(score * 100);

  // Surface positive signals as reasons, ordered by contribution (impact).
  const reasons = factors
    .filter((f) => f.matched)
    .sort((a, b) => b.contribution - a.contribution)
    .map((f) => `✔ ${f.label}`);

  // Always include at least one honest caveat if nothing matched.
  if (reasons.length === 0) {
    const best = [...factors].sort((a, b) => b.subScore - a.subScore)[0];
    if (best) reasons.push(`• ${best.label}`);
  }

  return { dressId: dress.id, score: Math.round(score * 1000) / 1000, confidence, factors, reasons };
}

/** Scores and ranks all candidates. */
export function rankCandidates(
  candidates: CandidateDress[],
  ctx: ScoringContext,
  weights: Record<FactorKey, number>,
  limit: number,
): ScoredDress[] {
  return candidates
    .map((d) => scoreDress(d, ctx, weights))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
