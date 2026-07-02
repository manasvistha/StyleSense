import { prisma } from '../../config/prisma';

/**
 * Read-only access to all reference/lookup data. Powers the public filter bar
 * and the profile preference pickers in a single round-trip.
 */
export const catalogService = {
  async all() {
    const [categories, styles, brands, colors, occasions, seasons, fabrics, sizes, ageGroups, bodyShapes] =
      await Promise.all([
        prisma.dressCategory.findMany({ orderBy: { name: 'asc' } }),
        prisma.dressStyle.findMany({ orderBy: { name: 'asc' } }),
        prisma.brand.findMany({ orderBy: { name: 'asc' } }),
        prisma.color.findMany({ orderBy: { name: 'asc' } }),
        prisma.occasion.findMany({ orderBy: { name: 'asc' } }),
        prisma.season.findMany({ orderBy: { name: 'asc' } }),
        prisma.fabric.findMany({ orderBy: { name: 'asc' } }),
        prisma.size.findMany({ orderBy: { sortOrder: 'asc' } }),
        prisma.ageGroup.findMany({ orderBy: { minAge: 'asc' } }),
        prisma.bodyShape.findMany({ orderBy: { name: 'asc' } }),
      ]);
    return { categories, styles, brands, colors, occasions, seasons, fabrics, sizes, ageGroups, bodyShapes };
  },

  categories() {
    return prisma.dressCategory.findMany({ orderBy: { name: 'asc' } });
  },
};
