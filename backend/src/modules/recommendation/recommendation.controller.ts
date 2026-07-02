import type { Request, Response } from 'express';
import { recommendationService } from './recommendation.service';
import { asyncHandler } from '../../utils/async-handler';
import { ok, buildPageMeta } from '../../utils/response';
import { getPageParams } from '../../utils/pagination';

export const recommendationController = {
  generate: asyncHandler(async (req: Request, res: Response) => {
    const result = await recommendationService.generate(req.user!.id, req.body);
    ok(res, result);
  }),

  history: asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, skip } = getPageParams(req.query.page, req.query.limit);
    const { total, rows } = await recommendationService.history(req.user!.id, skip, limit);
    ok(res, { runs: rows }, 200, buildPageMeta(total, page, limit));
  }),

  historyDetail: asyncHandler(async (req: Request, res: Response) => {
    const detail = await recommendationService.historyDetail(req.user!.id, req.params.id);
    ok(res, { run: detail });
  }),

  selectDress: asyncHandler(async (req: Request, res: Response) => {
    const result = await recommendationService.selectDress(
      req.user!.id,
      req.params.id,
      req.body.dressId,
    );
    ok(res, result);
  }),
};
