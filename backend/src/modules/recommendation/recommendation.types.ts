import type { FactorKey } from '../../config/constants';
import type { BodyShapeKey } from '../../config/constants';

export type SleeveTypeKey = 'SLEEVELESS' | 'CAP' | 'SHORT' | 'THREE_QUARTER' | 'LONG';
export type DressLengthKey = 'MINI' | 'KNEE' | 'MIDI' | 'MAXI' | 'FLOOR';

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
  categoryId: string;
  /** Garment attributes — these drive silhouette reasoning, not just display. */
  styleName: string;
  fabricName: string;
  sleeveType: SleeveTypeKey;
  length: DressLengthKey;
  neckStyle: string;
  pattern: string;
  ageGroup: { minAge: number; maxAge: number };
  colorIds: string[];
  occasionIds: string[];
  /** Admin-curated body-shape tags. Used as an override on top of derived suitability. */
  suitableBodyShapeKeys: BodyShapeKey[];
  sizes: SizeRange[];
}

export interface SizeRange {
  label: string;
  sortOrder: number;
  bustMin: number;
  bustMax: number;
  waistMin: number;
  waistMax: number;
  hipMin: number;
  hipMax: number;
  stock: number;
}

/**
 * Learned affinity from a user's own behaviour (selections, wishlist, views).
 * Values are 0..1 relevance weights per attribute id/name.
 */
export interface UserAffinity {
  styleIds: Map<string, number>;
  colorIds: Map<string, number>;
  brandIds: Map<string, number>;
  lengths: Map<string, number>;
  /** Total number of behavioural signals behind this profile — drives trust. */
  signalCount: number;
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
  /** True when the user actually set a budget (vs. an unset default). */
  hasBudget: boolean;
  preferredColorIds: Set<string>;
  preferredStyleIds: Set<string>;
  favoriteBrandIds: Set<string>;
  favoriteOccasionIds: Set<string>;
  /** Occasions explicitly requested for this run (overrides preferences when set). */
  requestedOccasionIds: Set<string>;
  affinity: UserAffinity;
}

/** What a scorer returns before the engine applies weighting. */
export interface ScorerResult {
  subScore: number; // 0..1
  matched: boolean; // positive signal worth surfacing as a reason
  label: string; // human-readable explanation
  /**
   * False when the user supplied no data for this factor. Such factors are
   * dropped and their weight redistributed, instead of injecting a neutral 0.5
   * that inflates confidence without changing the ranking.
   */
  applicable?: boolean;
  /** 0..1 multiplier applied to the final score. Use for active, evidenced harm. */
  penalty?: number;
  /** Reason text when this factor disqualifies the candidate outright. */
  hardFail?: string;
  /** Negative signal surfaced honestly to the user. */
  caveat?: string;
}

/** Output of a single scorer for one dress, after weighting. */
export interface FactorScore {
  key: FactorKey;
  weight: number; // normalized weight applied (0 when not applicable)
  subScore: number; // 0..1
  contribution: number; // weight * subScore
  label: string;
  matched: boolean;
  applicable: boolean;
}

export interface ScoredDress {
  dressId: string;
  /** Weighted score over applicable factors only, after penalties. 0..1 */
  score: number;
  /** Score before penalties were applied — useful for explaining the drop. */
  baseScore: number;
  /** Combined penalty multiplier (1 = no penalty). */
  penalty: number;
  confidence: number; // 0..100, calibrated
  /** Share of total weight backed by real user data (0..1). Drives confidence trust. */
  coverage: number;
  factors: FactorScore[];
  reasons: string[];
  caveats: string[];
  /** Set when a hard constraint rules the dress out entirely. */
  disqualified?: string;
}

/** A pluggable scoring strategy (Open/Closed: add factors without editing others). */
export interface Scorer {
  key: FactorKey;
  score(dress: CandidateDress, ctx: ScoringContext): ScorerResult;
}
