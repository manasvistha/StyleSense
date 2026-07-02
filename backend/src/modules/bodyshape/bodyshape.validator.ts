import { z } from 'zod';

/** Range-validated to mitigate the proposal's "inaccurate measurements" risk. */
export const measurementSchema = z.object({
  bustCm: z.coerce.number().min(50).max(180),
  waistCm: z.coerce.number().min(40).max(170),
  hipCm: z.coerce.number().min(50).max(190),
  shoulderCm: z.coerce.number().min(25).max(70).optional(),
});

export type MeasurementSchema = z.infer<typeof measurementSchema>;
