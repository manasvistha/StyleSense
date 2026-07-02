import type { FactorKey } from '../../config/constants';
import type { BodyShapeKey } from '../../config/constants';

/** Normalized view of a candidate dress, as the scorers need it. */
export interface CandidateDress {
  id: string;
  name: string;
  slug: string;
  basePrice: number;
  discountPct: number;
  ratingAvg: number;
  ratingCount: number;
  popularityScore: number;
  styleId: string;
  brandId: string;
  ageGroup: { minAge: number; maxAge: number };
  colorIds: string[];
  occasionIds: string[];
  suitableBodyShapeKeys: BodyShapeKey[];
  sizes: SizeRange[];
}

export interface SizeRange {
  label: string;
  bustMin: number;
  bustMax: number;
  waistMin: number;
  waistMax: number;
  hipMin: number;
  hipMax: number;
  stock: number;
}

/** The user context the engine scores against. */
export interface ScoringContext {
  age: number;
  bustCm: number;
  waistCm: number;
  hipCm: number;
  bodyShapeKey: BodyShapeKey | null;
  budgetMin: number;
  budgetMax: number;
  preferredColorIds: Set<string>;
  preferredStyleIds: Set<string>;
  favoriteBrandIds: Set<string>;
  favoriteOccasionIds: Set<string>;
  /** Occasions explicitly requested for this run (overrides preferences when set). */
  requestedOccasionIds: Set<string>;
}

/** Output of a single scorer for one dress. */
export interface FactorScore {
  key: FactorKey;
  weight: number; // normalized weight applied
  subScore: number; // 0..1
  contribution: number; // weight * subScore
  label: string; // human-readable explanation
  matched: boolean; // whether this is a positive signal worth surfacing
}

export interface ScoredDress {
  dressId: string;
  score: number; // 0..1
  confidence: number; // 0..100
  factors: FactorScore[];
  reasons: string[];
}

/** A pluggable scoring strategy (Open/Closed: add factors without editing others). */
export interface Scorer {
  key: FactorKey;
  score(dress: CandidateDress, ctx: ScoringContext): Omit<FactorScore, 'weight' | 'contribution'>;
}
