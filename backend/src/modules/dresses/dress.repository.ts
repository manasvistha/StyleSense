import { prisma } from '../../config/prisma';
import type { Prisma } from '@prisma/client';

export interface DressFilters {
  search?: string;
  categoryId?: string;
  brandId?: string;
  styleId?: string;
  seasonId?: string;
  fabricId?: string;
  ageGroupId?: string;
  occasionId?: string;
  colorId?: string;
  bodyShapeId?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  featured?: boolean;
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'rating' | 'popular';
}

const dressListInclude = {
  brand: true,
  category: true,
  style: true,
  images: { where: { isPrimary: true }, take: 1 },
  colors: true,
} satisfies Prisma.DressInclude;

const dressDetailInclude = {
  brand: true,
  category: true,
  style: true,
  season: true,
  fabric: true,
  ageGroup: true,
  colors: true,
  occasions: true,
  suitableBodyShapes: true,
  images: { orderBy: { sortOrder: 'asc' as const } },
  inventory: { include: { size: true } },
  reviews: {
    where: { isApproved: true },
    orderBy: { createdAt: 'desc' as const },
    take: 10,
    include: { user: { select: { fullName: true, avatarUrl: true } } },
  },
} satisfies Prisma.DressInclude;

function buildWhere(f: DressFilters): Prisma.DressWhereInput {
  const where: Prisma.DressWhereInput = { isActive: true };

  if (f.search) {
    where.OR = [
      { name: { contains: f.search, mode: 'insensitive' } },
      { description: { contains: f.search, mode: 'insensitive' } },
      { brand: { name: { contains: f.search, mode: 'insensitive' } } },
    ];
  }
  if (f.categoryId) where.categoryId = f.categoryId;
  if (f.brandId) where.brandId = f.brandId;
  if (f.styleId) where.styleId = f.styleId;
  if (f.seasonId) where.seasonId = f.seasonId;
  if (f.fabricId) where.fabricId = f.fabricId;
  if (f.ageGroupId) where.ageGroupId = f.ageGroupId;
  if (f.featured !== undefined) where.isFeatured = f.featured;
  if (f.occasionId) where.occasions = { some: { id: f.occasionId } };
  if (f.colorId) where.colors = { some: { id: f.colorId } };
  if (f.bodyShapeId) where.suitableBodyShapes = { some: { id: f.bodyShapeId } };
  if (f.minPrice !== undefined || f.maxPrice !== undefined) {
    where.basePrice = {
      ...(f.minPrice !== undefined ? { gte: f.minPrice } : {}),
      ...(f.maxPrice !== undefined ? { lte: f.maxPrice } : {}),
    };
  }
  if (f.inStock) where.inventory = { some: { stock: { gt: 0 } } };
  return where;
}

function buildOrderBy(sort?: DressFilters['sort']): Prisma.DressOrderByWithRelationInput {
  switch (sort) {
    case 'price_asc':
      return { basePrice: 'asc' };
    case 'price_desc':
      return { basePrice: 'desc' };
    case 'rating':
      return { ratingAvg: 'desc' };
    case 'popular':
      return { popularityScore: 'desc' };
    case 'newest':
    default:
      return { createdAt: 'desc' };
  }
}

export const dressRepository = {
  list(filters: DressFilters, skip: number, take: number) {
    const where = buildWhere(filters);
    return prisma.$transaction([
      prisma.dress.count({ where }),
      prisma.dress.findMany({
        where,
        include: dressListInclude,
        orderBy: buildOrderBy(filters.sort),
        skip,
        take,
      }),
    ]);
  },

  findBySlug(slug: string) {
    return prisma.dress.findUnique({ where: { slug }, include: dressDetailInclude });
  },

  findById(id: string) {
    return prisma.dress.findUnique({ where: { id }, include: dressDetailInclude });
  },

  featured(take: number) {
    return prisma.dress.findMany({
      where: { isActive: true, isFeatured: true },
      include: dressListInclude,
      orderBy: { popularityScore: 'desc' },
      take,
    });
  },

  async recordView(userId: string | undefined, dressId: string) {
    await prisma.dress.update({
      where: { id: dressId },
      data: { popularityScore: { increment: 0.5 } },
    });
    if (userId) {
      await prisma.recentlyViewed.upsert({
        where: { userId_dressId: { userId, dressId } },
        create: { userId, dressId },
        update: { viewedAt: new Date() },
      });
    }
  },
};
