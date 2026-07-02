import { createApp } from './app';
import { env } from './config/env';
import { prisma } from './config/prisma';
import { logger } from './utils/logger';
import { rulesService } from './modules/recommendation/rules.service';

async function bootstrap(): Promise<void> {
  const app = createApp();

  // Ensure one recommendation-rule row exists per scoring factor (idempotent).
  try {
    await rulesService.ensureSeeded();
  } catch (err) {
    logger.warn('Could not ensure recommendation rules are seeded (is the DB migrated?)', err);
  }

  const server = app.listen(env.PORT, () => {
    logger.info(`🚀 StyleSense API running at http://localhost:${env.PORT}${env.API_PREFIX}`);
    logger.info(`   Environment: ${env.NODE_ENV}`);
  });

  const shutdown = async (signal: string): Promise<void> => {
    logger.info(`Received ${signal}, shutting down gracefully...`);
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
    // Force-exit if it hangs
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('unhandledRejection', (reason) => logger.error('Unhandled rejection', reason));
}

void bootstrap();
