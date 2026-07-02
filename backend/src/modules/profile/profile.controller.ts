import type { Request, Response } from 'express';
import { profileService } from './profile.service';
import { asyncHandler } from '../../utils/async-handler';
import { ok } from '../../utils/response';
import { env } from '../../config/env';

export const profileController = {
  get: asyncHandler(async (req: Request, res: Response) => {
    const profile = await profileService.get(req.user!.id);
    ok(res, { profile });
  }),

  updateBasics: asyncHandler(async (req: Request, res: Response) => {
    const user = await profileService.updateBasics(req.user!.id, req.body);
    ok(res, { user });
  }),

  updateMeasurements: asyncHandler(async (req: Request, res: Response) => {
    const result = await profileService.updateMeasurements(req.user!.id, req.body);
    ok(res, result);
  }),

  updatePreferences: asyncHandler(async (req: Request, res: Response) => {
    const preferences = await profileService.updatePreferences(req.user!.id, req.body);
    ok(res, { preferences });
  }),

  recentlyViewed: asyncHandler(async (req: Request, res: Response) => {
    const items = await profileService.recentlyViewed(req.user!.id);
    ok(res, { items });
  }),

  uploadAvatar: asyncHandler(async (req: Request, res: Response) => {
    const url = req.file ? `/uploads/${req.file.filename}` : undefined;
    if (url) await profileService.updateBasics(req.user!.id, { avatarUrl: `${url}` });
    ok(res, { avatarUrl: url, baseUrl: `http://localhost:${env.PORT}` });
  }),
};
