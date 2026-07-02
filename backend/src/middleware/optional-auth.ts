import type { NextFunction, Request, Response } from 'express';
import { verifyAccessToken } from '../utils/jwt';

/**
 * Attaches `req.user` when a valid token is present, but never rejects the
 * request. Used on public endpoints that personalize when signed in
 * (e.g. recording a "recently viewed" dress).
 */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  const bearer = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
  const token = bearer ?? (req.cookies?.accessToken as string | undefined);
  if (token) {
    try {
      const payload = verifyAccessToken(token);
      req.user = { id: payload.sub, email: payload.email, role: payload.role };
    } catch {
      /* ignore — treat as anonymous */
    }
  }
  next();
}
