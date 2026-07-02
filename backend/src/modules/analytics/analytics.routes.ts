import { Router } from 'express';
import { analyticsController } from './analytics.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';

const router = Router();

// Analytics is admin-only.
router.use(authenticate, authorize('ADMIN'));
router.get('/dashboard', analyticsController.dashboard);
router.get('/trend', analyticsController.trend);

export const analyticsRouter = router;
