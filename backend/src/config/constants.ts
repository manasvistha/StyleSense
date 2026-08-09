/** Application-wide constants and enumerations shared across modules. */

export const ROLES = {
  USER: 'USER',
  ADMIN: 'ADMIN',
} as const;
export type Role = (typeof ROLES)[keyof typeof ROLES];

export const BODY_SHAPES = {
  HOURGLASS: 'HOURGLASS',
  PEAR: 'PEAR',
  APPLE: 'APPLE',
  RECTANGLE: 'RECTANGLE',
  INVERTED_TRIANGLE: 'INVERTED_TRIANGLE',
} as const;
export type BodyShapeKey = (typeof BODY_SHAPES)[keyof typeof BODY_SHAPES];

/** Default recommendation factor weights (also seeded into the DB and editable). */
export const DEFAULT_RULE_WEIGHTS = {
  bodyShape: 0.28,
  measurements: 0.24,
  occasion: 0.12,
  budget: 0.1,
  ageGroup: 0.08,
  style: 0.05,
  color: 0.05,
  personalization: 0.05,
  brand: 0.02,
  popularity: 0.01,
} as const;
export type FactorKey = keyof typeof DEFAULT_RULE_WEIGHTS;

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 12,
  MAX_LIMIT: 60,
} as const;

export const RECOMMENDATION = {
  DEFAULT_RESULT_COUNT: 12,
  MIN_CONFIDENCE_TO_SHOW: 0, // surface everything; UI can threshold

  /**
   * Maximal Marginal Relevance trade-off used when re-ranking the final list.
   * 1.0 = pure relevance (allows near-duplicate results), 0.0 = pure novelty.
   *
   * Chosen from the sweep in `npm run eval`: 0.85 sits at the knee of the
   * relevance/diversity curve, keeping nDCG within ~0.03 of pure relevance
   * while raising intra-list diversity and catalogue coverage materially.
   */
  MMR_LAMBDA: 0.85,
  /** Candidates considered by the diversity re-ranker before truncation. */
  MMR_POOL_MULTIPLIER: 4,

  /**
   * Confidence is only trusted in full when the user's profile backs most of
   * the scoring weight. Below this coverage the UI should prompt for more data.
   */
  LOW_COVERAGE_THRESHOLD: 0.75,
  /** How far confidence is pulled toward neutral when coverage is incomplete. */
  COVERAGE_SHRINK: 0.5,
} as const;
