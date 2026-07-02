import type { NextFunction, Request, Response } from 'express';
import type { Role } from '../config/constants';
import { Forbidden, Unauthorized } from '../utils/http-error';

/**
 * Role-Based Access Control gate. Must run after `authenticate`.
 * Usage: router.get('/admin', authenticate, authorize('ADMIN'), handler)
 */
export function authorize(...allowed: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) throw Unauthorized();
    if (!allowed.includes(req.user.role)) {
      throw Forbidden('This action requires elevated privileges');
    }
    next();
  };
}
