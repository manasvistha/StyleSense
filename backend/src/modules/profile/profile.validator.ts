import { z } from 'zod';

export const updateProfileSchema = z.object({
  fullName: z.string().min(2).max(80).optional(),
  phone: z
    .string()
    .min(7)
    .max(20)
    .regex(/^[+0-9 ()-]+$/, 'Invalid phone number')
    .optional()
    .or(z.literal('')),
  avatarUrl: z.string().url().optional().or(z.literal('')),
});

export const updateMeasurementsSchema = z.object({
  age: z.coerce.number().int().min(18, 'This platform targets ages 18–35').max(35),
  heightCm: z.coerce.number().min(120).max(220),
  weightKg: z.coerce.number().min(30).max(200),
  bustCm: z.coerce.number().min(50).max(180),
  waistCm: z.coerce.number().min(40).max(170),
  hipCm: z.coerce.number().min(50).max(190),
  shoulderCm: z.coerce.number().min(25).max(70).optional(),
  skinTone: z.enum(['FAIR', 'LIGHT', 'MEDIUM', 'TAN', 'DEEP']).optional(),
});

export const updatePreferencesSchema = z.object({
  budgetMin: z.coerce.number().min(0).max(1_000_000).default(0),
  budgetMax: z.coerce.number().min(0).max(1_000_000).default(100000),
  preferredColorIds: z.array(z.string()).max(20).default([]),
  preferredStyleIds: z.array(z.string()).max(20).default([]),
  favoriteBrandIds: z.array(z.string()).max(20).default([]),
  favoriteOccasionIds: z.array(z.string()).max(20).default([]),
}).refine((d) => d.budgetMax >= d.budgetMin, {
  message: 'budgetMax must be greater than or equal to budgetMin',
  path: ['budgetMax'],
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdateMeasurementsInput = z.infer<typeof updateMeasurementsSchema>;
export type UpdatePreferencesInput = z.infer<typeof updatePreferencesSchema>;
