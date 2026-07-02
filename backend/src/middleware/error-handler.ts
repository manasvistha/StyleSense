import type { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { AppError } from '../utils/http-error';
import { isDev } from '../config/env';
import { logger } from '../utils/logger';

/** 404 fallback for unmatched routes. */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.originalUrl} not found` },
  });
}

/** Central error handler — converts any thrown error into the standard envelope. */
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  let statusCode = 500;
  let code = 'INTERNAL_ERROR';
  let message = 'Something went wrong';
  let details: unknown;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    code = err.code;
    message = err.message;
    details = err.details;
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      statusCode = 409;
      code = 'CONFLICT';
      const target = (err.meta?.target as string[] | undefined)?.join(', ');
      message = `A record with that ${target ?? 'value'} already exists`;
    } else if (err.code === 'P2025') {
      statusCode = 404;
      code = 'NOT_FOUND';
      message = 'Record not found';
    } else {
      statusCode = 400;
      code = 'DB_ERROR';
      message = 'Database request failed';
    }
  } else if (err instanceof Error) {
    message = err.message;
  }

  if (statusCode >= 500) {
    logger.error(`${code}: ${message}`, { requestId: req.requestId, stack: isDev ? (err as Error)?.stack : undefined });
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(details ? { details } : {}),
      ...(isDev && statusCode >= 500 && err instanceof Error ? { stack: err.stack } : {}),
    },
    requestId: req.requestId,
  });
}
