import type { BodyShapeKey } from '../../config/constants';
import type { CandidateDress, Scorer, ScoringContext, SizeRange } from './recommendation.types';

const clamp01 = (n: number): number => Math.max(0, Math.min(1, n));

/** Shapes that flatter similarly — used for partial body-shape credit. */
const ADJACENT_SHAPES: Record<BodyShapeKey, BodyShapeKey[]> = {
  HOURGLASS: ['PEAR', 'INVERTED_TRIANGLE'],
  PEAR: ['HOURGLASS', 'RECTANGLE'],
  APPLE: ['RECTANGLE'],
  RECTANGLE: ['HOURGLASS', 'PEAR', 'APPLE'],
  INVERTED_TRIANGLE: ['HOURGLASS', 'RECTANGLE'],
};

const SHAPE_LABEL: Record<BodyShapeKey, string> = {
  HOURGLASS: 'Hourglass',
  PEAR: 'Pear',
  APPLE: 'Apple',
  RECTANGLE: 'Rectangle',
  INVERTED_TRIANGLE: 'Inverted Triangle',
};

// ── 1. Body shape (0.30) ─────────────────────────────────
const bodyShapeScorer: Scorer = {
  key: 'bodyShape',
  score(dress, ctx) {
    if (!ctx.bodyShapeKey) {
      return { key: 'bodyShape', subScore: 0.5, matched: false, label: 'Add measurements for body-shape matching' };
    }
    const shapeLabel = SHAPE_LABEL[ctx.bodyShapeKey];
    if (dress.suitableBodyShapeKeys.includes(ctx.bodyShapeKey)) {
      return { key: 'bodyShape', subScore: 1, matched: true, label: `Matches your ${shapeLabel} body shape` };
    }
    const adjacents = ADJACENT_SHAPES[ctx.bodyShapeKey];
    if (dress.suitableBodyShapeKeys.some((s) => adjacents.includes(s))) {
      return { key: 'bodyShape', subScore: 0.55, matched: false, label: `Flatters shapes close to ${shapeLabel}` };
    }
    return { key: 'bodyShape', subScore: 0.2, matched: false, label: `Not tailored to a ${shapeLabel} shape` };
  },
};

// ── 2. Measurements / size fit (0.25) ────────────────────
function fitForSize(size: SizeRange, ctx: ScoringContext): number {
  const within = (v: number, min: number, max: number): number => {
    if (v >= min && v <= max) return 1;
    const width = Math.max(1, max - min);
    const dist = v < min ? min - v : v - max;
    return clamp01(1 - dist / width); // graceful decay outside the range
  };
  const bust = within(ctx.bustCm, size.bustMin, size.bustMax);
  const waist = within(ctx.waistCm, size.waistMin, size.waistMax);
  const hip = within(ctx.hipCm, size.hipMin, size.hipMax);
  return (bust + waist + hip) / 3;
}

const measurementsScorer: Scorer = {
  key: 'measurements',
  score(dress, ctx) {
    const inStock = dress.sizes.filter((s) => s.stock > 0);
    if (inStock.length === 0) {
      return { key: 'measurements', subScore: 0, matched: false, label: 'Currently out of stock in all sizes' };
    }
    let best = inStock[0]!;
    let bestFit = fitForSize(best, ctx);
    for (const s of inStock.slice(1)) {
      const f = fitForSize(s, ctx);
      if (f > bestFit) {
        best = s;
        bestFit = f;
      }
    }
    const matched = bestFit >= 0.85;
    return {
      key: 'measurements',
      subScore: bestFit,
      matched,
      label: matched
        ? `Fits your measurements (size ${best.label})`
        : `Closest fit is size ${best.label}`,
    };
  },
};

// ── 3. Age group (0.10) ──────────────────────────────────
const ageScorer: Scorer = {
  key: 'ageGroup',
  score(dress, ctx) {
    const { minAge, maxAge } = dress.ageGroup;
    if (ctx.age >= minAge && ctx.age <= maxAge) {
      return { key: 'ageGroup', subScore: 1, matched: true, label: `Suitable for the ${minAge}–${maxAge} age group` };
    }
    const yearsOut = ctx.age < minAge ? minAge - ctx.age : ctx.age - maxAge;
    return {
      key: 'ageGroup',
      subScore: clamp01(1 - yearsOut * 0.15),
      matched: false,
      label: `Targeted at ages ${minAge}–${maxAge}`,
    };
  },
};

