import type { AnalyticsEventType, Prisma } from '@prisma/client';
import { analyticsRepository } from './analytics.repository';
import { logger } from '../../utils/logger';

interface LogOptions {
  userId?: string;
  dressId?: string;
  metadata?: Record<string, unknown>;
}

export const analyticsService = {
  /** Fire-and-forget event logging — never blocks or breaks the calling flow. */
  async log(type: AnalyticsEventType, opts: LogOptions = {}): Promise<void> {
    try {
      await analyticsRepository.create({
        type,
        userId: opts.userId,
        dressId: opts.dressId,
        metadata: (opts.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
      });
    } catch (err) {
      logger.warn('Failed to write analytics log', err);
    }
  },

  /** Aggregated dashboard payload for administrators. */
  async dashboard() {
    const [
      totalUsers,
      totalDresses,
      recommendationsGenerated,
      avgAgeAgg,
      shapeDist,
      ages,
      topRecommended,
      popularSelected,
      recentActivity,
    ] = await Promise.all([
      analyticsRepository.countUsers(),
      analyticsRepository.countDresses(),
      analyticsRepository.countEvents('RECOMMENDATION_GENERATED'),
      analyticsRepository.averageUserAge(),
      analyticsRepository.bodyShapeDistribution(),
      analyticsRepository.ageGroupActivity(),
      analyticsRepository.mostRecommendedDresses(5),
      analyticsRepository.popularSelectedDress(),
      analyticsRepository.recentActivity(10),
    ]);

    // Resolve body-shape names for the distribution.
    const shapeIds = shapeDist.map((s) => s.bodyShapeId).filter(Boolean) as string[];
    const shapes = await analyticsRepository.resolveBodyShapes(shapeIds);
    const shapeName = new Map(shapes.map((s) => [s.id, s.name]));
    const bodyShapeDistribution = shapeDist
      .filter((s) => s.bodyShapeId)
      .map((s) => ({
        shape: shapeName.get(s.bodyShapeId as string) ?? 'Unknown',
        count: s._count.bodyShapeId,
      }));
    const mostCommonBodyShape = bodyShapeDistribution[0]?.shape ?? null;

    // Age-band buckets (matches the platform's 18–35 focus).
    const bands = [
      { label: '18–24', min: 18, max: 24 },
      { label: '25–29', min: 25, max: 29 },
      { label: '30–35', min: 30, max: 35 },
    ];
    const ageDistribution = bands.map((b) => ({
      band: b.label,
      count: ages.filter((a) => a.age >= b.min && a.age <= b.max).length,
    }));
    const mostActiveAgeGroup =
      [...ageDistribution].sort((a, b) => b.count - a.count)[0]?.band ?? null;

    // Resolve dress names for "most recommended".
    const dressIds = topRecommended.map((d) => d.dressId);
    const dresses = await analyticsRepository.resolveDresses(dressIds);
    const dressName = new Map(dresses.map((d) => [d.id, d.name]));
    const mostRecommended = topRecommended.map((d) => ({
      dressId: d.dressId,
      name: dressName.get(d.dressId) ?? 'Unknown',
      count: d._count.dressId,
    }));

    let mostPopularDress: { dressId: string; name: string; selections: number } | null = null;
    const popular = popularSelected[0];
    if (popular?.selectedDressId) {
      const resolved = await analyticsRepository.resolveDresses([popular.selectedDressId]);
      mostPopularDress = {
        dressId: popular.selectedDressId,
        name: resolved[0]?.name ?? 'Unknown',
        selections: popular._count.selectedDressId,
      };
    }

    return {
      cards: {
        totalUsers,
        totalDresses,
        recommendationsGenerated,
        averageUserAge: Math.round((avgAgeAgg._avg.age ?? 0) * 10) / 10,
        mostCommonBodyShape,
        mostActiveAgeGroup,
        mostPopularDress,
      },
      bodyShapeDistribution,
      ageDistribution,
      mostRecommended,
      recentActivity: recentActivity.map((a) => ({
        id: a.id,
        type: a.type,
        user: a.user?.fullName ?? a.user?.email ?? 'System',
        createdAt: a.createdAt,
        metadata: a.metadata,
      })),
    };
  },

  async trend(days = 30) {
    const runs = await analyticsRepository.recommendationTrend(days);
    const buckets = new Map<string, { count: number; confidenceSum: number }>();
    for (const r of runs) {
      const day = r.createdAt.toISOString().slice(0, 10);
      const b = buckets.get(day) ?? { count: 0, confidenceSum: 0 };
      b.count += 1;
      b.confidenceSum += r.topConfidence;
      buckets.set(day, b);
    }
    return [...buckets.entries()].map(([date, b]) => ({
      date,
      recommendations: b.count,
      avgConfidence: Math.round(b.confidenceSum / b.count),
    }));
  },
};
