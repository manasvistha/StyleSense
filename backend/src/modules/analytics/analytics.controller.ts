import type { Request, Response } from 'express';
import { analyticsService } from './analytics.service';
import { asyncHandler } from '../../utils/async-handler';
import { ok } from '../../utils/response';

export const analyticsController = {
  dashboard: asyncHandler(async (_req: Request, res: Response) => {
    ok(res, await analyticsService.dashboard());
  }),

  trend: asyncHandler(async (req: Request, res: Response) => {
    const days = Math.min(180, Math.max(7, Number(req.query.days) || 30));
    ok(res, { trend: await analyticsService.trend(days) });
  }),
};
