import { describe, it, expect } from 'vitest';
import { normalizeWeights, scoreDress, rankCandidates, calibrateConfidence } from './engine';
import { deriveBodyShapeFit } from './style-rules';
import { assessFit } from './fit';
import type { CandidateDress, ScoringContext } from './recommendation.types';
import { DEFAULT_RULE_WEIGHTS } from '../../config/constants';

const emptyAffinity = () => ({
  styleIds: new Map<string, number>(),
  colorIds: new Map<string, number>(),
  brandIds: new Map<string, number>(),
  lengths: new Map<string, number>(),
  signalCount: 0,
});

const baseCtx: ScoringContext = {
  age: 23,
  bustCm: 90,
  waistCm: 68,
  hipCm: 96,
  bodyShapeKey: 'HOURGLASS',
  budgetMin: 1000,
  budgetMax: 8000,
  hasBudget: true,
  preferredColorIds: new Set(['c-emerald']),
  preferredStyleIds: new Set(['s-wrap']),
  favoriteBrandIds: new Set(['b-aurelia']),
  favoriteOccasionIds: new Set(['o-party']),
  requestedOccasionIds: new Set(),
  affinity: emptyAffinity(),
};

const sizes = (
  labels: ('XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL')[],
  stock = 5,
): CandidateDress['sizes'] => {
  const table = {
    XS: { sortOrder: 1, bustMin: 76, bustMax: 82, waistMin: 58, waistMax: 64, hipMin: 84, hipMax: 90 },
    S: { sortOrder: 2, bustMin: 82, bustMax: 88, waistMin: 64, waistMax: 70, hipMin: 90, hipMax: 96 },
    M: { sortOrder: 3, bustMin: 88, bustMax: 94, waistMin: 70, waistMax: 76, hipMin: 96, hipMax: 102 },
    L: { sortOrder: 4, bustMin: 94, bustMax: 102, waistMin: 76, waistMax: 84, hipMin: 102, hipMax: 110 },
    XL: { sortOrder: 5, bustMin: 102, bustMax: 110, waistMin: 84, waistMax: 94, hipMin: 110, hipMax: 118 },
    XXL: { sortOrder: 6, bustMin: 110, bustMax: 120, waistMin: 94, waistMax: 104, hipMin: 118, hipMax: 128 },
  };
  return labels.map((l) => ({ label: l, stock, ...table[l] }));
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
  categoryId: 'cat-cocktail',
  styleName: 'Wrap',
  fabricName: 'Silk',
  sleeveType: 'THREE_QUARTER',
  length: 'MIDI',
  neckStyle: 'V-Neck',
  pattern: 'Solid',
  ageGroup: { minAge: 18, maxAge: 24 },
  colorIds: ['c-emerald', 'c-black'],
  occasionIds: ['o-party'],
  suitableBodyShapeKeys: ['HOURGLASS'],
  sizes: sizes(['S', 'M', 'L']),
};

const weights = normalizeWeights(DEFAULT_RULE_WEIGHTS);

describe('normalizeWeights', () => {
  it('normalizes arbitrary weights to sum to 1', () => {
    const w = normalizeWeights({ bodyShape: 6, measurements: 4 });
    expect(Object.values(w).reduce((a, b) => a + b, 0)).toBeCloseTo(1, 5);
  });

  it('falls back to defaults for missing factors', () => {
    const w = normalizeWeights({});
    expect(Object.values(w).reduce((a, b) => a + b, 0)).toBeCloseTo(1, 5);
    expect(w.bodyShape).toBeGreaterThan(w.popularity);
  });
});

describe('scoreDress (explainable scoring)', () => {
  it('gives a near-perfect match a high confidence', () => {
    const result = scoreDress(perfectDress, baseCtx, weights);
    expect(result.confidence).toBeGreaterThanOrEqual(80);
    expect(result.score).toBeLessThanOrEqual(1);
  });

  it('produces human-readable reasons including body shape and budget', () => {
    const { reasons } = scoreDress(perfectDress, baseCtx, weights);
    expect(reasons.some((r) => /body shape|hourglass/i.test(r))).toBe(true);
    expect(reasons.some((r) => /budget/i.test(r))).toBe(true);
  });

  it('exposes a per-factor breakdown whose contributions sum to the base score', () => {
    const result = scoreDress(perfectDress, baseCtx, weights);
    const sum = result.factors.reduce((a, f) => a + f.contribution, 0);
    expect(sum).toBeCloseTo(result.baseScore, 2);
  });

  it('penalizes an out-of-budget, wrong-shape dress', () => {
    const poor: CandidateDress = {
      ...perfectDress,
      id: 'd2',
      basePrice: 11000,
      styleName: 'Shift',
      neckStyle: 'High',
      colorIds: ['c-white'],
      occasionIds: ['o-office'],
      styleId: 's-shift',
      brandId: 'b-other',
      suitableBodyShapeKeys: ['APPLE'],
    };
    expect(scoreDress(poor, baseCtx, weights).confidence).toBeLessThan(
      scoreDress(perfectDress, baseCtx, weights).confidence,
    );
  });
});

