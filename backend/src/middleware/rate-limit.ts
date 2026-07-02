import rateLimit from 'express-rate-limit';
import { env } from '../config/env';

const windowMs = env.RATE_LIMIT_WINDOW_MIN * 60 * 1000;

const baseOptions = {
  windowMs,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Too many requests, please try again later.' },
  },
};

/** Global limiter applied to the whole API. */
export const globalLimiter = rateLimit({ ...baseOptions, max: env.RATE_LIMIT_MAX });

/** Stricter limiter for auth endpoints to slow brute-force attempts. */
export const authLimiter = rateLimit({ ...baseOptions, max: env.AUTH_RATE_LIMIT_MAX });
