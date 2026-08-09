import { prisma } from '../../config/prisma';
import { DEFAULT_RULE_WEIGHTS, type FactorKey } from '../../config/constants';
import { SCORERS } from './scorers';
import { normalizeWeights, type WeightMap } from './engine';
import { NotFound } from '../../utils/http-error';

const FACTOR_LABELS: Record<FactorKey, { label: string; description: string }> = {
  bodyShape: { label: 'Body Shape', description: 'How well the dress flatters the user’s detected body shape.' },
  measurements: { label: 'Measurements / Size', description: 'How closely the user’s bust/waist/hip fit an available size.' },
  ageGroup: { label: 'Age Group', description: 'Whether the dress targets the user’s age band.' },
  occasion: { label: 'Occasion', description: 'Overlap between the dress and the requested/favourite occasions.' },
  budget: { label: 'Budget', description: 'Whether the price sits within the user’s budget range.' },
  color: { label: 'Preferred Color', description: 'Availability in the user’s preferred colours.' },
  style: { label: 'Style', description: 'Match with the user’s preferred dress styles.' },
  brand: { label: 'Brand', description: 'Whether the dress is from a favourite brand.' },
  popularity: { label: 'Popularity', description: 'Community rating and review volume.' },
  personalization: {
    label: 'Learned Taste',
    description: 'Similarity to dresses the user has previously selected, saved or viewed.',
  },
};

export const rulesService = {
  /** Ensures one rule row exists per registered scorer (idempotent bootstrap). */
  async ensureSeeded() {
    for (const scorer of SCORERS) {
      const meta = FACTOR_LABELS[scorer.key];
      await prisma.recommendationRule.upsert({
        where: { factorKey: scorer.key },
        create: {
          factorKey: scorer.key,
          label: meta.label,
          description: meta.description,
          weight: DEFAULT_RULE_WEIGHTS[scorer.key],
          isActive: true,
        },
        update: {}, // never overwrite admin-tuned values on boot
      });
    }
  },

  list() {
    return prisma.recommendationRule.findMany({ orderBy: { weight: 'desc' } });
  },

  /** Active weights as a raw map (the engine normalizes them). */
  async activeWeights(): Promise<WeightMap> {
    const rules = await prisma.recommendationRule.findMany({ where: { isActive: true } });
    const map: WeightMap = {};
    for (const r of rules) map[r.factorKey as FactorKey] = r.weight;
    return map;
  },

  /** Normalized preview so the admin UI can show effective percentages. */
  async normalizedPreview() {
    const weights = await this.activeWeights();
    const normalized = normalizeWeights(weights);
    return Object.entries(normalized).map(([key, value]) => ({
      factorKey: key,
      effectiveWeight: Math.round(value * 1000) / 1000,
      effectivePercent: Math.round(value * 100),
    }));
  },

  async update(factorKey: string, data: { weight?: number; isActive?: boolean }) {
    const existing = await prisma.recommendationRule.findUnique({ where: { factorKey } });
    if (!existing) throw NotFound(`No recommendation rule for "${factorKey}"`);
    return prisma.recommendationRule.update({
      where: { factorKey },
      data: {
        ...(data.weight !== undefined ? { weight: data.weight } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      },
    });
  },

  async resetDefaults() {
    for (const scorer of SCORERS) {
      await prisma.recommendationRule.update({
        where: { factorKey: scorer.key },
        data: { weight: DEFAULT_RULE_WEIGHTS[scorer.key], isActive: true },
      });
    }
    return this.list();
  },
};
