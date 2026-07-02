import { z } from 'zod';

export const generateSchema = z.object({
  occasionIds: z.array(z.string()).max(10).optional(),
  categoryId: z.string().optional(),
  seasonId: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(48).optional(),
});

export const selectDressSchema = z.object({
  dressId: z.string().min(1),
});

export const historyParamsSchema = z.object({
  id: z.string().min(1),
});
