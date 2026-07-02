import { Router } from 'express';
import { healthRouter } from './modules/health/health.routes';
import { authRouter } from './modules/auth/auth.routes';
import { profileRouter } from './modules/profile/profile.routes';
import { bodyShapeRouter } from './modules/bodyshape/bodyshape.routes';
import { recommendationRouter } from './modules/recommendation/recommendation.routes';
import { dressRouter } from './modules/dresses/dress.routes';
import { catalogRouter } from './modules/catalog/catalog.routes';
import { reviewRouter } from './modules/reviews/review.routes';
import { wishlistRouter } from './modules/wishlist/wishlist.routes';
import { analyticsRouter } from './modules/analytics/analytics.routes';
import { adminRouter } from './modules/admin/admin.routes';

/** Top-level API router — mounts every feature module. */
export const apiRouter = Router();

apiRouter.use('/health', healthRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/profile', profileRouter);
apiRouter.use('/body-shape', bodyShapeRouter);
apiRouter.use('/recommendations', recommendationRouter);
apiRouter.use('/dresses', dressRouter);
apiRouter.use('/catalog', catalogRouter);
apiRouter.use('/reviews', reviewRouter);
apiRouter.use('/wishlist', wishlistRouter);
apiRouter.use('/analytics', analyticsRouter);
apiRouter.use('/admin', adminRouter);
