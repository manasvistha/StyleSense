import { z } from 'zod';

export const listDressesQuery = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(60).optional(),
  search: z.string().trim().max(120).optional(),
  categoryId: z.string().optional(),
  brandId: z.string().optional(),
  styleId: z.string().optional(),
  seasonId: z.string().optional(),
  fabricId: z.string().optional(),
  ageGroupId: z.string().optional(),
  occasionId: z.string().optional(),
  colorId: z.string().optional(),
  bodyShapeId: z.string().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  inStock: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
  featured: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
  sort: z.enum(['newest', 'price_asc', 'price_desc', 'rating', 'popular']).optional(),
});

export const slugParam = z.object({ slug: z.string().min(1) });
export const idParam = z.object({ id: z.string().min(1) });
