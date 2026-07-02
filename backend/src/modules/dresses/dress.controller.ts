import type { Request, Response } from 'express';
import { dressService } from './dress.service';
import { asyncHandler } from '../../utils/async-handler';
import { ok, buildPageMeta } from '../../utils/response';
import { getPageParams } from '../../utils/pagination';

export const dressController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, skip } = getPageParams(req.query.page, req.query.limit);
    const { total, dresses } = await dressService.list(req.query, skip, limit);
    ok(res, { dresses }, 200, buildPageMeta(total, page, limit));
  }),

  featured: asyncHandler(async (req: Request, res: Response) => {
    const take = Math.min(12, Math.max(1, Number(req.query.limit) || 8));
    ok(res, { dresses: await dressService.featured(take) });
  }),

  detail: asyncHandler(async (req: Request, res: Response) => {
    const dress = await dressService.getBySlug(req.params.slug, req.user?.id);
    ok(res, { dress });
  }),
};
