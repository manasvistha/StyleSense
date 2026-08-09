import { prisma } from '../../config/prisma';
import type { Prisma } from '@prisma/client';
import type { BodyShapeKey } from '../../config/constants';
import type {
  CandidateDress,
  DressLengthKey,
  ScoredDress,
  SleeveTypeKey,
} from './recommendation.types';

export interface CandidateFilters {
  categoryId?: string;
  occasionIds?: string[];
  maxPrice?: number;
  seasonId?: string;
}

export const recommendationRepository = {
  /** Loads active, in-catalog dresses with everything the scorers need. */
  async findCandidates(filters: CandidateFilters): Promise<CandidateDress[]> {
    const where: Prisma.DressWhereInput = {
      isActive: true,
      ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
      ...(filters.seasonId ? { seasonId: filters.seasonId } : {}),
      ...(filters.occasionIds && filters.occasionIds.length
        ? { occasions: { some: { id: { in: filters.occasionIds } } } }
        : {}),
    };

    const dresses = await prisma.dress.findMany({
      where,
      include: {
        ageGroup: true,
        style: { select: { name: true } },
        fabric: { select: { name: true } },
        colors: { select: { id: true } },
        occasions: { select: { id: true } },
        suitableBodyShapes: { select: { key: true } },
        inventory: { include: { size: true } },
      },
    });

    return dresses.map((d) => ({
      id: d.id,
      name: d.name,
      slug: d.slug,
      basePrice: d.basePrice,
      discountPct: d.discountPct,
      ratingAvg: d.ratingAvg,
      ratingCount: d.ratingCount,
      popularityScore: d.popularityScore,
      styleId: d.styleId,
      brandId: d.brandId,
      categoryId: d.categoryId,
      // Garment attributes — these drive silhouette reasoning in the scorers.
      styleName: d.style.name,
      fabricName: d.fabric.name,
      sleeveType: d.sleeveType as SleeveTypeKey,
      length: d.length as DressLengthKey,
      neckStyle: d.neckStyle,
      pattern: d.pattern,
      ageGroup: { minAge: d.ageGroup.minAge, maxAge: d.ageGroup.maxAge },
      colorIds: d.colors.map((c) => c.id),
      occasionIds: d.occasions.map((o) => o.id),
      suitableBodyShapeKeys: d.suitableBodyShapes.map((s) => s.key as BodyShapeKey),
      sizes: d.inventory.map((inv) => ({
        label: inv.size.label,
        sortOrder: inv.size.sortOrder,
        bustMin: inv.size.bustMin,
        bustMax: inv.size.bustMax,
        waistMin: inv.size.waistMin,
        waistMax: inv.size.waistMax,
        hipMin: inv.size.hipMin,
        hipMax: inv.size.hipMax,
        stock: inv.stock,
      })),
    }));
  },

  /** Hydrates scored results with display data for the response. */
  async hydrate(scored: ScoredDress[]) {
    const ids = scored.map((s) => s.dressId);
    const dresses = await prisma.dress.findMany({
      where: { id: { in: ids } },
      include: {
        brand: true,
        category: true,
        style: true,
        images: { orderBy: { sortOrder: 'asc' } },
        colors: true,
      },
    });
    const byId = new Map(dresses.map((d) => [d.id, d]));
    return scored
      .map((s, idx) => {
        const dress = byId.get(s.dressId);
        if (!dress) return null;
        return {
          rank: idx + 1,
          dress,
          score: s.score,
          confidence: s.confidence,
          coverage: s.coverage,
          penalty: s.penalty,
          factors: s.factors,
          reasons: s.reasons,
          caveats: s.caveats,
        };
      })
      .filter(Boolean);
  },

  saveHistory(data: {
    userId: string;
    bodyShapeId: string | null;
    inputSnapshot: Prisma.InputJsonValue;
    resultCount: number;
    topConfidence: number;
    coverage: number;
    items: {
      dressId: string;
      rank: number;
      score: number;
      confidence: number;
      factors: Prisma.InputJsonValue;
      reasons: string[];
      caveats: string[];
    }[];
  }) {
    return prisma.recommendationHistory.create({
      data: {
        userId: data.userId,
        bodyShapeId: data.bodyShapeId,
        inputSnapshot: data.inputSnapshot,
        resultCount: data.resultCount,
        topConfidence: data.topConfidence,
        coverage: data.coverage,
        items: { create: data.items },
      },
      include: { items: true },
    });
  },

  listHistory(userId: string, skip: number, take: number) {
    return prisma.$transaction([
      prisma.recommendationHistory.count({ where: { userId } }),
      prisma.recommendationHistory.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: {
          bodyShape: true,
          selectedDress: { select: { id: true, name: true, slug: true } },
          items: {
            orderBy: { rank: 'asc' },
            include: {
              dress: {
                include: { brand: true, images: { where: { isPrimary: true }, take: 1 } },
              },
            },
          },
        },
      }),
    ]);
  },

  getHistoryDetail(userId: string, historyId: string) {
    return prisma.recommendationHistory.findFirst({
      where: { id: historyId, userId },
      include: {
        bodyShape: true,
        selectedDress: true,
        items: {
          orderBy: { rank: 'asc' },
          include: { dress: { include: { brand: true, images: true, colors: true } } },
        },
      },
    });
  },

  setSelectedDress(userId: string, historyId: string, dressId: string) {
    return prisma.recommendationHistory.updateMany({
      where: { id: historyId, userId },
      data: { selectedDressId: dressId },
    });
  },
};
