import { prisma } from '../../config/prisma';
import type { Prisma } from '@prisma/client';

export const profileRepository = {
  getFullProfile(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        avatarUrl: true,
        role: true,
        isEmailVerified: true,
        createdAt: true,
        measurements: { include: { bodyShape: true } },
        preferences: {
          include: {
            preferredColors: true,
            preferredStyles: true,
            favoriteBrands: true,
            favoriteOccasions: true,
          },
        },
      },
    });
  },

  updateUser(userId: string, data: Prisma.UserUpdateInput) {
    return prisma.user.update({
      where: { id: userId },
      data,
      select: { id: true, fullName: true, email: true, phone: true, avatarUrl: true },
    });
  },

  upsertMeasurements(userId: string, data: Prisma.UserMeasurementsUncheckedCreateInput) {
    const { userId: _omit, ...rest } = data;
    return prisma.userMeasurements.upsert({
      where: { userId },
      create: data,
      update: rest,
      include: { bodyShape: true },
    });
  },

  upsertPreferences(
    userId: string,
    budget: { budgetMin: number; budgetMax: number },
    relations: {
      preferredColorIds: string[];
      preferredStyleIds: string[];
      favoriteBrandIds: string[];
      favoriteOccasionIds: string[];
    },
  ) {
    const colors = relations.preferredColorIds.map((id) => ({ id }));
    const styles = relations.preferredStyleIds.map((id) => ({ id }));
    const brands = relations.favoriteBrandIds.map((id) => ({ id }));
    const occasions = relations.favoriteOccasionIds.map((id) => ({ id }));

    return prisma.userPreferences.upsert({
      where: { userId },
      create: {
        userId,
        ...budget,
        preferredColors: { connect: colors },
        preferredStyles: { connect: styles },
        favoriteBrands: { connect: brands },
        favoriteOccasions: { connect: occasions },
      },
      update: {
        ...budget,
        preferredColors: { set: colors },
        preferredStyles: { set: styles },
        favoriteBrands: { set: brands },
        favoriteOccasions: { set: occasions },
      },
      include: {
        preferredColors: true,
        preferredStyles: true,
        favoriteBrands: true,
        favoriteOccasions: true,
      },
    });
  },

  listRecentlyViewed(userId: string, limit: number) {
    return prisma.recentlyViewed.findMany({
      where: { userId },
      orderBy: { viewedAt: 'desc' },
      take: limit,
      include: {
        dress: {
          include: { brand: true, images: { where: { isPrimary: true }, take: 1 } },
        },
      },
    });
  },
};
