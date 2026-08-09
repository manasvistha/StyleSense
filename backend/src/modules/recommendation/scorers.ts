import type { BodyShapeKey } from '../../config/constants';
import { assessFit } from './fit';
import { deriveBodyShapeFit, toSubScore } from './style-rules';
import type { CandidateDress, Scorer, ScorerResult, ScoringContext } from './recommendation.types';

const clamp01 = (n: number): number => Math.max(0, Math.min(1, n));

const SHAPE_LABEL: Record<BodyShapeKey, string> = {
  HOURGLASS: 'Hourglass',
  PEAR: 'Pear',
  APPLE: 'Apple',
  RECTANGLE: 'Rectangle',
  INVERTED_TRIANGLE: 'Inverted Triangle',
};

/** "a Pear" but "an Apple" — these labels are shown directly to the user. */
const article = (word: string): string => (/^[aeiou]/i.test(word) ? 'an' : 'a');

/**
 * Every scorer distinguishes three states rather than the previous two:
 *   • `applicable: false` — the user gave us nothing to judge on. The factor is
 *     dropped and its weight redistributed, instead of contributing a neutral
 *     0.5 that inflated confidence without ever changing the ranking.
 *   • a low `subScore` — judged, and a poor match.
 *   • `penalty` / `hardFail` — actively harmful, so it suppresses or removes the
 *     candidate rather than merely ranking it a little lower.
 */

// ── 1. Body shape (0.28) ─────────────────────────────────
/**
 * Below this derived suitability the garment actively fights the silhouette.
 * Set at −0.45 rather than lower because the rule matrix's worst attainable
 * score is around −0.57: a stricter cut-off would only ever fire on the single
 * most extreme attribute combination and never rule anything out in practice.
 */
const SHAPE_HARD_FAIL = -0.45;
const SHAPE_PENALTY_ONSET = -0.15;

const bodyShapeScorer: Scorer = {
  key: 'bodyShape',
  score(dress, ctx): ScorerResult {
    if (!ctx.bodyShapeKey) {
      return {
        subScore: 0,
        matched: false,
        applicable: false,
        label: 'Add your measurements to unlock body-shape matching',
      };
    }

    const shapeLabel = SHAPE_LABEL[ctx.bodyShapeKey];
    const { score: fit, drivers, rationale } = deriveBodyShapeFit(dress, ctx.bodyShapeKey);
    const subScore = toSubScore(fit);
    const top = drivers[0];

    if (fit <= SHAPE_HARD_FAIL) {
      return {
        subScore,
        matched: false,
        label: `The ${dress.styleName.toLowerCase()} cut works against ${article(shapeLabel)} ${shapeLabel} shape`,
        hardFail: `Actively unflattering for ${article(shapeLabel)} ${shapeLabel} figure`,
      };
    }

    if (fit < SHAPE_PENALTY_ONSET) {
      // Scale the suppression with how wrong the silhouette is.
      const severity = (SHAPE_PENALTY_ONSET - fit) / (SHAPE_PENALTY_ONSET - SHAPE_HARD_FAIL);
      const worst = drivers.find((d) => d.effect < 0);
      return {
        subScore,
        matched: false,
        label: worst
          ? `The ${worst.value.toLowerCase()} ${worst.attribute} does not favour ${article(shapeLabel)} ${shapeLabel} shape`
          : `Not tailored to ${article(shapeLabel)} ${shapeLabel} shape`,
        penalty: 1 - 0.35 * clamp01(severity),
        caveat: worst ? `${worst.value} ${worst.attribute} is unflattering for ${shapeLabel} figures` : undefined,
      };
    }

    const matched = fit >= 0.35;
    return {
      subScore,
      matched,
      label: matched
        ? `Flatters your ${shapeLabel} shape by ${rationale}${top ? ` (${top.value.toLowerCase()} ${top.attribute})` : ''}`
        : `Neutral on ${article(shapeLabel)} ${shapeLabel} shape`,
    };
  },
};

// ── 2. Measurements / size fit (0.24) ────────────────────
const measurementsScorer: Scorer = {
  key: 'measurements',
  score(dress, ctx): ScorerResult {
    const fit = assessFit(dress, ctx);
    return {
      subScore: fit.subScore,
      matched: fit.subScore >= 0.82,
      label: fit.label,
      hardFail: fit.hardFail,
      penalty: fit.penalty,
      caveat: fit.caveat,
    };
  },
};

