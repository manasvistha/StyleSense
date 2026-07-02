import { Router } from 'express';
import { recommendationController } from './recommendation.controller';
import { authenticate } from '../../middleware/authenticate';
import { validate } from '../../middleware/validate';
import {
  generateSchema,
  historyParamsSchema,
  selectDressSchema,
} from './recommendation.validator';

const router = Router();

router.use(authenticate);

router.post('/generate', validate({ body: generateSchema }), recommendationController.generate);
router.get('/history', recommendationController.history);
router.get('/history/:id', validate({ params: historyParamsSchema }), recommendationController.historyDetail);
router.post(
  '/history/:id/select',
  validate({ params: historyParamsSchema, body: selectDressSchema }),
  recommendationController.selectDress,
);

export const recommendationRouter = router;
