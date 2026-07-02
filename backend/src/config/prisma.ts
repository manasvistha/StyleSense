import { PrismaClient } from '@prisma/client';
import { isProd } from './env';

/**
 * Single shared Prisma client (the only place the rest of the app reaches the DB).
 * In dev we cache it on globalThis so hot-reload (tsx watch) doesn't open a new
 * connection pool on every reload.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: isProd ? ['error'] : ['warn', 'error'],
  });

if (!isProd) globalForPrisma.prisma = prisma;
