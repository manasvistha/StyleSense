import type { BodyShapeKey, FactorKey } from '../../../config/constants';
import type { CandidateDress, ScoringContext, SizeRange } from '../recommendation.types';

/**
 * Faithful reimplementation of the ORIGINAL recommendation algorithm, kept
 * solely so the evaluation harness can measure before/after on identical data
 * and identical labels. Without it the comparison would confound the algorithm
 * change with the catalogue change.
 *
 * Do not import this from application code — it is a measurement baseline.
 *
 * Reproduced from the pre-refactor `scorers.ts` and `engine.ts`:
 *  • neutral 0.5 injected wherever the user supplied no data,
 *  • body shape scored from curated tags only, in three buckets (1 / 0.55 / 0.2),
 *  • size fit = "does any in-stock size contain these measurements", with
 *    linear decay outside the band,
 *  • no penalties, no hard constraints, no tie-break, no diversity,
 *  • confidence = round(score × 100).
 */

const clamp01 = (n: number): number => Math.max(0, Math.min(1, n));

export const LEGACY_WEIGHTS: Record<string, number> = {
  bodyShape: 0.3,
  measurements: 0.25,
  ageGroup: 0.1,
  occasion: 0.1,
  budget: 0.1,
  color: 0.05,
  style: 0.05,
  brand: 0.03,
  popularity: 0.02,
};

const ADJACENT_SHAPES: Record<BodyShapeKey, BodyShapeKey[]> = {
  HOURGLASS: ['PEAR', 'INVERTED_TRIANGLE'],
  PEAR: ['HOURGLASS', 'RECTANGLE'],
  APPLE: ['RECTANGLE'],
  RECTANGLE: ['HOURGLASS', 'PEAR', 'APPLE'],
  INVERTED_TRIANGLE: ['HOURGLASS', 'RECTANGLE'],
};

function legacyFitForSize(size: SizeRange, ctx: ScoringContext): number {
  const within = (v: number, min: number, max: number): number => {
    if (v >= min && v <= max) return 1;
    const width = Math.max(1, max - min);
    const dist = v < min ? min - v : v - max;
    return clamp01(1 - dist / width);
  };
  return (
    (within(ctx.bustCm, size.bustMin, size.bustMax) +
      within(ctx.waistCm, size.waistMin, size.waistMax) +
      within(ctx.hipCm, size.hipMin, size.hipMax)) /
    3
  );
}

const SUB_SCORE: Record<FactorKey | string, (d: CandidateDress, c: ScoringContext) => number> = {
  bodyShape(d, ctx) {
    if (!ctx.bodyShapeKey) return 0.5;
    if (d.suitableBodyShapeKeys.includes(ctx.bodyShapeKey)) return 1;
    const adjacents = ADJACENT_SHAPES[ctx.bodyShapeKey];
    if (d.suitableBodyShapeKeys.some((s) => adjacents.includes(s))) return 0.55;
    return 0.2;
  },

  measurements(d, ctx) {
    const inStock = d.sizes.filter((s) => s.stock > 0);
    if (inStock.length === 0) return 0;
    return Math.max(...inStock.map((s) => legacyFitForSize(s, ctx)));
  },

  ageGroup(d, ctx) {
    const { minAge, maxAge } = d.ageGroup;
    if (ctx.age >= minAge && ctx.age <= maxAge) return 1;
    const yearsOut = ctx.age < minAge ? minAge - ctx.age : ctx.age - maxAge;
    return clamp01(1 - yearsOut * 0.15);
  },

  occasion(d, ctx) {
    const wanted = ctx.requestedOccasionIds.size > 0 ? ctx.requestedOccasionIds : ctx.favoriteOccasionIds;
    if (wanted.size === 0) return 0.5;
    const hits = d.occasionIds.filter((id) => wanted.has(id)).length;
    const raw = clamp01(hits / wanted.size + (hits > 0 ? 0.3 : 0));
    return hits > 0 ? Math.max(raw, 0.7) : 0.15;
  },

  budget(d, ctx) {
    const price = d.basePrice * (1 - d.discountPct / 100);
    if (price <= ctx.budgetMax && price >= ctx.budgetMin * 0.5) return 1;
    if (price > ctx.budgetMax) {
      return clamp01(1 - (price - ctx.budgetMax) / Math.max(1, ctx.budgetMax));
    }
    return 0.8;
  },

  color(d, ctx) {
    if (ctx.preferredColorIds.size === 0) return 0.5;
    return d.colorIds.some((id) => ctx.preferredColorIds.has(id)) ? 1 : 0.2;
  },

  style(d, ctx) {
    if (ctx.preferredStyleIds.size === 0) return 0.5;
    return ctx.preferredStyleIds.has(d.styleId) ? 1 : 0.3;
  },

  brand(d, ctx) {
    if (ctx.favoriteBrandIds.size === 0) return 0.5;
    return ctx.favoriteBrandIds.has(d.brandId) ? 1 : 0.4;
  },

  popularity(d) {
    const rating = clamp01(d.ratingAvg / 5);
    const volume = clamp01(Math.log10(d.ratingCount + 1) / 2);
    return clamp01(rating * 0.7 + volume * 0.3);
  },
};

export interface LegacyScored {
  dressId: string;
  score: number;
  confidence: number;
}

/**
 * Ranks by the legacy body-shape factor alone. Lets the harness compare the old
 * tag lookup against the new attribute-derived rule matrix directly, without
 * the other factors diluting either side.
 */
export function legacyRankByBodyShape(
  candidates: CandidateDress[],
  ctx: ScoringContext,
  limit: number,
): LegacyScored[] {
  return candidates
    .map((d) => {
      const score = SUB_SCORE.bodyShape!(d, ctx);
      return { dressId: d.id, score, confidence: Math.round(score * 100) };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function legacyRank(
  candidates: CandidateDress[],
  ctx: ScoringContext,
  limit: number,
): LegacyScored[] {
  const total = Object.values(LEGACY_WEIGHTS).reduce((a, b) => a + b, 0);

  return candidates
    .map((d) => {
      let score = 0;
      for (const [key, weight] of Object.entries(LEGACY_WEIGHTS)) {
        score += (weight / total) * SUB_SCORE[key]!(d, ctx);
      }
      const rounded = Math.round(score * 1000) / 1000;
      return { dressId: d.id, score: rounded, confidence: Math.round(rounded * 100) };
    })
    .sort((a, b) => b.score - a.score) // no tie-break: ties keep source order
    .slice(0, limit);
}
