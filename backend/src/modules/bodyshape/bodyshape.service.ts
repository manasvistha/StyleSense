import { prisma } from '../../config/prisma';
import { analyzeBodyShape, type MeasurementInput, type BodyShapeResult } from './bodyshape.analyzer';

export interface EnrichedBodyShapeResult extends BodyShapeResult {
  id: string | null;
  description: string | null;
  stylingTips: string | null;
}

export const bodyShapeService = {
  /** Runs the analyzer and enriches it with the persisted BodyShape metadata. */
  async analyze(measurements: MeasurementInput): Promise<EnrichedBodyShapeResult> {
    const result = analyzeBodyShape(measurements);
    const record = await prisma.bodyShape.findUnique({ where: { key: result.key } });
    return {
      ...result,
      id: record?.id ?? null,
      description: record?.description ?? null,
      stylingTips: record?.stylingTips ?? null,
    };
  },

  listAll() {
    return prisma.bodyShape.findMany({ orderBy: { name: 'asc' } });
  },
};
