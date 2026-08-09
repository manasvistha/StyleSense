import { prisma } from '../../config/prisma';
import type { UserAffinity } from './recommendation.types';

/**
 * Builds a behavioural profile from what the user has actually done, closing
 * the feedback loop that the schema was already collecting data for but nothing
 * consumed: selections were written to `RecommendationHistory.selectedDressId`,
 * wishlist adds to `WishlistItem` and views to `RecentlyViewed`, yet all three
 * only ever reached the analytics dashboard. The engine could not learn.
 *
 * Signals are weighted by how much intent they demonstrate — choosing a dress
 * from a recommendation run is a far stronger endorsement than glancing at a
 * product page — and decayed by age so the profile tracks current taste.
 */

const SIGNAL_WEIGHT = {
  selected: 1.0,
  wishlisted: 0.6,
  viewed: 0.2,
} as const;

/** Signals older than this contribute nothing; newer ones decay linearly. */
const HALF_LIFE_DAYS = 60;
const MAX_SIGNALS_PER_SOURCE = 50;

const emptyAffinity = (): UserAffinity => ({
  styleIds: new Map(),
  colorIds: new Map(),
  brandIds: new Map(),
  lengths: new Map(),
  signalCount: 0,
});

function recencyFactor(at: Date, now: number): number {
  const ageDays = (now - at.getTime()) / 86_400_000;
  return Math.max(0.15, Math.pow(0.5, ageDays / HALF_LIFE_DAYS));
}

function bump(map: Map<string, number>, key: string | null | undefined, amount: number): void {
  if (!key) return;
  map.set(key, (map.get(key) ?? 0) + amount);
}

/** Rescales accumulated weights into 0..1 relevance, relative to the strongest. */
function normalize(map: Map<string, number>): void {
  const max = Math.max(...map.values(), 0);
  if (max <= 0) return;
  for (const [key, value] of map) map.set(key, value / max);
}

export const affinityService = {
  async forUser(userId: string): Promise<UserAffinity> {
    const dressSelect = {
      id: true,
      styleId: true,
      brandId: true,
      length: true,
      colors: { select: { id: true } },
    } as const;

    const [selections, wishlist, views] = await Promise.all([
      prisma.recommendationHistory.findMany({
        where: { userId, selectedDressId: { not: null } },
        orderBy: { createdAt: 'desc' },
        take: MAX_SIGNALS_PER_SOURCE,
        select: { createdAt: true, selectedDress: { select: dressSelect } },
      }),
      prisma.wishlistItem.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: MAX_SIGNALS_PER_SOURCE,
        select: { createdAt: true, dress: { select: dressSelect } },
      }),
      prisma.recentlyViewed.findMany({
        where: { userId },
        orderBy: { viewedAt: 'desc' },
        take: MAX_SIGNALS_PER_SOURCE,
        select: { viewedAt: true, dress: { select: dressSelect } },
      }),
    ]);

    const affinity = emptyAffinity();
    const now = Date.now();

    const record = (
      dress: { styleId: string; brandId: string; length: string; colors: { id: string }[] } | null,
      at: Date,
      weight: number,
    ): void => {
      if (!dress) return;
      const amount = weight * recencyFactor(at, now);
      bump(affinity.styleIds, dress.styleId, amount);
      bump(affinity.brandIds, dress.brandId, amount);
      bump(affinity.lengths, dress.length, amount);
      for (const c of dress.colors) bump(affinity.colorIds, c.id, amount);
      affinity.signalCount += 1;
    };

    for (const s of selections) record(s.selectedDress, s.createdAt, SIGNAL_WEIGHT.selected);
    for (const w of wishlist) record(w.dress, w.createdAt, SIGNAL_WEIGHT.wishlisted);
    for (const v of views) record(v.dress, v.viewedAt, SIGNAL_WEIGHT.viewed);

    normalize(affinity.styleIds);
    normalize(affinity.brandIds);
    normalize(affinity.lengths);
    normalize(affinity.colorIds);

    return affinity;
  },

  empty: emptyAffinity,
};
