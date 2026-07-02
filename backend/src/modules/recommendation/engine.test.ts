import { describe, it, expect } from 'vitest';
import { normalizeWeights, scoreDress } from './engine';
import type { CandidateDress, ScoringContext } from './recommendation.types';
import { DEFAULT_RULE_WEIGHTS } from '../../config/constants';

const baseCtx: ScoringContext = {
  age: 23,
  bustCm: 90,
  waistCm: 68,
  hipCm: 96,
  bodyShapeKey: 'HOURGLASS',
  budgetMin: 1000,
  budgetMax: 8000,
  preferredColorIds: new Set(['c-emerald']),
  preferredStyleIds: new Set(['s-wrap']),
  favoriteBrandIds: new Set(['b-aurelia']),
  favoriteOccasionIds: new Set(['o-party']),
  requestedOccasionIds: new Set(),
};

const perfectDress: CandidateDress = {
  id: 'd1',
  name: 'Emerald Wrap',
  slug: 'emerald-wrap',
  basePrice: 5400,
  discountPct: 10,
  ratingAvg: 4.7,
  ratingCount: 128,
  popularityScore: 600,
  styleId: 's-wrap',
  brandId: 'b-aurelia',
  ageGroup: { minAge: 18, maxAge: 24 },
  colorIds: ['c-emerald', 'c-black'],
  occasionIds: ['o-party'],
  suitableBodyShapeKeys: ['HOURGLASS', 'PEAR'],
  sizes: [
    { label: 'M', bustMin: 88, bustMax: 94, waistMin: 70, waistMax: 76, hipMin: 96, hipMax: 102, stock: 10 },
  ],
};

describe('normalizeWeights', () => {
  it('normalizes arbitrary weights to sum to 1', () => {
    const w = normalizeWeights({ bodyShape: 6, measurements: 4 });
    const sum = Object.values(w).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1, 5);
  });

  it('falls back to defaults for missing factors', () => {
    const w = normalizeWeights({});
    const sum = Object.values(w).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1, 5);
    // body shape should remain the heaviest factor
    expect(w.bodyShape).toBeGreaterThan(w.popularity);
  });
});

describe('scoreDress (explainable scoring)', () => {
  const weights = normalizeWeights(DEFAULT_RULE_WEIGHTS);

  it('gives a near-perfect match a very high confidence', () => {
    const result = scoreDress(perfectDress, baseCtx, weights);
    expect(result.confidence).toBeGreaterThanOrEqual(90);
    expect(result.score).toBeLessThanOrEqual(1);
  });

  it('produces human-readable reasons including body shape and budget', () => {
    const { reasons } = scoreDress(perfectDress, baseCtx, weights);
    expect(reasons.some((r) => /body shape/i.test(r))).toBe(true);
    expect(reasons.some((r) => /budget/i.test(r))).toBe(true);
  });

  it('exposes a per-factor breakdown whose contributions sum to the score', () => {
    const result = scoreDress(perfectDress, baseCtx, weights);
    const sum = result.factors.reduce((a, f) => a + f.contribution, 0);
    expect(sum).toBeCloseTo(result.score, 2);
  });

  it('penalizes an out-of-budget, wrong-shape dress', () => {
    const poor: CandidateDress = {
      ...perfectDress,
      id: 'd2',
      basePrice: 20000,
      discountPct: 0,
      suitableBodyShapeKeys: ['APPLE'],
      colorIds: ['c-white'],
      occasionIds: ['o-office'],
      styleId: 's-shift',
      brandId: 'b-other',
      sizes: [{ label: 'XXL', bustMin: 110, bustMax: 120, waistMin: 94, waistMax: 104, hipMin: 118, hipMax: 128, stock: 1 }],
    };
    const good = scoreDress(perfectDress, baseCtx, weights);
    const bad = scoreDress(poor, baseCtx, weights);
    expect(bad.confidence).toBeLessThan(good.confidence);
  });
});