describe('no-data is distinguished from a bad match', () => {
  const bareCtx: ScoringContext = {
    ...baseCtx,
    hasBudget: false,
    preferredColorIds: new Set(),
    preferredStyleIds: new Set(),
    favoriteBrandIds: new Set(),
    favoriteOccasionIds: new Set(),
  };

  it('drops factors the user gave no data for instead of scoring them 0.5', () => {
    const { factors } = scoreDress(perfectDress, bareCtx, weights);
    const inert = factors.filter((f) => !f.applicable);
    expect(inert.map((f) => f.key).sort()).toEqual(
      ['brand', 'budget', 'color', 'occasion', 'personalization', 'style'].sort(),
    );
    // Dropped factors must contribute nothing at all.
    expect(inert.every((f) => f.weight === 0 && f.contribution === 0)).toBe(true);
  });

  it('redistributes dropped weight so applicable factors still sum to 1', () => {
    const { factors } = scoreDress(perfectDress, bareCtx, weights);
    const total = factors.filter((f) => f.applicable).reduce((a, f) => a + f.weight, 0);
    expect(total).toBeCloseTo(1, 2);
  });

  it('reports lower coverage for a sparse profile than a complete one', () => {
    expect(scoreDress(perfectDress, bareCtx, weights).coverage).toBeLessThan(
      scoreDress(perfectDress, baseCtx, weights).coverage,
    );
  });
});

describe('confidence calibration', () => {
  it('shrinks a strong score toward neutral when coverage is incomplete', () => {
    expect(calibrateConfidence(0.9, 0.5)).toBeLessThan(calibrateConfidence(0.9, 1));
  });

  it('leaves a fully-covered score untouched', () => {
    expect(calibrateConfidence(0.9, 1)).toBe(90);
  });
});

describe('hard constraints', () => {
  it('removes a dress with no stock in any size', () => {
    const oos: CandidateDress = { ...perfectDress, id: 'oos', sizes: sizes(['S', 'M'], 0) };
    const { ranked, excluded } = rankCandidates([perfectDress, oos], baseCtx, weights, 10);
    expect(ranked.map((r) => r.dressId)).not.toContain('oos');
    expect(excluded[0]?.reason).toMatch(/stock/i);
  });

  it('removes a dress priced far beyond the budget', () => {
    const pricey: CandidateDress = { ...perfectDress, id: 'pricey', basePrice: 40000, discountPct: 0 };
    const { ranked } = rankCandidates([perfectDress, pricey], baseCtx, weights, 10);
    expect(ranked.map((r) => r.dressId)).not.toContain('pricey');
  });

  it('removes a silhouette that actively fights the body shape', () => {
    // A bodycon with a high neck is the canonical wrong call for an Apple figure.
    const wrong: CandidateDress = {
      ...perfectDress,
      id: 'wrong',
      styleName: 'Bodycon',
      neckStyle: 'High',
      length: 'MINI',
      sleeveType: 'CAP',
      suitableBodyShapeKeys: ['HOURGLASS'],
    };
    const appleCtx: ScoringContext = { ...baseCtx, bodyShapeKey: 'APPLE' };
    expect(scoreDress(wrong, appleCtx, weights).disqualified).toBeDefined();
  });
});

describe('ranking is deterministic and diverse', () => {
  const variants = (n: number): CandidateDress[] =>
    Array.from({ length: n }, (_, i) => ({
      ...perfectDress,
      id: `v${i}`,
      slug: `v${i}`,
      basePrice: 5000 + i,
    }));

  it('breaks ties deterministically rather than by input order', () => {
    const items = variants(6);
    const forward = rankCandidates(items, baseCtx, weights, 6, { diversify: false });
    const reversed = rankCandidates([...items].reverse(), baseCtx, weights, 6, { diversify: false });
    expect(forward.ranked.map((r) => r.dressId)).toEqual(reversed.ranked.map((r) => r.dressId));
  });

  it('prefers a different silhouette over a near-duplicate of the leader', () => {
    const duplicate: CandidateDress = { ...perfectDress, id: 'dup', basePrice: 5401 };
    const different: CandidateDress = {
      ...perfectDress,
      id: 'diff',
      styleId: 's-flare',
      styleName: 'Fit & Flare',
      length: 'KNEE',
      categoryId: 'cat-party',
      brandId: 'b-other',
      colorIds: ['c-emerald'],
      basePrice: 5600,
    };
    const { ranked } = rankCandidates([perfectDress, duplicate, different], baseCtx, weights, 2);
    expect(ranked[1]!.dressId).toBe('diff');
  });
});

