import { Router } from 'express';
import { profileController } from './profile.controller';
import { authenticate } from '../../middleware/authenticate';
import { validate } from '../../middleware/validate';
import { upload } from '../../middleware/upload';
import {
  updateMeasurementsSchema,
  updatePreferencesSchema,
  updateProfileSchema,
} from './profile.validator';

const router = Router();

router.use(authenticate);

router.get('/', profileController.get);
router.patch('/', validate({ body: updateProfileSchema }), profileController.updateBasics);
router.put(
  '/measurements',
  validate({ body: updateMeasurementsSchema }),
  profileController.updateMeasurements,
);
router.put(
  '/preferences',
  validate({ body: updatePreferencesSchema }),
  profileController.updatePreferences,
);
router.get('/recently-viewed', profileController.recentlyViewed);
router.post('/avatar', upload.single('avatar'), profileController.uploadAvatar);

export const profileRouter = router;
