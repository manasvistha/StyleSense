import { BODY_SHAPES, type BodyShapeKey } from '../../config/constants';

export interface MeasurementInput {
  bustCm: number;
  waistCm: number;
  hipCm: number;
  shoulderCm?: number | null;
}

export interface BodyShapeRatios {
  waistToBust: number; // waist / bust
  waistToHip: number; // waist / hip
  bustToHip: number; // bust / hip
  shoulderToHip?: number; // shoulder / hip (when shoulder provided)
}

export interface BodyShapeResult {
  key: BodyShapeKey;
  name: string;
  ratios: BodyShapeRatios;
  /** Plain-language justification shown to the user (explainability). */
  reason: string;
  /** Secondary, lower-confidence shape candidates with the rules that nearly fired. */
  alternatives: { key: BodyShapeKey; name: string }[];
}

const NAME: Record<BodyShapeKey, string> = {
  HOURGLASS: 'Hourglass',
  PEAR: 'Pear',
  APPLE: 'Apple',
  RECTANGLE: 'Rectangle',
  INVERTED_TRIANGLE: 'Inverted Triangle',
};

const round = (n: number, dp = 2): number => Math.round(n * 10 ** dp) / 10 ** dp;
const pct = (n: number): string => `${Math.round(n * 100)}%`;

/**
 * Deterministic, explainable body-shape classification from circumference
 * measurements. Uses widely published styling heuristics so every decision can
 * be justified in the thesis viva. Returns the chosen shape together with the
 * ratios and the rule that fired.
 *
 * Heuristics (tolerance ≈ 5%):
 *   Hourglass         — bust ≈ hip AND waist noticeably smaller (waist/bust ≤ 0.75)
 *   Pear (Triangle)   — hip larger than bust by ≥ 5%
 *   Inverted Triangle — bust/shoulder larger than hip by ≥ 5%
 *   Apple (Round)     — waist is the widest measurement
 *   Rectangle         — bust ≈ waist ≈ hip with an undefined waist
 */
export function analyzeBodyShape(m: MeasurementInput): BodyShapeResult {
  const { bustCm: bust, waistCm: waist, hipCm: hip, shoulderCm } = m;

  const ratios: BodyShapeRatios = {
    waistToBust: round(waist / bust),
    waistToHip: round(waist / hip),
    bustToHip: round(bust / hip),
    ...(shoulderCm ? { shoulderToHip: round(shoulderCm / hip) } : {}),
  };

  const TOL = 0.05;
  const bustHipBalanced = Math.abs(bust - hip) / Math.max(bust, hip) <= TOL;
  const definedWaist = waist / Math.min(bust, hip) <= 0.78;
  const hipDominant = (hip - bust) / bust >= TOL;
  const bustDominant = (bust - hip) / hip >= TOL;
  const shoulderDominant = shoulderCm ? (shoulderCm - hip) / hip >= TOL : false;
  const waistWidest = waist >= bust && waist >= hip;

  let key: BodyShapeKey;
  let reason: string;
  const alternatives: { key: BodyShapeKey; name: string }[] = [];

  if (waistWidest) {
    key = BODY_SHAPES.APPLE;
    reason = `Your waist (${waist}cm) is your widest measurement, carrying weight around the midsection — the defining trait of an Apple shape.`;
  } else if (bustHipBalanced && definedWaist) {
    key = BODY_SHAPES.HOURGLASS;
    reason = `Your bust (${bust}cm) and hips (${hip}cm) are well balanced while your waist is clearly narrower (waist-to-bust ratio ${pct(
      ratios.waistToBust,
    )}), giving a classic Hourglass silhouette.`;
    if (hipDominant) alternatives.push({ key: BODY_SHAPES.PEAR, name: NAME.PEAR });
  } else if (hipDominant) {
    key = BODY_SHAPES.PEAR;
    reason = `Your hips (${hip}cm) are ${pct(
      (hip - bust) / bust,
    )} larger than your bust (${bust}cm), placing your proportions in the Pear category.`;
    if (definedWaist) alternatives.push({ key: BODY_SHAPES.HOURGLASS, name: NAME.HOURGLASS });
  } else if (shoulderDominant || bustDominant) {
    key = BODY_SHAPES.INVERTED_TRIANGLE;
    const top = shoulderCm ? `shoulders (${shoulderCm}cm)` : `bust (${bust}cm)`;
    reason = `Your ${top} are broader than your hips (${hip}cm), which defines an Inverted Triangle shape.`;
  } else {
    key = BODY_SHAPES.RECTANGLE;
    reason = `Your bust (${bust}cm), waist (${waist}cm) and hips (${hip}cm) are fairly similar with little waist definition, which characterises a Rectangle shape.`;
    if (definedWaist) alternatives.push({ key: BODY_SHAPES.HOURGLASS, name: NAME.HOURGLASS });
  }

  return { key, name: NAME[key], ratios, reason, alternatives };
}

export const bodyShapeName = (key: BodyShapeKey): string => NAME[key];
