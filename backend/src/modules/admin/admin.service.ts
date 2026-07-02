import { prisma } from '../../config/prisma';
import { slugify } from '../../utils/slugify';
import { NotFound } from '../../utils/http-error';
import type { z } from 'zod';
import type { dressCreateSchema, dressUpdateSchema } from './admin.validator';

type DressCreate = z.infer<typeof dressCreateSchema>;
type DressUpdate = z.infer<typeof dressUpdateSchema>;

async function uniqueSlug(base: string, ignoreId?: string): Promise<string> {
  let slug = slugify(base);
  let n = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await prisma.dress.findUnique({ where: { slug }, select: { id: true } });
    if (!existing || existing.id === ignoreId) return slug;
    slug = `${slugify(base)}-${++n}`;
  }
}

export const adminService = {
  // ── Users ──────────────────────────────────────────────
  listUsers(skip: number, take: number, search?: string) {
    const where = search
      ? {
          OR: [
            { fullName: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};
    return prisma.$transaction([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
          measurements: { select: { age: true, bodyShape: { select: { name: true } } } },
          _count: { select: { recommendationRuns: true, reviews: true } },
        },
      }),
    ]);
  },

  async updateUser(id: string, data: { role?: 'USER' | 'ADMIN'; isActive?: boolean }) {
    const user = await prisma.user.findUnique({ where: { id }, select: { id: true } });
    if (!user) throw NotFound('User not found');
    return prisma.user.update({
      where: { id },
      data,
      select: { id: true, fullName: true, email: true, role: true, isActive: true },
    });
  },

  // ── Dresses ────────────────────────────────────────────
  listDresses(skip: number, take: number, search?: string) {
    const where = search ? { name: { contains: search, mode: 'insensitive' as const } } : {};
    return prisma.$transaction([
      prisma.dress.count({ where }),
      prisma.dress.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: {
          brand: true,
          category: true,
          images: { where: { isPrimary: true }, take: 1 },
          _count: { select: { reviews: true, inventory: true } },
        },
      }),
    ]);
  },

  async createDress(input: DressCreate) {
    const slug = await uniqueSlug(input.name);
    return prisma.dress.create({
      data: {
        name: input.name,
        slug,
        description: input.description,
        brandId: input.brandId,
        categoryId: input.categoryId,
        styleId: input.styleId,
        seasonId: input.seasonId,
        fabricId: input.fabricId,
        ageGroupId: input.ageGroupId,
        sleeveType: input.sleeveType,
        length: input.length,
        neckStyle: input.neckStyle,
        pattern: input.pattern,
        material: input.material,
        basePrice: input.basePrice,
        discountPct: input.discountPct,
        isFeatured: input.isFeatured,
        isActive: input.isActive,
        recommendationTags: input.recommendationTags,
        colors: { connect: input.colorIds.map((id) => ({ id })) },
        occasions: { connect: input.occasionIds.map((id) => ({ id })) },
        suitableBodyShapes: { connect: input.bodyShapeIds.map((id) => ({ id })) },
        images: { create: input.images.map((img, i) => ({ ...img, sortOrder: i })) },
        inventory: { create: input.inventory.map((inv) => ({ sizeId: inv.sizeId, stock: inv.stock })) },
      },
      include: { images: true, inventory: true },
    });
  },

  async updateDress(id: string, input: DressUpdate) {
    const dress = await prisma.dress.findUnique({ where: { id }, select: { id: true, name: true } });
    if (!dress) throw NotFound('Dress not found');

    const scalar = {
      ...(input.name !== undefined ? { name: input.name, slug: await uniqueSlug(input.name, id) } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.brandId ? { brandId: input.brandId } : {}),
      ...(input.categoryId ? { categoryId: input.categoryId } : {}),
      ...(input.styleId ? { styleId: input.styleId } : {}),
      ...(input.seasonId ? { seasonId: input.seasonId } : {}),
      ...(input.fabricId ? { fabricId: input.fabricId } : {}),
      ...(input.ageGroupId ? { ageGroupId: input.ageGroupId } : {}),
      ...(input.sleeveType ? { sleeveType: input.sleeveType } : {}),
      ...(input.length ? { length: input.length } : {}),
      ...(input.neckStyle ? { neckStyle: input.neckStyle } : {}),
      ...(input.pattern ? { pattern: input.pattern } : {}),
      ...(input.material ? { material: input.material } : {}),
      ...(input.basePrice !== undefined ? { basePrice: input.basePrice } : {}),
      ...(input.discountPct !== undefined ? { discountPct: input.discountPct } : {}),
      ...(input.isFeatured !== undefined ? { isFeatured: input.isFeatured } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      ...(input.recommendationTags !== undefined ? { recommendationTags: input.recommendationTags } : {}),
      ...(input.colorIds ? { colors: { set: input.colorIds.map((cid) => ({ id: cid })) } } : {}),
      ...(input.occasionIds ? { occasions: { set: input.occasionIds.map((oid) => ({ id: oid })) } } : {}),
      ...(input.bodyShapeIds
        ? { suitableBodyShapes: { set: input.bodyShapeIds.map((bid) => ({ id: bid })) } }
        : {}),
    };

    return prisma.$transaction(async (tx) => {
      if (input.images) {
        await tx.dressImage.deleteMany({ where: { dressId: id } });
        await tx.dressImage.createMany({
          data: input.images.map((img, i) => ({ dressId: id, url: img.url, alt: img.alt, isPrimary: img.isPrimary ?? false, sortOrder: i })),
        });
      }
      if (input.inventory) {
        await tx.dressInventory.deleteMany({ where: { dressId: id } });
        await tx.dressInventory.createMany({
          data: input.inventory.map((inv) => ({ dressId: id, sizeId: inv.sizeId, stock: inv.stock })),
        });
      }
      return tx.dress.update({ where: { id }, data: scalar, include: { images: true, inventory: true } });
    });
  },

  async deleteDress(id: string) {
    await prisma.dress.delete({ where: { id } });
  },

  // ── Reviews moderation ─────────────────────────────────
  listReviews(skip: number, take: number) {
    return prisma.$transaction([
      prisma.review.count(),
      prisma.review.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: {
          user: { select: { fullName: true, email: true } },
          dress: { select: { name: true, slug: true } },
        },
      }),
    ]);
  },

  async setReviewApproval(id: string, isApproved: boolean) {
    return prisma.review.update({ where: { id }, data: { isApproved } });
  },
};
