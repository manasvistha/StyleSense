import { z } from 'zod';
import { slugify } from '../../utils/slugify';

/** Adds an auto-derived slug from `name`/`label` when one isn't supplied. */
const withSlug = <T extends z.ZodRawShape>(shape: T, source: 'name' | 'label' = 'name') =>
  z
    .object({ ...shape, slug: z.string().optional() })
    .transform((data) => ({
      ...data,
      slug: data.slug || slugify(String((data as Record<string, unknown>)[source] ?? '')),
    }));

// ── Lookup schemas ───────────────────────────────────────
export const categoryCreate = withSlug({
  name: z.string().min(2).max(60),
  description: z.string().max(300).optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
});
export const categoryUpdate = categoryCreate;

export const styleCreate = withSlug({
  name: z.string().min(2).max(60),
  description: z.string().max(300).optional(),
});
export const styleUpdate = styleCreate;

export const brandCreate = withSlug({
  name: z.string().min(1).max(60),
  logoUrl: z.string().url().optional().or(z.literal('')),
  country: z.string().max(60).optional(),
});
export const brandUpdate = brandCreate;

export const occasionCreate = withSlug({
  name: z.string().min(2).max(60),
  description: z.string().max(300).optional(),
});
export const occasionUpdate = occasionCreate;

export const seasonCreate = withSlug({ name: z.string().min(2).max(40) });
export const seasonUpdate = seasonCreate;

export const colorCreate = z.object({
  name: z.string().min(2).max(40),
  hex: z.string().regex(/^#([0-9a-fA-F]{6})$/, 'Use a #RRGGBB hex value'),
});
export const colorUpdate = colorCreate;

export const fabricCreate = z.object({
  name: z.string().min(2).max(60),
  description: z.string().max(300).optional(),
});
export const fabricUpdate = fabricCreate;

export const sizeCreate = z.object({
  label: z.string().min(1).max(10),
  sortOrder: z.coerce.number().int().min(0).default(0),
  bustMin: z.coerce.number(),
  bustMax: z.coerce.number(),
  waistMin: z.coerce.number(),
  waistMax: z.coerce.number(),
  hipMin: z.coerce.number(),
  hipMax: z.coerce.number(),
});
export const sizeUpdate = sizeCreate;

export const ageGroupCreate = withSlug(
  {
    label: z.string().min(2).max(20),
    minAge: z.coerce.number().int().min(0).max(120),
    maxAge: z.coerce.number().int().min(0).max(120),
  },
  'label',
);
export const ageGroupUpdate = ageGroupCreate;

export const bodyShapeCreate = z.object({
  key: z.string().min(2).max(40).toUpperCase(),
  name: z.string().min(2).max(40),
  description: z.string().min(2).max(500),
  stylingTips: z.string().max(1000).optional(),
});
export const bodyShapeUpdate = bodyShapeCreate.partial().extend({ name: z.string().min(2).max(40) });

// ── Users ────────────────────────────────────────────────
export const updateUserSchema = z.object({
  role: z.enum(['USER', 'ADMIN']).optional(),
  isActive: z.boolean().optional(),
});

// ── Recommendation rules ─────────────────────────────────
export const updateRuleSchema = z.object({
  weight: z.coerce.number().min(0).max(1).optional(),
  isActive: z.boolean().optional(),
});

// ── Dresses ──────────────────────────────────────────────
export const dressCreateSchema = z.object({
  name: z.string().min(2).max(140),
  description: z.string().min(10).max(4000),
  brandId: z.string().min(1),
  categoryId: z.string().min(1),
  styleId: z.string().min(1),
  seasonId: z.string().min(1),
  fabricId: z.string().min(1),
  ageGroupId: z.string().min(1),
  sleeveType: z.enum(['SLEEVELESS', 'CAP', 'SHORT', 'THREE_QUARTER', 'LONG']),
  length: z.enum(['MINI', 'KNEE', 'MIDI', 'MAXI', 'FLOOR']),
  neckStyle: z.string().min(1).max(60),
  pattern: z.string().min(1).max(60),
  material: z.string().min(1).max(60),
  basePrice: z.coerce.number().min(0),
  discountPct: z.coerce.number().int().min(0).max(90).default(0),
  isFeatured: z.boolean().default(false),
  isActive: z.boolean().default(true),
  recommendationTags: z.array(z.string()).max(15).default([]),
  colorIds: z.array(z.string()).default([]),
  occasionIds: z.array(z.string()).default([]),
  bodyShapeIds: z.array(z.string()).default([]),
  images: z
    .array(z.object({ url: z.string().url(), alt: z.string().optional(), isPrimary: z.boolean().optional() }))
    .default([]),
  inventory: z.array(z.object({ sizeId: z.string(), stock: z.coerce.number().int().min(0) })).default([]),
});

export const dressUpdateSchema = dressCreateSchema.partial();
