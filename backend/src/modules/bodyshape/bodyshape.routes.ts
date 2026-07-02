import { Router } from 'express';
import { bodyShapeController } from './bodyshape.controller';
import { validate } from '../../middleware/validate';
import { measurementSchema } from './bodyshape.validator';

const router = Router();

router.get('/', bodyShapeController.list);
router.post('/analyze', validate({ body: measurementSchema }), bodyShapeController.analyze);

export const bodyShapeRouter = router;
