/**
 * Typed application errors. Throwing an AppError anywhere in the business layer
 * produces a consistent JSON envelope via the central error handler.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;
  public readonly isOperational: boolean;

  constructor(statusCode: number, code: string, message: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const BadRequest = (message = 'Bad request', details?: unknown) =>
  new AppError(400, 'BAD_REQUEST', message, details);

export const Unauthorized = (message = 'Authentication required') =>
  new AppError(401, 'UNAUTHORIZED', message);

export const Forbidden = (message = 'You do not have permission to do that') =>
  new AppError(403, 'FORBIDDEN', message);

export const NotFound = (message = 'Resource not found') =>
  new AppError(404, 'NOT_FOUND', message);

export const Conflict = (message = 'Resource already exists') =>
  new AppError(409, 'CONFLICT', message);

export const UnprocessableEntity = (message = 'Validation failed', details?: unknown) =>
  new AppError(422, 'VALIDATION_ERROR', message, details);

export const TooManyRequests = (message = 'Too many requests') =>
  new AppError(429, 'RATE_LIMITED', message);
