import { prisma } from '../../config/prisma';
import { analyticsService } from '../analytics/analytics.service';
import { NotFound } from '../../utils/http-error';

/** Recomputes the denormalized rating aggregate after any review change. */
async function refreshRatingAggregate(dressId: string): Promise<void> {
  const agg = await prisma.review.aggregate({
    where: { dressId, isApproved: true },
    _avg: { rating: true },
    _count: { rating: true },
  });
  await prisma.dress.update({
    where: { id: dressId },
    data: {
      ratingAvg: Math.round((agg._avg.rating ?? 0) * 10) / 10,
      ratingCount: agg._count.rating,
    },
  });
}

export const reviewService = {
  list(dressId: string) {
    return prisma.review.findMany({
      where: { dressId, isApproved: true },
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { fullName: true, avatarUrl: true } } },
    });
  },

  async upsert(userId: string, dressId: string, data: { rating: number; title?: string; comment?: string }) {
    const dress = await prisma.dress.findUnique({ where: { id: dressId }, select: { id: true } });
    if (!dress) throw NotFound('Dress not found');

    const review = await prisma.review.upsert({
      where: { userId_dressId: { userId, dressId } },
      create: { userId, dressId, rating: data.rating, title: data.title, comment: data.comment },
      update: { rating: data.rating, title: data.title, comment: data.comment },
    });

    await refreshRatingAggregate(dressId);
    await analyticsService.log('REVIEW_CREATED', { userId, dressId, metadata: { rating: data.rating } });
    return review;
  },

  async remove(userId: string, dressId: string) {
    await prisma.review.deleteMany({ where: { userId, dressId } });
    await refreshRatingAggregate(dressId);
  },
};
