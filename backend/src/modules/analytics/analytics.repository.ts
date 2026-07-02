import { prisma } from '../../config/prisma';
import type { AnalyticsEventType, Prisma } from '@prisma/client';

export const analyticsRepository = {
  create(data: Prisma.AnalyticsLogUncheckedCreateInput) {
    return prisma.analyticsLog.create({ data });
  },

  countEvents(type: AnalyticsEventType) {
    return prisma.analyticsLog.count({ where: { type } });
  },

  // ── Aggregations for the admin dashboard ──────────────
  countUsers() {
    return prisma.user.count({ where: { role: 'USER' } });
  },

  countDresses() {
    return prisma.dress.count({ where: { isActive: true } });
  },

  averageUserAge() {
    return prisma.userMeasurements.aggregate({ _avg: { age: true } });
  },

  bodyShapeDistribution() {
    return prisma.userMeasurements.groupBy({
      by: ['bodyShapeId'],
      _count: { bodyShapeId: true },
      orderBy: { _count: { bodyShapeId: 'desc' } },
    });
  },

  ageGroupActivity() {
    // Raw age buckets derived from measurements.
    return prisma.userMeasurements.findMany({ select: { age: true } });
  },

  mostRecommendedDresses(limit: number) {
    return prisma.recommendationItem.groupBy({
      by: ['dressId'],
      _count: { dressId: true },
      orderBy: { _count: { dressId: 'desc' } },
      take: limit,
    });
  },

  popularSelectedDress() {
    return prisma.recommendationHistory.groupBy({
      by: ['selectedDressId'],
      where: { selectedDressId: { not: null } },
      _count: { selectedDressId: true },
      orderBy: { _count: { selectedDressId: 'desc' } },
      take: 1,
    });
  },

  recommendationTrend(days: number) {
    // Group runs by day for the trend chart.
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return prisma.recommendationHistory.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true, topConfidence: true },
      orderBy: { createdAt: 'asc' },
    });
  },

  recentActivity(limit: number) {
    return prisma.analyticsLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { user: { select: { fullName: true, email: true } } },
    });
  },

  resolveBodyShapes(ids: string[]) {
    return prisma.bodyShape.findMany({ where: { id: { in: ids } } });
  },

  resolveDresses(ids: string[]) {
    return prisma.dress.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true, slug: true, ratingAvg: true, basePrice: true },
    });
  },
};
