import type { Request, Response } from 'express';
import { bodyShapeService } from './bodyshape.service';
import { asyncHandler } from '../../utils/async-handler';
import { ok } from '../../utils/response';

export const bodyShapeController = {
  /** Stateless analyzer — lets the UI preview a shape before saving a profile. */
  analyze: asyncHandler(async (req: Request, res: Response) => {
    const result = await bodyShapeService.analyze(req.body);
    ok(res, { result });
  }),

  list: asyncHandler(async (_req: Request, res: Response) => {
    const shapes = await bodyShapeService.listAll();
    ok(res, { shapes });
  }),
};
