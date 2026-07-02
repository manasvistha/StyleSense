import { Router } from 'express';
import { dressController } from './dress.controller';
import { validate } from '../../middleware/validate';
import { optionalAuth } from '../../middleware/optional-auth';
import { listDressesQuery, slugParam } from './dress.validator';

const router = Router();

router.get('/', validate({ query: listDressesQuery }), dressController.list);
router.get('/featured', dressController.featured);
router.get('/:slug', optionalAuth, validate({ params: slugParam }), dressController.detail);

export const dressRouter = router;
