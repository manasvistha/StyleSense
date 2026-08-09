import type { BodyShapeKey } from '../../config/constants';
import type { CandidateDress, DressLengthKey, SleeveTypeKey } from './recommendation.types';

/**
 * Body-shape suitability derived from a garment's actual attributes.
 *
 * Previously suitability came only from hand-applied `suitableBodyShapes` tags.
 * Those tags averaged 3.1 shapes per dress (RECTANGLE appeared on 93% of the
 * catalogue), so the heaviest scoring factor could not separate candidates, and
 * every new dress needed manual tagging to be recommendable at all.
 *
 * This module encodes the styling rules that were previously only prose in
 * `BodyShape.stylingTips` as a graded matrix over
 * (style, neckline, sleeve, length, pattern) × body shape, each contributing
 * −1 (actively unflattering) … +1 (ideal). Because it reads attributes every
 * dress already has, it scales to new stock with zero tagging and returns a
 * continuous score rather than the previous three buckets.
 *
 * Curated tags are retained as an admin override — see `deriveBodyShapeFit`.
 */

type Table = Partial<Record<string, number>>;

interface ShapeRules {
  /** Why this shape is styled the way it is — surfaced in explanations. */
  rationale: string;
  style: Table;
  neckStyle: Table;
  sleeveType: Partial<Record<SleeveTypeKey, number>>;
  length: Partial<Record<DressLengthKey, number>>;
  pattern: Table;
}

/** How much each attribute contributes to the overall suitability judgement. */
const ATTRIBUTE_WEIGHTS = {
  style: 0.45,
  neckStyle: 0.2,
  sleeveType: 0.15,
  length: 0.15,
  pattern: 0.05,
} as const;

const RULES: Record<BodyShapeKey, ShapeRules> = {
  // Balanced bust and hips with a defined waist — follow the curves, mark the waist.
  HOURGLASS: {
    rationale: 'emphasising your natural waist and following your balanced proportions',
    style: {
      Wrap: 0.95, Bodycon: 0.85, 'Fit & Flare': 0.8, Peplum: 0.5,
      'A-Line': 0.45, Maxi: 0.3, 'Empire Waist': -0.5, Shift: -0.7,
    },
    neckStyle: {
      'V-Neck': 0.6, Sweetheart: 0.6, Scoop: 0.4, Halter: 0.3, Square: 0.3,
      Cowl: 0.2, Round: 0, Boat: -0.2, High: -0.35,
    },
    sleeveType: { SLEEVELESS: 0.2, SHORT: 0.1, THREE_QUARTER: 0.1, LONG: 0, CAP: 0 },
    length: { KNEE: 0.4, MIDI: 0.4, MAXI: 0.2, FLOOR: 0.2, MINI: 0.1 },
    pattern: { Solid: 0.3, Lace: 0.2, Floral: 0.1, Striped: 0.1, 'Polka Dot': 0.1 },
  },

  // Hips wider than the bust — add interest above, let the skirt skim below.
  PEAR: {
    rationale: 'balancing your hips by drawing attention upward and skimming the lower half',
    style: {
      'A-Line': 0.95, 'Fit & Flare': 0.9, Wrap: 0.6, 'Empire Waist': 0.5,
      Maxi: 0.4, Shift: -0.2, Peplum: -0.35, Bodycon: -0.75,
    },
    neckStyle: {
      Boat: 0.7, Sweetheart: 0.5, Scoop: 0.5, Square: 0.45, Halter: 0.4,
      'V-Neck': 0.3, High: 0.3, Round: 0.2, Cowl: 0.2,
    },
    sleeveType: { CAP: 0.6, SHORT: 0.5, THREE_QUARTER: 0.3, LONG: 0.1, SLEEVELESS: 0 },
    length: { MAXI: 0.5, MIDI: 0.4, FLOOR: 0.4, KNEE: 0.3, MINI: -0.3 },
    pattern: { Floral: 0.3, Solid: 0.2, Striped: 0.15, Lace: 0.1, 'Polka Dot': 0.1 },
  },

  // Fuller midsection — skim the waist, open the neckline, keep the line vertical.
  APPLE: {
    rationale: 'skimming your midsection and lengthening the line with an open neckline',
    style: {
      'Empire Waist': 0.95, 'A-Line': 0.8, Shift: 0.7, Maxi: 0.6,
      Wrap: 0.5, 'Fit & Flare': 0.4, Peplum: -0.4, Bodycon: -0.9,
    },
    neckStyle: {
      'V-Neck': 0.8, Scoop: 0.55, Cowl: 0.5, Sweetheart: 0.4, Halter: 0.3,
      Square: 0.2, Boat: 0, Round: -0.2, High: -0.55,
    },
    sleeveType: { THREE_QUARTER: 0.5, LONG: 0.3, SHORT: 0.2, CAP: 0, SLEEVELESS: -0.1 },
    length: { MAXI: 0.5, MIDI: 0.4, FLOOR: 0.4, KNEE: 0.2, MINI: -0.2 },
    pattern: { Solid: 0.4, Striped: 0.35, Floral: 0.1, Lace: 0, 'Polka Dot': -0.1 },
  },

  // Bust, waist and hips of similar width — build curves and a waistline.
  RECTANGLE: {
    rationale: 'creating waist definition and curves where your silhouette runs straight',
    style: {
      Peplum: 0.95, 'Fit & Flare': 0.85, Wrap: 0.8, 'A-Line': 0.6,
      Bodycon: 0.3, 'Empire Waist': 0.1, Maxi: 0.1, Shift: -0.6,
    },
    neckStyle: {
      Sweetheart: 0.6, Scoop: 0.5, Square: 0.45, 'V-Neck': 0.4, Halter: 0.4,
      Boat: 0.3, Cowl: 0.3, Round: 0, High: -0.2,
    },
    sleeveType: { CAP: 0.3, SHORT: 0.2, SLEEVELESS: 0.2, THREE_QUARTER: 0.1, LONG: 0 },
    length: { KNEE: 0.4, MIDI: 0.3, MINI: 0.2, MAXI: 0.1, FLOOR: 0.1 },
    pattern: { Floral: 0.3, 'Polka Dot': 0.3, Lace: 0.25, Striped: 0.05, Solid: 0 },
  },

  // Broader shoulders or bust than hips — add volume below, soften above.
  INVERTED_TRIANGLE: {
    rationale: 'adding volume through the skirt to balance your broader shoulders',
    style: {
      'A-Line': 0.95, 'Fit & Flare': 0.85, Maxi: 0.6, Peplum: 0.6,
      'Empire Waist': 0.3, Wrap: 0.3, Shift: -0.1, Bodycon: -0.6,
    },
    neckStyle: {
      'V-Neck': 0.8, Scoop: 0.6, Cowl: 0.5, Sweetheart: 0.4, Round: 0,
      Square: -0.1, High: -0.4, Halter: -0.6, Boat: -0.7,
    },
    sleeveType: { THREE_QUARTER: 0.3, SLEEVELESS: 0.2, LONG: 0.2, SHORT: -0.2, CAP: -0.6 },
    length: { MAXI: 0.5, MIDI: 0.4, FLOOR: 0.4, KNEE: 0.3, MINI: 0 },
    pattern: { Floral: 0.2, Solid: 0.2, 'Polka Dot': 0.15, Striped: 0.1, Lace: 0.1 },
  },
};

