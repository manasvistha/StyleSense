import { Router } from 'express';
import { z } from 'zod';
import { reviewService } from './review.service';
import { authenticate } from '../../middleware/authenticate';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/async-handler';
import { ok, created } from '../../utils/response';

const router = Router();

const dressIdParam = z.object({ dressId: z.string().min(1) });
const reviewBody = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().max(120).optional(),
  comment: z.string().max(2000).optional(),
});

router.get(
  '/dress/:dressId',
  validate({ params: dressIdParam }),
  asyncHandler(async (req, res) => {
    ok(res, { reviews: await reviewService.list(req.params.dressId) });
  }),
);

router.post(
  '/dress/:dressId',
  authenticate,
  validate({ params: dressIdParam, body: reviewBody }),
  asyncHandler(async (req, res) => {
    const review = await reviewService.upsert(req.user!.id, req.params.dressId, req.body);
    created(res, { review });
  }),
);

router.delete(
  '/dress/:dressId',
  authenticate,
  validate({ params: dressIdParam }),
  asyncHandler(async (req, res) => {
    await reviewService.remove(req.user!.id, req.params.dressId);
    ok(res, { message: 'Review removed' });
  }),
);

export const reviewRouter = router;