describe('fit assessment discriminates between garments', () => {
  it('scores a dress stocking the wearer’s size above one that does not', () => {
    const fits = assessFit({ ...perfectDress, sizes: sizes(['S', 'M', 'L']) }, baseCtx);
    const tooSmall = assessFit({ ...perfectDress, sizes: sizes(['XS']) }, baseCtx);
    expect(fits.subScore).toBeGreaterThan(tooSmall.subScore);
  });

  it('is more forgiving in stretch jersey than in structured satin', () => {
    const offSize = sizes(['L']);
    const jersey = assessFit({ ...perfectDress, fabricName: 'Jersey', sizes: offSize }, baseCtx);
    const satin = assessFit({ ...perfectDress, fabricName: 'Satin', sizes: offSize }, baseCtx);
    expect(jersey.subScore).toBeGreaterThan(satin.subScore);
  });

  it('weights the waist more heavily for a bodycon than for an empire-waist dress', () => {
    // A waist well outside the band should hurt a bodycon far more.
    const wideWaist: ScoringContext = { ...baseCtx, waistCm: 84 };
    const bodycon = assessFit({ ...perfectDress, styleName: 'Bodycon', sizes: sizes(['M']) }, wideWaist);
    const empire = assessFit({ ...perfectDress, styleName: 'Empire Waist', sizes: sizes(['M']) }, wideWaist);
    expect(empire.subScore).toBeGreaterThan(bodycon.subScore);
  });

  it('flags being at the top of the stocked size run', () => {
    const large: ScoringContext = { ...baseCtx, bustCm: 104, waistCm: 90, hipCm: 112 };
    const capped = assessFit({ ...perfectDress, sizes: sizes(['S', 'M', 'L']) }, large);
    expect(capped.caveat ?? capped.hardFail).toBeDefined();
  });
});

describe('body-shape rules derive suitability from garment attributes', () => {
  it('rates an empire-waist maxi highly for an Apple figure and a bodycon poorly', () => {
    const empire = { ...perfectDress, styleName: 'Empire Waist', length: 'MAXI', neckStyle: 'V-Neck', suitableBodyShapeKeys: [] } as CandidateDress;
    const bodycon = { ...perfectDress, styleName: 'Bodycon', length: 'MINI', neckStyle: 'High', suitableBodyShapeKeys: [] } as CandidateDress;
    expect(deriveBodyShapeFit(empire, 'APPLE').score).toBeGreaterThan(0.4);
    expect(deriveBodyShapeFit(bodycon, 'APPLE').score).toBeLessThan(-0.4);
  });

  it('penalises boat necks and cap sleeves for an Inverted Triangle', () => {
    const broadening = { ...perfectDress, neckStyle: 'Boat', sleeveType: 'CAP', suitableBodyShapeKeys: [] } as CandidateDress;
    const balancing = { ...perfectDress, neckStyle: 'V-Neck', sleeveType: 'THREE_QUARTER', suitableBodyShapeKeys: [] } as CandidateDress;
    expect(deriveBodyShapeFit(balancing, 'INVERTED_TRIANGLE').score).toBeGreaterThan(
      deriveBodyShapeFit(broadening, 'INVERTED_TRIANGLE').score,
    );
  });

  it('works with no curated tags at all, so new stock is recommendable', () => {
    const untagged = { ...perfectDress, suitableBodyShapeKeys: [] } as CandidateDress;
    expect(deriveBodyShapeFit(untagged, 'HOURGLASS').score).toBeGreaterThan(0.3);
  });

  it('lets a curated tag steer the derived verdict', () => {
    const untagged = { ...perfectDress, suitableBodyShapeKeys: [] } as CandidateDress;
    const tagged = { ...perfectDress, suitableBodyShapeKeys: ['APPLE'] } as CandidateDress;
    expect(deriveBodyShapeFit(tagged, 'APPLE').score).toBeGreaterThan(
      deriveBodyShapeFit(untagged, 'APPLE').score,
    );
  });
});
