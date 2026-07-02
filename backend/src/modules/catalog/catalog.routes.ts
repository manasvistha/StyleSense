import { Router } from 'express';
import { catalogService } from './catalog.service';
import { asyncHandler } from '../../utils/async-handler';
import { ok } from '../../utils/response';

const router = Router();

/** Public lookup data for filters and preference pickers. */
router.get(
  '/',
  asyncHandler(async (_req, res) => {
    ok(res, await catalogService.all());
  }),
);

router.get(
  '/categories',
  asyncHandler(async (_req, res) => {
    ok(res, { categories: await catalogService.categories() });
  }),
);

export const catalogRouter = router;
