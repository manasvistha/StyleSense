import type { CandidateDress, DressLengthKey, ScoringContext, SizeRange } from './recommendation.types';

/**
 * Silhouette-aware size-fit assessment.
 *
 * The previous implementation asked "does an in-stock size exist that contains
 * these measurements?" — which, against a catalogue where nearly every garment
 * carries a full size run, is true for every dress. It therefore contributed a
 * constant to every score and could not influence the ranking at all.
 *
 * This version instead asks "how well does *this garment* fit *this body?*",
 * which varies per dress because it depends on:
 *   1. how close the measurements sit to the centre of the best available size
 *      (dead-centre fits better than scraping the boundary),
 *   2. which dimensions the cut actually depends on (a bodycon must fit
 *      everywhere; an empire-waist dress only really has to fit the bust),
 *   3. how much give the fabric has (jersey forgives, satin does not),
 *   4. whether the wearer is at the end of the stocked run with no size to
 *      grow into.
 */

const clamp01 = (n: number): number => Math.max(0, Math.min(1, n));

/** Fabric ease: how much deviation the material absorbs. >1 = forgiving. */
const FABRIC_EASE: Record<string, number> = {
  Jersey: 1.9,
  Chiffon: 1.35,
  Lace: 1.15,
  Velvet: 1.1,
  Linen: 1.05,
  Cotton: 1.0,
  Silk: 0.9,
  Satin: 0.85,
};
const DEFAULT_EASE = 1.0;

/**
 * Per-silhouette dimension criticality and how unforgiving the cut is.
 * `tightness` > 1 shrinks the tolerance band; < 1 widens it.
 */
interface Silhouette {
  bust: number;
  waist: number;
  hip: number;
  tightness: number;
}

const SILHOUETTE: Record<string, Silhouette> = {
  Bodycon: { bust: 0.33, waist: 0.34, hip: 0.33, tightness: 1.45 },
  Peplum: { bust: 0.3, waist: 0.45, hip: 0.25, tightness: 1.1 },
  Wrap: { bust: 0.35, waist: 0.45, hip: 0.2, tightness: 1.0 },
  'Fit & Flare': { bust: 0.38, waist: 0.44, hip: 0.18, tightness: 0.95 },
  'A-Line': { bust: 0.4, waist: 0.4, hip: 0.2, tightness: 0.85 },
  Maxi: { bust: 0.45, waist: 0.35, hip: 0.2, tightness: 0.85 },
  Shift: { bust: 0.5, waist: 0.25, hip: 0.25, tightness: 0.8 },
  'Empire Waist': { bust: 0.6, waist: 0.28, hip: 0.12, tightness: 0.75 },
};
const DEFAULT_SILHOUETTE: Silhouette = { bust: 0.34, waist: 0.33, hip: 0.33, tightness: 1.0 };

/** Longer, fuller skirts hide hip deviation; short cuts expose it. */
const LENGTH_HIP_FORGIVENESS: Record<DressLengthKey, number> = {
  MINI: 0.85,
  KNEE: 1.0,
  MIDI: 1.15,
  MAXI: 1.3,
  FLOOR: 1.35,
};

/**
 * Deviation → score. `e` is the deviation from the size's midpoint expressed in
 * tolerance units (e = 1 means "exactly at the edge of the size band").
 * Gaussian falloff keeps the signal continuous rather than bucketed:
 *   e=0 → 1.00 (dead centre)   e=1 → 0.78 (at the band edge)
 *   e=2 → 0.37 (a full size out)   e=3 → 0.11 (unwearable)
 */
const decay = (e: number): number => Math.exp(-0.25 * e * e);

function dimensionScore(value: number, min: number, max: number, tolerance: number): number {
  const mid = (min + max) / 2;
  const halfRange = Math.max(0.5, (max - min) / 2);
  const deviation = Math.abs(value - mid) / halfRange;
  return decay(deviation / Math.max(0.35, tolerance));
}

export interface FitAssessment {
  subScore: number;
  bestSize: SizeRange | null;
  label: string;
  hardFail?: string;
  penalty?: number;
  caveat?: string;
}

/** Fit quality of one specific size for this body and this garment. */
export function fitForSize(size: SizeRange, dress: CandidateDress, ctx: ScoringContext): number {
  const sil = SILHOUETTE[dress.styleName] ?? DEFAULT_SILHOUETTE;
  const ease = FABRIC_EASE[dress.fabricName] ?? DEFAULT_EASE;
  const tolerance = ease / sil.tightness;
  const hipTolerance = tolerance * (LENGTH_HIP_FORGIVENESS[dress.length] ?? 1);

  const bust = dimensionScore(ctx.bustCm, size.bustMin, size.bustMax, tolerance);
  const waist = dimensionScore(ctx.waistCm, size.waistMin, size.waistMax, tolerance);
  const hip = dimensionScore(ctx.hipCm, size.hipMin, size.hipMax, hipTolerance);

  return clamp01(bust * sil.bust + waist * sil.waist + hip * sil.hip);
}

/** Full assessment across the garment's stocked size run. */
export function assessFit(dress: CandidateDress, ctx: ScoringContext): FitAssessment {
  const inStock = dress.sizes.filter((s) => s.stock > 0);
  if (inStock.length === 0) {
    return {
      subScore: 0,
      bestSize: null,
      label: 'Out of stock in every size',
      hardFail: 'No sizes currently in stock',
    };
  }

  let best = inStock[0]!;
  let bestFit = fitForSize(best, dress, ctx);
  for (const s of inStock.slice(1)) {
    const f = fitForSize(s, dress, ctx);
    if (f > bestFit) {
      best = s;
      bestFit = f;
    }
  }

  // Nothing stocked comes close enough to be wearable — disqualify rather than
  // rank it low, so it cannot crowd out genuinely available options.
  if (bestFit < 0.3) {
    return {
      subScore: bestFit,
      bestSize: best,
      label: `No stocked size fits — closest is ${best.label}`,
      hardFail: `Nothing in stock fits your measurements (closest: ${best.label})`,
    };
  }

  // Edge-of-run: the wearer needs a size beyond what this dress carries, so
  // there is nothing to size into if the fit runs small or large.
  const run = [...inStock].sort((a, b) => a.sortOrder - b.sortOrder);
  const smallest = run[0]!;
  const largest = run[run.length - 1]!;
  const overLargest =
    best.sortOrder === largest.sortOrder &&
    (ctx.bustCm > largest.bustMax || ctx.waistCm > largest.waistMax || ctx.hipCm > largest.hipMax);
  const underSmallest =
    best.sortOrder === smallest.sortOrder &&
    (ctx.bustCm < smallest.bustMin || ctx.waistCm < smallest.waistMin || ctx.hipCm < smallest.hipMin);

  let penalty: number | undefined;
  let caveat: string | undefined;
  if (overLargest) {
    penalty = 0.85;
    caveat = `Runs up to ${largest.label} only — you are at the top of the size range`;
  } else if (underSmallest) {
    penalty = 0.9;
    caveat = `Starts at ${smallest.label} — you are at the bottom of the size range`;
  } else if (best.stock <= 2) {
    caveat = `Only ${best.stock} left in size ${best.label}`;
  }

  const matchedWell = bestFit >= 0.82;
  const label = matchedWell
    ? `Size ${best.label} fits your measurements well`
    : bestFit >= 0.6
      ? `Size ${best.label} is a workable fit`
      : `Size ${best.label} is the closest fit, with compromises`;

  return { subScore: bestFit, bestSize: best, label, penalty, caveat };
}