// ── 3. Age group (0.08) ──────────────────────────────────
const ageScorer: Scorer = {
  key: 'ageGroup',
  score(dress, ctx): ScorerResult {
    const { minAge, maxAge } = dress.ageGroup;
    if (ctx.age >= minAge && ctx.age <= maxAge) {
      return { subScore: 1, matched: true, label: `Styled for the ${minAge}–${maxAge} age group` };
    }
    const yearsOut = ctx.age < minAge ? minAge - ctx.age : ctx.age - maxAge;
    return {
      subScore: clamp01(1 - yearsOut * 0.14),
      matched: false,
      label: `Targeted at ages ${minAge}–${maxAge}`,
    };
  },
};

// ── 4. Occasion (0.12) ───────────────────────────────────
const occasionScorer: Scorer = {
  key: 'occasion',
  score(dress, ctx): ScorerResult {
    const requested = ctx.requestedOccasionIds.size > 0;
    const wanted = requested ? ctx.requestedOccasionIds : ctx.favoriteOccasionIds;

    if (wanted.size === 0) {
      return {
        subScore: 0,
        matched: false,
        applicable: false,
        label: 'Tell us the occasion to sharpen this match',
      };
    }

    const hits = dress.occasionIds.filter((id) => wanted.has(id)).length;
    if (hits === 0) {
      return {
        subScore: 0.1,
        matched: false,
        label: requested ? 'Not intended for the occasion you chose' : 'Outside your usual occasions',
      };
    }

    // Reward covering more of what was asked for, and being purpose-built for it
    // rather than being a catch-all that lists every occasion.
    const coverage = hits / wanted.size;
    const specificity = hits / dress.occasionIds.length;
    const subScore = clamp01(0.55 + 0.3 * coverage + 0.15 * specificity);
    return {
      subScore,
      matched: true,
      label: requested ? 'Made for the occasion you chose' : 'Suits the occasions you dress for most',
    };
  },
};

// ── 5. Budget (0.10) ─────────────────────────────────────
/** Beyond this multiple of the ceiling the dress is simply not an option. */
const BUDGET_HARD_FAIL_MULTIPLE = 1.6;

const budgetScorer: Scorer = {
  key: 'budget',
  score(dress, ctx): ScorerResult {
    if (!ctx.hasBudget) {
      return { subScore: 0, matched: false, applicable: false, label: 'Set a budget for price-aware matching' };
    }

    const price = dress.basePrice * (1 - dress.discountPct / 100);

    if (price > ctx.budgetMax) {
      const over = (price - ctx.budgetMax) / Math.max(1, ctx.budgetMax);
      if (price > ctx.budgetMax * BUDGET_HARD_FAIL_MULTIPLE) {
        return {
          subScore: 0,
          matched: false,
          label: 'Well beyond your budget',
          hardFail: `Priced ${Math.round(over * 100)}% above your maximum`,
        };
      }
      return {
        subScore: clamp01(1 - over * 1.6),
        matched: false,
        label: over <= 0.1 ? 'Just above your budget' : 'Above your budget',
        penalty: 1 - 0.25 * clamp01(over / (BUDGET_HARD_FAIL_MULTIPLE - 1)),
        caveat: `${Math.round(over * 100)}% over your budget`,
      };
    }

    if (price >= ctx.budgetMin) {
      // Best value sits comfortably inside the range rather than scraping the top.
      const headroom = (ctx.budgetMax - price) / Math.max(1, ctx.budgetMax - ctx.budgetMin);
      return { subScore: clamp01(0.85 + 0.15 * headroom), matched: true, label: 'Within your budget' };
    }

    // Cheaper than the user's stated floor — fine, but they signalled a quality bar.
    const under = (ctx.budgetMin - price) / Math.max(1, ctx.budgetMin);
    return { subScore: clamp01(0.9 - under * 0.4), matched: true, label: 'Below your budget range' };
  },
};