// ── 4. Occasion (0.10) ───────────────────────────────────
const occasionScorer: Scorer = {
  key: 'occasion',
  score(dress, ctx) {
    const wanted = ctx.requestedOccasionIds.size > 0 ? ctx.requestedOccasionIds : ctx.favoriteOccasionIds;
    if (wanted.size === 0) {
      return { key: 'occasion', subScore: 0.5, matched: false, label: 'Suits a range of occasions' };
    }
    const hits = dress.occasionIds.filter((id) => wanted.has(id)).length;
    const subScore = clamp01(hits / wanted.size + (hits > 0 ? 0.3 : 0));
    return {
      key: 'occasion',
      subScore: hits > 0 ? Math.max(subScore, 0.7) : 0.15,
      matched: hits > 0,
      label: hits > 0 ? 'Recommended for your chosen occasions' : 'Different occasion focus',
    };
  },
};

// ── 5. Budget (0.10) ─────────────────────────────────────
const budgetScorer: Scorer = {
  key: 'budget',
  score(dress, ctx) {
    const price = dress.basePrice * (1 - dress.discountPct / 100);
    if (price <= ctx.budgetMax && price >= ctx.budgetMin * 0.5) {
      return { key: 'budget', subScore: 1, matched: true, label: 'Within your budget' };
    }
    if (price > ctx.budgetMax) {
      const over = (price - ctx.budgetMax) / Math.max(1, ctx.budgetMax);
      return {
        key: 'budget',
        subScore: clamp01(1 - over),
        matched: false,
        label: over <= 0.15 ? 'Slightly above your budget' : 'Above your budget',
      };
    }
    return { key: 'budget', subScore: 0.8, matched: true, label: 'Below your budget range' };
  },
};

// ── 6. Preferred color (0.05) ────────────────────────────
const colorScorer: Scorer = {
  key: 'color',
  score(dress, ctx) {
    if (ctx.preferredColorIds.size === 0) {
      return { key: 'color', subScore: 0.5, matched: false, label: 'No color preference set' };
    }
    const hit = dress.colorIds.some((id) => ctx.preferredColorIds.has(id));
    return {
      key: 'color',
      subScore: hit ? 1 : 0.2,
      matched: hit,
      label: hit ? 'Available in your preferred colors' : 'Not in your preferred colors',
    };
  },
};

// ── 7. Style (0.05) ──────────────────────────────────────
const styleScorer: Scorer = {
  key: 'style',
  score(dress, ctx) {
    if (ctx.preferredStyleIds.size === 0) {
      return { key: 'style', subScore: 0.5, matched: false, label: 'No style preference set' };
    }
    const hit = ctx.preferredStyleIds.has(dress.styleId);
    return {
      key: 'style',
      subScore: hit ? 1 : 0.3,
      matched: hit,
      label: hit ? 'Matches your preferred style' : 'A different style to your usual',
    };
  },
};

// ── 8. Brand (0.03) ──────────────────────────────────────
const brandScorer: Scorer = {
  key: 'brand',
  score(dress, ctx) {
    if (ctx.favoriteBrandIds.size === 0) {
      return { key: 'brand', subScore: 0.5, matched: false, label: 'No favourite brands set' };
    }
    const hit = ctx.favoriteBrandIds.has(dress.brandId);
    return {
      key: 'brand',
      subScore: hit ? 1 : 0.4,
      matched: hit,
      label: hit ? 'From one of your favourite brands' : 'A brand to discover',
    };
  },
};

// ── 9. Popularity (0.02) ─────────────────────────────────
const popularityScorer: Scorer = {
  key: 'popularity',
  score(dress) {
    const rating = clamp01(dress.ratingAvg / 5);
    const volume = clamp01(Math.log10(dress.ratingCount + 1) / 2);
    const subScore = clamp01(rating * 0.7 + volume * 0.3);
    return {
      key: 'popularity',
      subScore,
      matched: dress.ratingAvg >= 4.3 && dress.ratingCount >= 10,
      label: `Rated ${dress.ratingAvg.toFixed(1)}★ by ${dress.ratingCount} shoppers`,
    };
  },
};

/** Registry — the aggregator iterates these. Add a scorer here to extend the engine. */
export const SCORERS: Scorer[] = [
  bodyShapeScorer,
  measurementsScorer,
  ageScorer,
  occasionScorer,
  budgetScorer,
  colorScorer,
  styleScorer,
  brandScorer,
  popularityScorer,
];
