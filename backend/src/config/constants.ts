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
  bodyShape: 0.3,
  measurements: 0.25,
  ageGroup: 0.1,
  occasion: 0.1,
  budget: 0.1,
  color: 0.05,
  style: 0.05,
  brand: 0.03,
  popularity: 0.02,
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
} as const;
