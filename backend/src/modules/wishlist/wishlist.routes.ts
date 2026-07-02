import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../config/prisma';
import { analyticsService } from '../analytics/analytics.service';
import { authenticate } from '../../middleware/authenticate';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/async-handler';
import { ok, created } from '../../utils/response';

const router = Router();
router.use(authenticate);

const dressIdParam = z.object({ dressId: z.string().min(1) });

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const items = await prisma.wishlistItem.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      include: {
        dress: { include: { brand: true, images: { where: { isPrimary: true }, take: 1 } } },
      },
    });
    ok(res, { items });
  }),
);

router.post(
  '/:dressId',
  validate({ params: dressIdParam }),
  asyncHandler(async (req, res) => {
    const item = await prisma.wishlistItem.upsert({
      where: { userId_dressId: { userId: req.user!.id, dressId: req.params.dressId } },
      create: { userId: req.user!.id, dressId: req.params.dressId },
      update: {},
    });
    await analyticsService.log('WISHLIST_ADDED', { userId: req.user!.id, dressId: req.params.dressId });
    created(res, { item });
  }),
);

router.delete(
  '/:dressId',
  validate({ params: dressIdParam }),
  asyncHandler(async (req, res) => {
    await prisma.wishlistItem.deleteMany({
      where: { userId: req.user!.id, dressId: req.params.dressId },
    });
    ok(res, { message: 'Removed from wishlist' });
  }),
);

export const wishlistRouter = router;
