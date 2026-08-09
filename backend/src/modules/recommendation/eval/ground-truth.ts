import type { BodyShapeKey } from '../../../config/constants';

/**
 * Hand-authored graded relevance labels used to evaluate ranking quality.
 *
 *   3 — ideal for this body shape
 *   2 — a good, recommendable choice
 *   1 — acceptable but not a selling point
 *   0 — unsuitable; should not appear near the top of a list
 *
 * Labels are judged on the garment's silhouette and neckline, which is how a
 * stylist assesses flattery, and deliberately ignore price, occasion, stock and
 * fit so the metric measures ranking quality rather than filter behaviour.
 *
 * IMPORTANT CAVEAT FOR THE WRITE-UP: these labels were authored alongside the
 * rule matrix in `style-rules.ts` and therefore encode overlapping domain
 * knowledge. They measure whether the *full pipeline* — fit, penalties,
 * calibration, tie-breaking and diversity — preserves expert styling intent,
 * which is a consistency check rather than independent validation. Before
 * reporting these numbers as evidence of accuracy, have a second person (ideally
 * a stylist) re-label this file blind and report agreement between the two sets.
 */
export const GROUND_TRUTH: Record<BodyShapeKey, Record<string, 0 | 1 | 2 | 3>> = {
  // Follow the natural curves and mark the waist; shapeless cuts hide the shape.
  HOURGLASS: {
    'emerald-wrap-midi-dress': 3,
    'cherry-jersey-wrap': 3,
    'garnet-wrap-midi': 3,
    'mocha-jersey-wrap': 3,
    'plum-faux-wrap-dress': 3,
    'scarlet-satin-bodycon': 3,
    'onyx-sweetheart-bodycon': 3,
    'ruby-fit-flare': 2,
    'burgundy-velvet-fit-flare': 2,
    'rose-satin-fit-flare': 2,
    'rosewood-chiffon-fit-flare': 2,
    'slate-tailored-wrap': 2,
    'marigold-ruched-wrap': 2,
    'sable-cowl-slip-dress': 2,
    'blush-a-line-tea-dress': 1,
    'pearl-a-line-bridal-guest': 1,
    'champagne-peplum-cocktail': 1,
    'office-sheath-shift': 0,
    'harbor-shift-dress': 0,
    'stone-ponte-shift': 0,
    'empire-waist-maxi': 0,
    'forest-empire-maxi': 0,
    'amber-kaftan-maxi': 0,
    'dune-linen-shift-mini': 0,
  },

  // Draw the eye upward and let the skirt skim the hip; avoid clinging cuts.
  PEAR: {
    'blush-a-line-tea-dress': 3,
    'petal-a-line-sundress': 3,
    'saffron-cap-sleeve-a-line': 3,
    'lilac-a-line-day-dress': 3,
    'emerald-swing-a-line': 3,
    'bellini-boat-neck-flare': 2,
    'coral-halter-swing-dress': 2,
    'sky-cotton-a-line': 2,
    'pearl-a-line-bridal-guest': 2,
    'willow-tiered-a-line': 2,
    'marigold-empire-sundress': 2,
    'rosalind-belted-fit-flare': 1,
    'sunlit-linen-wrap-dress': 1,
    'coastal-linen-maxi': 1,
    'amethyst-bodycon-mini': 0,
    'crimson-ribbed-bodycon': 0,
    'scarlet-satin-bodycon': 0,
    'onyx-sweetheart-bodycon': 0,
    'midnight-bodycon-gown': 0,
    'ember-peplum-cocktail': 0,
    'noir-lace-cocktail': 0,
  },

  // Skim the midsection, open the neckline, keep the line long and vertical.
  APPLE: {
    'meadow-empire-chiffon-maxi': 3,
    'verona-empire-gown': 3,
    'olive-empire-gown': 3,
    'amber-kaftan-maxi': 3,
    'harbour-vertical-stripe-shift': 3,
    'forest-empire-maxi': 2,
    'pewter-empire-midi': 2,
    'empire-waist-maxi': 2,
    'noir-lace-overlay-sheath': 2,
    'sand-linen-maxi': 2,
    'coastal-linen-maxi': 2,
    'slate-godet-maxi': 2,
    'stone-ponte-shift': 1,
    'harbor-shift-dress': 1,
    'mustard-casual-wrap': 1,
    'crimson-ribbed-bodycon': 0,
    'amethyst-bodycon-mini': 0,
    'scarlet-satin-bodycon': 0,
    'onyx-sweetheart-bodycon': 0,
    'ember-peplum-cocktail': 0,
    'champagne-peplum-cocktail': 0,
    'ivory-peplum-cocktail-dress': 0,
  },

  // Build curves and a waistline where the silhouette runs straight.
  RECTANGLE: {
    'ivory-peplum-cocktail-dress': 3,
    'chantilly-lace-peplum': 3,
    'poppy-polka-fit-flare': 3,
    'ember-peplum-cocktail': 3,
    'poppy-peplum-party-dress': 3,
    'champagne-peplum-cocktail': 2,
    'ink-peplum-sheath': 2,
    'cobalt-peplum-blazer-dress': 2,
    'marigold-ruched-wrap': 2,
    'garnet-wrap-midi': 2,
    'rose-satin-fit-flare': 2,
    'blush-lace-cocktail-dress': 2,
    'emerald-wrap-midi-dress': 1,
    'ruby-fit-flare': 1,
    'indigo-square-neck-midi': 1,
    'harbor-shift-dress': 0,
    'office-sheath-shift': 0,
    'stone-ponte-shift': 0,
    'amber-cotton-shift': 0,
    'dune-cotton-shift': 0,
    'amber-kaftan-maxi': 0,
    'dune-linen-shift-mini': 0,
  },

  // Add volume below the waist and soften the shoulder line.
  INVERTED_TRIANGLE: {
    'azure-swing-a-line-midi': 3,
    'willow-tiered-a-line': 3,
    'cobalt-pleated-midi': 3,
    'slate-godet-maxi': 3,
    'terracotta-tiered-maxi': 2,
    'sand-linen-maxi': 2,
    'meadow-empire-chiffon-maxi': 2,
    'verona-empire-gown': 2,
    'sable-cowl-slip-dress': 2,
    'sapphire-pleated-a-line': 1,
    'lilac-a-line-day-dress': 1,
    'sky-cotton-a-line': 1,
    'bellini-boat-neck-flare': 0,
    'saffron-cap-sleeve-a-line': 0,
    'emerald-swing-a-line': 0,
    'coral-halter-swing-dress': 0,
    'petal-a-line-sundress': 0,
    'blush-a-line-tea-dress': 0,
    'midnight-bodycon-gown': 0,
    'crimson-ribbed-bodycon': 0,
  },
};

/** A dress counts as "relevant" for precision when a stylist would recommend it. */
export const RELEVANCE_THRESHOLD = 2;
