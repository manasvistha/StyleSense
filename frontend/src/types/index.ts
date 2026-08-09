export type Role = 'USER' | 'ADMIN';

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  avatarUrl: string | null;
  isEmailVerified: boolean;
}

export interface BodyShape {
  id: string;
  key: string;
  name: string;
  description: string;
  stylingTips: string | null;
}

export interface BodyShapeResult {
  key: string;
  name: string;
  ratios: { waistToBust: number; waistToHip: number; bustToHip: number; shoulderToHip?: number };
  reason: string;
  description: string | null;
  stylingTips: string | null;
  alternatives: { key: string; name: string }[];
}

export interface Lookup {
  id: string;
  name: string;
  slug?: string;
  hex?: string;
}

export interface CatalogData {
  categories: Lookup[];
  styles: Lookup[];
  brands: Lookup[];
  colors: Lookup[];
  occasions: Lookup[];
  seasons: Lookup[];
  fabrics: Lookup[];
  sizes: (Lookup & { label: string })[];
  ageGroups: { id: string; label: string; minAge: number; maxAge: number }[];
  bodyShapes: BodyShape[];
}

export interface DressImage {
  id: string;
  url: string;
  alt: string | null;
  isPrimary: boolean;
}

export interface DressListItem {
  id: string;
  name: string;
  slug: string;
  basePrice: number;
  discountPct: number;
  ratingAvg: number;
  ratingCount: number;
  isFeatured: boolean;
  brand: Lookup;
  category?: Lookup;
  images: DressImage[];
  colors: Lookup[];
}

export interface DressDetail extends DressListItem {
  description: string;
  neckStyle: string;
  pattern: string;
  material: string;
  sleeveType: string;
  length: string;
  recommendationTags: string[];
  style: Lookup;
  season: Lookup;
  fabric: Lookup;
  ageGroup: { id: string; label: string; minAge: number; maxAge: number };
  occasions: Lookup[];
  suitableBodyShapes: BodyShape[];
  inventory: { id: string; stock: number; size: { id: string; label: string } }[];
  reviews: Review[];
}

export interface Review {
  id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  createdAt: string;
  user: { fullName: string; avatarUrl: string | null };
}

export interface FactorScore {
  key: string;
  weight: number;
  subScore: number;
  contribution: number;
  label: string;
  matched: boolean;
  /** False when the profile holds no data for this factor, so it was not scored. */
  applicable: boolean;
}

export interface Recommendation {
  rank: number;
  dress: DressDetail;
  score: number;
  confidence: number;
  /** Share of scoring weight backed by real profile data (0..1). */
  coverage: number;
  /** Combined penalty multiplier applied to the score (1 = none). */
  penalty: number;
  factors: FactorScore[];
  reasons: string[];
  /** Honest negative signals shown alongside the reasons. */
  caveats: string[];
}

/** Tells the user which factors are dormant and how to activate them. */
export interface ProfileCompleteness {
  coverage: number;
  isLowConfidence: boolean;
  missing: { factor: string; action: string }[];
}

export interface RecommendationResponse {
  historyId: string | null;
  bodyShape: BodyShape | null;
  weights: Record<string, number>;
  completeness: ProfileCompleteness;
  excludedCount: number;
  excludedReasons: { reason: string; count: number }[];
  recommendations: Recommendation[];
}

export interface RecommendationRun {
  id: string;
  createdAt: string;
  resultCount: number;
  topConfidence: number;
  bodyShape: BodyShape | null;
  selectedDress: { id: string; name: string; slug: string } | null;
  coverage: number;
  items: {
    rank: number;
    confidence: number;
    score: number;
    reasons: string[];
    caveats: string[];
    factors: FactorScore[];
    dress: DressListItem;
  }[];
}

export interface Profile {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  role: Role;
  measurements: Measurements | null;
  preferences: Preferences | null;
}

export interface Measurements {
  age: number;
  heightCm: number;
  weightKg: number;
  bustCm: number;
  waistCm: number;
  hipCm: number;
  shoulderCm: number | null;
  skinTone: string | null;
  bodyShapeReason: string | null;
  bodyShape: BodyShape | null;
}

export interface Preferences {
  budgetMin: number;
  budgetMax: number;
  preferredColors: Lookup[];
  preferredStyles: Lookup[];
  favoriteBrands: Lookup[];
  favoriteOccasions: Lookup[];
}

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
