import { Router } from 'express';
import { prisma } from '../../config/prisma';
import { asyncHandler } from '../../utils/async-handler';
import { ok } from '../../utils/response';

const router = Router();

/** Liveness + DB connectivity probe. */
router.get(
  '/',
  asyncHandler(async (_req, res) => {
    await prisma.$queryRaw`SELECT 1`;
    ok(res, { status: 'ok', service: 'stylesense-api', time: new Date().toISOString() });
  }),
);

export const healthRouter = router;
