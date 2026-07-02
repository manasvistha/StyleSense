import type { NextFunction, Request, Response } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { Unauthorized } from '../utils/http-error';

/**
 * Verifies the Bearer access token and attaches `req.user`.
 * Accepts either an `Authorization: Bearer <token>` header or an httpOnly cookie.
 */
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  const bearer = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
  const token = bearer ?? (req.cookies?.accessToken as string | undefined);

  if (!token) {
    throw Unauthorized('Missing access token');
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, email: payload.email, role: payload.role };
    next();
  } catch {
    throw Unauthorized('Invalid or expired access token');
  }
}
