import path from 'node:path';
import express, { type Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { env, isDev } from './config/env';
import { apiRouter } from './routes';
import { requestId } from './middleware/request-id';
import { globalLimiter } from './middleware/rate-limit';
import { errorHandler, notFoundHandler } from './middleware/error-handler';

/**
 * Builds and configures the Express application (the Business-Logic-Layer entry
 * point). Kept separate from server.ts so it can be imported by tests without
 * binding a port.
 */
export function createApp(): Application {
  const app = express();

  // ── Security & hardening ──────────────────────────────
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(
    cors({
      // In dev, Vite may pick a different port (5174, 5175…) if 5173 is taken by
      // another project, so accept any localhost origin. Prod stays strict.
      origin: isDev
        ? (origin, cb) => {
            if (!origin || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
              cb(null, true);
            } else {
              cb(new Error(`Origin ${origin} not allowed by CORS`));
            }
          }
        : env.CLIENT_URL,
      credentials: true,
    }),
  );

  // ── Parsing & tracing ─────────────────────────────────
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(requestId);
  if (isDev) app.use(morgan('dev'));

  // ── Static uploads ────────────────────────────────────
  app.use('/uploads', express.static(path.resolve(process.cwd(), env.UPLOAD_DIR)));

  // ── Rate limiting + API ───────────────────────────────
  app.use(env.API_PREFIX, globalLimiter, apiRouter);

  // ── Fallbacks ─────────────────────────────────────────
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