// ── 6. Preferred color (0.05) ────────────────────────────
const colorScorer: Scorer = {
  key: 'color',
  score(dress, ctx): ScorerResult {
    if (ctx.preferredColorIds.size === 0) {
      return { subScore: 0, matched: false, applicable: false, label: 'No colour preference set' };
    }
    const hits = dress.colorIds.filter((id) => ctx.preferredColorIds.has(id)).length;
    if (hits === 0) {
      return { subScore: 0.15, matched: false, label: 'Not offered in your preferred colours' };
    }
    return {
      subScore: clamp01(0.75 + 0.25 * (hits / Math.min(ctx.preferredColorIds.size, dress.colorIds.length))),
      matched: true,
      label: hits > 1 ? `Available in ${hits} of your preferred colours` : 'Available in a colour you prefer',
    };
  },
};

// ── 7. Style (0.05) ──────────────────────────────────────
const styleScorer: Scorer = {
  key: 'style',
  score(dress, ctx): ScorerResult {
    if (ctx.preferredStyleIds.size === 0) {
      return { subScore: 0, matched: false, applicable: false, label: 'No style preference set' };
    }
    const hit = ctx.preferredStyleIds.has(dress.styleId);
    return {
      subScore: hit ? 1 : 0.2,
      matched: hit,
      label: hit ? `${dress.styleName} is one of your preferred styles` : `A ${dress.styleName.toLowerCase()} cut, outside your usual`,
    };
  },
};

// ── 8. Brand (0.02) ──────────────────────────────────────
const brandScorer: Scorer = {
  key: 'brand',
  score(dress, ctx): ScorerResult {
    if (ctx.favoriteBrandIds.size === 0) {
      return { subScore: 0, matched: false, applicable: false, label: 'No favourite brands set' };
    }
    const hit = ctx.favoriteBrandIds.has(dress.brandId);
    return {
      subScore: hit ? 1 : 0.3,
      matched: hit,
      label: hit ? 'From one of your favourite brands' : 'A brand to discover',
    };
  },
};

// ── 9. Popularity (0.01) ─────────────────────────────────
const popularityScorer: Scorer = {
  key: 'popularity',
  score(dress): ScorerResult {
    const rating = clamp01(dress.ratingAvg / 5);
    const volume = clamp01(Math.log10(dress.ratingCount + 1) / 2.5);
    // popularityScore accumulates from real views and selections.
    const traction = clamp01(Math.log10(dress.popularityScore + 1) / 3.5);
    const subScore = clamp01(rating * 0.55 + volume * 0.25 + traction * 0.2);
    return {
      subScore,
      matched: dress.ratingAvg >= 4.3 && dress.ratingCount >= 10,
      label: dress.ratingCount > 0
        ? `Rated ${dress.ratingAvg.toFixed(1)}★ by ${dress.ratingCount} shoppers`
        : 'New in — no reviews yet',
    };
  },
};

// ── 10. Personalization from behaviour (0.05) ────────────
/** Signals needed before behavioural evidence is trusted at full strength. */
const AFFINITY_FULL_TRUST = 8;
const MIN_AFFINITY_SIGNALS = 2;

const personalizationScorer: Scorer = {
  key: 'personalization',
  score(dress, ctx): ScorerResult {
    const { affinity } = ctx;
    if (affinity.signalCount < MIN_AFFINITY_SIGNALS) {
      return {
        subScore: 0,
        matched: false,
        applicable: false,
        label: 'Save or select a few dresses to personalise this',
      };
    }

    const styleAffinity = affinity.styleIds.get(dress.styleId) ?? 0;
    const brandAffinity = affinity.brandIds.get(dress.brandId) ?? 0;
    const lengthAffinity = affinity.lengths.get(dress.length) ?? 0;
    const colorAffinity = dress.colorIds.length
      ? Math.max(...dress.colorIds.map((id) => affinity.colorIds.get(id) ?? 0))
      : 0;

    const raw = clamp01(
      styleAffinity * 0.35 + colorAffinity * 0.25 + lengthAffinity * 0.2 + brandAffinity * 0.2,
    );

    // Weak evidence should move the needle weakly, not decisively.
    const trust = clamp01(affinity.signalCount / AFFINITY_FULL_TRUST);
    const subScore = clamp01(0.5 + (raw - 0.5) * trust);

    const strongest = Math.max(styleAffinity, colorAffinity, lengthAffinity, brandAffinity);
    return {
      subScore,
      matched: raw >= 0.55 && trust >= 0.4,
      label:
        strongest >= 0.5
          ? 'Close to the dresses you keep coming back to'
          : 'A change of direction from your recent picks',
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
  personalizationScorer,
];
