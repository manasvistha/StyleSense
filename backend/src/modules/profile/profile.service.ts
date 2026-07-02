import { profileRepository } from './profile.repository';
import { bodyShapeService } from '../bodyshape/bodyshape.service';
import { analyticsService } from '../analytics/analytics.service';
import { NotFound } from '../../utils/http-error';
import type {
  UpdateMeasurementsInput,
  UpdatePreferencesInput,
  UpdateProfileInput,
} from './profile.validator';

export const profileService = {
  async get(userId: string) {
    const profile = await profileRepository.getFullProfile(userId);
    if (!profile) throw NotFound('Profile not found');
    return profile;
  },

  async updateBasics(userId: string, input: UpdateProfileInput) {
    const data = {
      ...(input.fullName !== undefined ? { fullName: input.fullName } : {}),
      ...(input.phone !== undefined ? { phone: input.phone || null } : {}),
      ...(input.avatarUrl !== undefined ? { avatarUrl: input.avatarUrl || null } : {}),
    };
    return profileRepository.updateUser(userId, data);
  },

  /**
   * Saves measurements and *derives* the body shape (explainable) in the same
   * operation, snapshotting the reasoning so the user can see why it changed.
   */
  async updateMeasurements(userId: string, input: UpdateMeasurementsInput) {
    const shape = await bodyShapeService.analyze({
      bustCm: input.bustCm,
      waistCm: input.waistCm,
      hipCm: input.hipCm,
      shoulderCm: input.shoulderCm ?? null,
    });

    const saved = await profileRepository.upsertMeasurements(userId, {
      userId,
      age: input.age,
      heightCm: input.heightCm,
      weightKg: input.weightKg,
      bustCm: input.bustCm,
      waistCm: input.waistCm,
      hipCm: input.hipCm,
      shoulderCm: input.shoulderCm ?? null,
      skinTone: input.skinTone ?? null,
      bodyShapeId: shape.id,
      bodyShapeReason: shape.reason,
    });

    await analyticsService.log('PROFILE_UPDATED', { userId, metadata: { section: 'measurements' } });
    return { measurements: saved, bodyShape: shape };
  },

  async updatePreferences(userId: string, input: UpdatePreferencesInput) {
    return profileRepository.upsertPreferences(
      userId,
      { budgetMin: input.budgetMin, budgetMax: input.budgetMax },
      {
        preferredColorIds: input.preferredColorIds,
        preferredStyleIds: input.preferredStyleIds,
        favoriteBrandIds: input.favoriteBrandIds,
        favoriteOccasionIds: input.favoriteOccasionIds,
      },
    );
  },

  recentlyViewed(userId: string, limit = 12) {
    return profileRepository.listRecentlyViewed(userId, limit);
  },
};
