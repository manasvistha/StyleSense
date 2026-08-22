import fs from 'fs';
import path from 'path';
import type { BodyShapeKey } from '../../../config/constants';
import type {
  CandidateDress,
  DressLengthKey,
  ScoringContext,
  SleeveTypeKey,
} from '../recommendation.types';

/**
 * Loads the seed catalogue directly from `prisma/seed.ts` so the evaluation
 * harness runs without a database. Evaluating the same fixture the demo is
 * seeded from keeps reported metrics reproducible from a clean checkout.
 */

const SEED_PATH = path.resolve(process.cwd(), 'prisma/seed.ts');

const SIZE_TABLE = [
  { label: 'XS', sortOrder: 1, bustMin: 76, bustMax: 82, waistMin: 58, waistMax: 64, hipMin: 84, hipMax: 90 },
  { label: 'S', sortOrder: 2, bustMin: 82, bustMax: 88, waistMin: 64, waistMax: 70, hipMin: 90, hipMax: 96 },
  { label: 'M', sortOrder: 3, bustMin: 88, bustMax: 94, waistMin: 70, waistMax: 76, hipMin: 96, hipMax: 102 },
  { label: 'L', sortOrder: 4, bustMin: 94, bustMax: 102, waistMin: 76, waistMax: 84, hipMin: 102, hipMax: 110 },
  { label: 'XL', sortOrder: 5, bustMin: 102, bustMax: 110, waistMin: 84, waistMax: 94, hipMin: 110, hipMax: 118 },
  { label: 'XXL', sortOrder: 6, bustMin: 110, bustMax: 120, waistMin: 94, waistMax: 104, hipMin: 118, hipMax: 128 },
];

const AGE_BANDS: Record<string, { minAge: number; maxAge: number }> = {
  '18–24': { minAge: 18, maxAge: 24 },
  '25–29': { minAge: 25, maxAge: 29 },
  '30–35': { minAge: 30, maxAge: 35 },
};

export const slugify = (s: string): string =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

/** Extracts the `dresses` array literal from the seed module. */
// The literal is parsed out of the seed file at runtime, so its shape is not
// statically knowable here; callers narrow it themselves.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function readSeedDresses(): any[] {
  const src = fs.readFileSync(SEED_PATH, 'utf8');
  const declaration = src.indexOf('const dresses: DressSeed[] = [');
  const open = src.indexOf('[', src.indexOf('= [', declaration));
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    if (src[i] === '[') depth++;
    else if (src[i] === ']') {
      depth--;
      if (depth === 0) {
        // The literal is plain data — object and array syntax only.
        // eslint-disable-next-line no-eval
        return eval(src.slice(open, i + 1));
      }
    }
  }
  throw new Error('Could not locate the dress catalogue in prisma/seed.ts');
}

export function loadCatalogue(): CandidateDress[] {
  return readSeedDresses().map((d, i) => ({
    id: `d${String(i).padStart(3, '0')}`,
    name: d.name,
    slug: slugify(d.name),
    basePrice: d.basePrice,
    discountPct: d.discountPct,
    ratingAvg: d.rating,
    ratingCount: d.ratingCount,
    popularityScore: d.rating * d.ratingCount,
    styleId: d.style,
    brandId: d.brand,
    categoryId: d.category,
    styleName: d.style,
    fabricName: d.fabric,
    sleeveType: d.sleeveType as SleeveTypeKey,
    length: d.length as DressLengthKey,
    neckStyle: d.neckStyle,
    pattern: d.pattern,
    ageGroup: AGE_BANDS[d.age]!,
    colorIds: d.colors,
    occasionIds: d.occasions,
    suitableBodyShapeKeys: d.shapes as BodyShapeKey[],
    sizes: d.sizes.map((s: { label: string; stock: number }) => ({
      ...SIZE_TABLE.find((z) => z.label === s.label)!,
      stock: s.stock,
    })),
  }));
}

export const emptyAffinity = () => ({
  styleIds: new Map<string, number>(),
  colorIds: new Map<string, number>(),
  brandIds: new Map<string, number>(),
  lengths: new Map<string, number>(),
  signalCount: 0,
});

export interface EvalPersona {
  name: string;
  shape: BodyShapeKey;
  ctx: ScoringContext;
}

/**
 * Personas span the five body shapes and both ends of the profile-completeness
 * range, so the metrics cover the cold-start case as well as the ideal one.
 */
export function personas(): EvalPersona[] {
  const base = {
    hasBudget: false,
    budgetMin: 0,
    budgetMax: 100000,
    preferredColorIds: new Set<string>(),
    preferredStyleIds: new Set<string>(),
    favoriteBrandIds: new Set<string>(),
    favoriteOccasionIds: new Set<string>(),
    requestedOccasionIds: new Set<string>(),
    affinity: emptyAffinity(),
  };

  return [
    {
      name: 'Maya — Hourglass, 23, full profile',
      shape: 'HOURGLASS',
      ctx: {
        ...base,
        age: 23,
        bustCm: 90,
        waistCm: 68,
        hipCm: 96,
        bodyShapeKey: 'HOURGLASS',
        hasBudget: true,
        budgetMin: 1000,
        budgetMax: 8000,
        preferredColorIds: new Set(['Emerald', 'Burgundy', 'Black']),
        preferredStyleIds: new Set(['Wrap', 'Fit & Flare']),
        favoriteBrandIds: new Set(['Aurelia']),
        favoriteOccasionIds: new Set(['Party', 'Date Night']),
      },
    },
    {
      name: 'Aria — Pear, 28, measurements only',
      shape: 'PEAR',
      ctx: { ...base, age: 28, bustCm: 86, waistCm: 74, hipCm: 98, bodyShapeKey: 'PEAR' },
    },
    {
      name: 'Noor — Rectangle, 32, measurements only',
      shape: 'RECTANGLE',
      ctx: { ...base, age: 32, bustCm: 98, waistCm: 84, hipCm: 100, bodyShapeKey: 'RECTANGLE' },
    },
    {
      name: 'Lily — Inverted Triangle, 21, measurements only',
      shape: 'INVERTED_TRIANGLE',
      ctx: { ...base, age: 21, bustCm: 96, waistCm: 80, hipCm: 90, bodyShapeKey: 'INVERTED_TRIANGLE' },
    },
    {
      name: 'Devi — Apple, 30, measurements only',
      shape: 'APPLE',
      ctx: { ...base, age: 30, bustCm: 96, waistCm: 100, hipCm: 98, bodyShapeKey: 'APPLE' },
    },
  ];
}
