import { isDev } from '../config/env';

/** Minimal structured logger — swap for pino/winston in production without touching callers. */
function emit(level: 'info' | 'warn' | 'error', message: string, meta?: unknown): void {
  const entry = { ts: new Date().toISOString(), level, message, ...(meta ? { meta } : {}) };
  // eslint-disable-next-line no-console
  console[level === 'info' ? 'log' : level](isDev ? `[${level}] ${message}` : JSON.stringify(entry), isDev && meta ? meta : '');
}

export const logger = {
  info: (m: string, meta?: unknown) => emit('info', m, meta),
  warn: (m: string, meta?: unknown) => emit('warn', m, meta),
  error: (m: string, meta?: unknown) => emit('error', m, meta),
};
