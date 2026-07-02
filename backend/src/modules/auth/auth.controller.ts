import type { CookieOptions, Request, Response } from 'express';
import { authService } from './auth.service';
import { asyncHandler } from '../../utils/async-handler';
import { created, ok } from '../../utils/response';
import { isProd } from '../../config/env';

const refreshCookie: CookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: 'lax',
  path: '/',
  maxAge: 1000 * 60 * 60 * 24 * 7,
};

function setRefreshCookie(res: Response, token: string): void {
  res.cookie('refreshToken', token, refreshCookie);
}

export const authController = {
  register: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.register(req.body);
    setRefreshCookie(res, result.refreshToken);
    created(res, { user: result.user, accessToken: result.accessToken });
  }),

  login: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.login(req.body.email, req.body.password, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
    setRefreshCookie(res, result.refreshToken);
    ok(res, { user: result.user, accessToken: result.accessToken });
  }),

  refresh: asyncHandler(async (req: Request, res: Response) => {
    const token = (req.cookies?.refreshToken as string | undefined) ?? req.body?.refreshToken;
    const result = await authService.refresh(token);
    setRefreshCookie(res, result.refreshToken);
    ok(res, { accessToken: result.accessToken });
  }),

  logout: asyncHandler(async (_req: Request, res: Response) => {
    res.clearCookie('refreshToken', { ...refreshCookie, maxAge: undefined });
    ok(res, { message: 'Logged out' });
  }),

  me: asyncHandler(async (req: Request, res: Response) => {
    const user = await authService.me(req.user!.id);
    ok(res, { user });
  }),

  forgotPassword: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.forgotPassword(req.body.email);
    ok(res, {
      message: 'If an account exists for that email, a reset link has been sent.',
      // Dev-only convenience: real deployments email this instead.
      ...(result.resetToken && !isProd ? { devResetToken: result.resetToken } : {}),
    });
  }),

  resetPassword: asyncHandler(async (req: Request, res: Response) => {
    await authService.resetPassword(req.body.token, req.body.password);
    ok(res, { message: 'Password updated. You can now sign in.' });
  }),
};
