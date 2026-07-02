import { dressRepository, type DressFilters } from './dress.repository';
import { analyticsService } from '../analytics/analytics.service';
import { NotFound } from '../../utils/http-error';

export const dressService = {
  async list(filters: DressFilters, skip: number, take: number) {
    const [total, dresses] = await dressRepository.list(filters, skip, take);
    return { total, dresses };
  },

  async getBySlug(slug: string, viewerId?: string) {
    const dress = await dressRepository.findBySlug(slug);
    if (!dress) throw NotFound('Dress not found');
    await dressRepository.recordView(viewerId, dress.id);
    await analyticsService.log('DRESS_VIEWED', { userId: viewerId, dressId: dress.id });
    return dress;
  },

  featured(take = 8) {
    return dressRepository.featured(take);
  },
};
