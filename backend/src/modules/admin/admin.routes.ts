import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../config/prisma';
import { adminService } from './admin.service';
import { rulesService } from '../recommendation/rules.service';
import { createLookupRouter, asCrud } from './lookup.factory';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/async-handler';
import { ok, created, buildPageMeta } from '../../utils/response';
import { getPageParams } from '../../utils/pagination';
import {
  ageGroupCreate,
  ageGroupUpdate,
  bodyShapeCreate,
  bodyShapeUpdate,
  brandCreate,
  brandUpdate,
  categoryCreate,
  categoryUpdate,
  colorCreate,
  colorUpdate,
  dressCreateSchema,
  dressUpdateSchema,
  fabricCreate,
  fabricUpdate,
  occasionCreate,
  occasionUpdate,
  seasonCreate,
  seasonUpdate,
  sizeCreate,
  sizeUpdate,
  styleCreate,
  styleUpdate,
  updateRuleSchema,
  updateUserSchema,
} from './admin.validator';

const router = Router();

// Every admin route requires an authenticated ADMIN.
router.use(authenticate, authorize('ADMIN'));

const idParam = z.object({ id: z.string().min(1) });

// ── Users ──────────────────────────────────────────────
router.get(
  '/users',
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPageParams(req.query.page, req.query.limit);
    const [total, users] = await adminService.listUsers(skip, limit, req.query.search as string | undefined);
    ok(res, { users }, 200, buildPageMeta(total, page, limit));
  }),
);
router.patch(
  '/users/:id',
  validate({ params: idParam, body: updateUserSchema }),
  asyncHandler(async (req, res) => {
    ok(res, { user: await adminService.updateUser(req.params.id, req.body) });
  }),
);

// ── Dresses ────────────────────────────────────────────
router.get(
  '/dresses',
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPageParams(req.query.page, req.query.limit);
    const [total, dresses] = await adminService.listDresses(skip, limit, req.query.search as string | undefined);
    ok(res, { dresses }, 200, buildPageMeta(total, page, limit));
  }),
);
router.post(
  '/dresses',
  validate({ body: dressCreateSchema }),
  asyncHandler(async (req, res) => {
    created(res, { dress: await adminService.createDress(req.body) });
  }),
);
router.put(
  '/dresses/:id',
  validate({ params: idParam, body: dressUpdateSchema }),
  asyncHandler(async (req, res) => {
    ok(res, { dress: await adminService.updateDress(req.params.id, req.body) });
  }),
);
router.delete(
  '/dresses/:id',
  validate({ params: idParam }),
  asyncHandler(async (req, res) => {
    await adminService.deleteDress(req.params.id);
    ok(res, { message: 'Dress deleted' });
  }),
);

// ── Reviews moderation ─────────────────────────────────
router.get(
  '/reviews',
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPageParams(req.query.page, req.query.limit);
    const [total, reviews] = await adminService.listReviews(skip, limit);
    ok(res, { reviews }, 200, buildPageMeta(total, page, limit));
  }),
);
router.patch(
  '/reviews/:id',
  validate({ params: idParam, body: z.object({ isApproved: z.boolean() }) }),
  asyncHandler(async (req, res) => {
    ok(res, { review: await adminService.setReviewApproval(req.params.id, req.body.isApproved) });
  }),
);

// ── Recommendation rules (configurable engine) ─────────
router.get(
  '/rules',
  asyncHandler(async (_req, res) => {
    const [rules, preview] = await Promise.all([rulesService.list(), rulesService.normalizedPreview()]);
    ok(res, { rules, normalized: preview });
  }),
);
router.patch(
  '/rules/:factorKey',
  validate({ params: z.object({ factorKey: z.string().min(1) }), body: updateRuleSchema }),
  asyncHandler(async (req, res) => {
    ok(res, { rule: await rulesService.update(req.params.factorKey, req.body) });
  }),
);
router.post(
  '/rules/reset',
  asyncHandler(async (_req, res) => {
    ok(res, { rules: await rulesService.resetDefaults() });
  }),
);

// ── Reference / lookup CRUD (DRY factory) ──────────────
router.use('/categories', createLookupRouter({ delegate: asCrud(prisma.dressCategory), createSchema: categoryCreate, updateSchema: categoryUpdate }));
router.use('/styles', createLookupRouter({ delegate: asCrud(prisma.dressStyle), createSchema: styleCreate, updateSchema: styleUpdate }));
router.use('/brands', createLookupRouter({ delegate: asCrud(prisma.brand), createSchema: brandCreate, updateSchema: brandUpdate }));
router.use('/colors', createLookupRouter({ delegate: asCrud(prisma.color), createSchema: colorCreate, updateSchema: colorUpdate }));
router.use('/occasions', createLookupRouter({ delegate: asCrud(prisma.occasion), createSchema: occasionCreate, updateSchema: occasionUpdate }));
router.use('/seasons', createLookupRouter({ delegate: asCrud(prisma.season), createSchema: seasonCreate, updateSchema: seasonUpdate }));
router.use('/fabrics', createLookupRouter({ delegate: asCrud(prisma.fabric), createSchema: fabricCreate, updateSchema: fabricUpdate }));
router.use('/sizes', createLookupRouter({ delegate: asCrud(prisma.size), createSchema: sizeCreate, updateSchema: sizeUpdate, orderBy: { sortOrder: 'asc' } }));
router.use('/age-groups', createLookupRouter({ delegate: asCrud(prisma.ageGroup), createSchema: ageGroupCreate, updateSchema: ageGroupUpdate, orderBy: { minAge: 'asc' } }));
router.use('/body-shapes', createLookupRouter({ delegate: asCrud(prisma.bodyShape), createSchema: bodyShapeCreate, updateSchema: bodyShapeUpdate }));

export const adminRouter = router;
