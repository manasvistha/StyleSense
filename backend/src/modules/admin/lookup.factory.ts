import { Router } from 'express';
import type { ZodTypeAny } from 'zod';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/async-handler';
import { ok, created } from '../../utils/response';
import { z } from 'zod';

/** Minimal shape every Prisma model delegate satisfies — keeps the factory generic. */
interface CrudDelegate {
  findMany(args?: unknown): Promise<unknown[]>;
  create(args: { data: unknown }): Promise<unknown>;
  update(args: { where: { id: string }; data: unknown }): Promise<unknown>;
  delete(args: { where: { id: string } }): Promise<unknown>;
}

interface LookupConfig {
  delegate: CrudDelegate;
  createSchema: ZodTypeAny;
  updateSchema: ZodTypeAny;
  orderBy?: Record<string, 'asc' | 'desc'>;
}

/** Narrows a concrete Prisma delegate to the generic CRUD surface this factory needs. */
export const asCrud = (delegate: unknown): CrudDelegate => delegate as CrudDelegate;

const idParam = z.object({ id: z.string().min(1) });

/**
 * Produces a full REST CRUD router for a simple reference/lookup entity.
 * Eliminates duplicated controllers across categories, brands, colors,
 * occasions, seasons, fabrics, styles, age-groups, sizes and body-shapes
 * (DRY + Open/Closed: new lookups are one config object away).
 */
export function createLookupRouter(config: LookupConfig): Router {
  const router = Router();
  const orderBy = config.orderBy ?? { name: 'asc' };

  router.get(
    '/',
    asyncHandler(async (_req, res) => {
      ok(res, { items: await config.delegate.findMany({ orderBy }) });
    }),
  );

  router.post(
    '/',
    validate({ body: config.createSchema }),
    asyncHandler(async (req, res) => {
      created(res, { item: await config.delegate.create({ data: req.body }) });
    }),
  );

  router.put(
    '/:id',
    validate({ params: idParam, body: config.updateSchema }),
    asyncHandler(async (req, res) => {
      ok(res, { item: await config.delegate.update({ where: { id: req.params.id }, data: req.body }) });
    }),
  );

  router.delete(
    '/:id',
    validate({ params: idParam }),
    asyncHandler(async (req, res) => {
      await config.delegate.delete({ where: { id: req.params.id } });
      ok(res, { message: 'Deleted' });
    }),
  );

  return router;
}