/**
 * How strongly a curated tag pulls the derived score. Tags are an admin
 * override rather than the source of truth: they steer the outcome without
 * being able to flatten the ranking the way exhaustive tagging previously did.
 */
const TAG_OVERRIDE_STRENGTH = 0.35;
/** A dress tagged for other shapes but not this one is a mild negative signal. */
const UNTAGGED_TARGET = -0.35;

export interface BodyShapeFit {
  /** −1 (actively unflattering) … +1 (ideal for this shape). */
  score: number;
  /** The garment attributes that drove the verdict, strongest first. */
  drivers: { attribute: string; value: string; effect: number }[];
  rationale: string;
}

/** Grades how well a garment suits a body shape, from its attributes. */
export function deriveBodyShapeFit(dress: CandidateDress, shape: BodyShapeKey): BodyShapeFit {
  const rules = RULES[shape];

  const parts: { attribute: string; value: string; effect: number; weight: number }[] = [
    { attribute: 'style', value: dress.styleName, effect: rules.style[dress.styleName] ?? 0, weight: ATTRIBUTE_WEIGHTS.style },
    { attribute: 'neckline', value: dress.neckStyle, effect: rules.neckStyle[dress.neckStyle] ?? 0, weight: ATTRIBUTE_WEIGHTS.neckStyle },
    { attribute: 'sleeve', value: dress.sleeveType, effect: rules.sleeveType[dress.sleeveType] ?? 0, weight: ATTRIBUTE_WEIGHTS.sleeveType },
    { attribute: 'length', value: dress.length, effect: rules.length[dress.length] ?? 0, weight: ATTRIBUTE_WEIGHTS.length },
    { attribute: 'pattern', value: dress.pattern, effect: rules.pattern[dress.pattern] ?? 0, weight: ATTRIBUTE_WEIGHTS.pattern },
  ];

  const derived = parts.reduce((acc, p) => acc + p.effect * p.weight, 0);

  // Curated tags nudge the derived verdict without overwhelming it.
  let score = derived;
  if (dress.suitableBodyShapeKeys.length > 0) {
    const isTagged = dress.suitableBodyShapeKeys.includes(shape);
    const tagSignal = isTagged ? 1 : UNTAGGED_TARGET;
    const blended = derived * (1 - TAG_OVERRIDE_STRENGTH) + tagSignal * TAG_OVERRIDE_STRENGTH;
    // A tag may promote a garment the attributes underrate, but the *absence*
    // of a tag must never flatter one: blending toward a mild negative would
    // otherwise pull an actively unflattering cut back above the hard-fail line.
    score = isTagged ? blended : Math.min(derived, blended);
  }

  const drivers = parts
    .filter((p) => p.effect !== 0)
    .sort((a, b) => Math.abs(b.effect * b.weight) - Math.abs(a.effect * a.weight))
    .map(({ attribute, value, effect }) => ({ attribute, value, effect }));

  return { score: Math.max(-1, Math.min(1, score)), drivers, rationale: rules.rationale };
}

/** Maps the −1…1 suitability onto the 0…1 range the scorers work in. */
export const toSubScore = (fit: number): number => (fit + 1) / 2;
