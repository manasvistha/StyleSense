import type { Prisma } from '@prisma/client';
import { recommendationRepository, type CandidateFilters } from './recommendation.repository';
import { rulesService } from './rules.service';
import { rankCandidates, normalizeWeights } from './engine';
import { profileRepository } from '../profile/profile.repository';
import { analyticsService } from '../analytics/analytics.service';
import { BadRequest, NotFound } from '../../utils/http-error';
import { RECOMMENDATION } from '../../config/constants';
import type { BodyShapeKey } from '../../config/constants';
import type { ScoringContext } from './recommendation.types';

export interface GenerateInput {
  occasionIds?: string[];
  categoryId?: string;
  seasonId?: string;
  limit?: number;
}

export const recommendationService = {
  /**
   * The orchestration at the heart of the platform: build the user context,
   * load configurable weights, score every candidate, persist the run, and
   * return ranked, explained results with confidence scores.
   */
  async generate(userId: string, input: GenerateInput) {
    const profile = await profileRepository.getFullProfile(userId);
    if (!profile?.measurements) {
      throw BadRequest('Please complete your body measurements before generating recommendations');
    }

    const m = profile.measurements;
    const prefs = profile.preferences;

    const ctx: ScoringContext = {
      age: m.age,
      bustCm: m.bustCm,
      waistCm: m.waistCm,
      hipCm: m.hipCm,
      bodyShapeKey: (m.bodyShape?.key as BodyShapeKey | undefined) ?? null,
      budgetMin: prefs?.budgetMin ?? 0,
      budgetMax: prefs?.budgetMax ?? 100000,
      preferredColorIds: new Set(prefs?.preferredColors.map((c) => c.id) ?? []),
      preferredStyleIds: new Set(prefs?.preferredStyles.map((s) => s.id) ?? []),
      favoriteBrandIds: new Set(prefs?.favoriteBrands.map((b) => b.id) ?? []),
      favoriteOccasionIds: new Set(prefs?.favoriteOccasions.map((o) => o.id) ?? []),
      requestedOccasionIds: new Set(input.occasionIds ?? []),
    };

    const filters: CandidateFilters = {
      categoryId: input.categoryId,
      seasonId: input.seasonId,
      occasionIds: input.occasionIds,
    };

    const rawWeights = await rulesService.activeWeights();
    const weights = normalizeWeights(rawWeights);

    const candidates = await recommendationRepository.findCandidates(filters);
    const limit = Math.min(48, Math.max(1, input.limit ?? RECOMMENDATION.DEFAULT_RESULT_COUNT));
    const scored = rankCandidates(candidates, ctx, weights, limit);

    if (scored.length === 0) {
      return { recommendations: [], historyId: null, bodyShape: m.bodyShape, weights };
    }

    const topConfidence = scored[0]?.confidence ?? 0;

    const history = await recommendationRepository.saveHistory({
      userId,
      bodyShapeId: m.bodyShapeId,
      inputSnapshot: {
        measurements: {
          age: m.age,
          bustCm: m.bustCm,
          waistCm: m.waistCm,
          hipCm: m.hipCm,
          bodyShape: m.bodyShape?.key ?? null,
        },
        filters: input,
        budget: { min: ctx.budgetMin, max: ctx.budgetMax },
      } as unknown as Prisma.InputJsonValue,
      resultCount: scored.length,
      topConfidence,
      items: scored.map((s, idx) => ({
        dressId: s.dressId,
        rank: idx + 1,
        score: s.score,
        confidence: s.confidence,
        factors: s.factors as unknown as Prisma.InputJsonValue,
        reasons: s.reasons,
      })),
    });

    await analyticsService.log('RECOMMENDATION_GENERATED', {
      userId,
      metadata: { resultCount: scored.length, topConfidence },
    });

    const hydrated = await recommendationRepository.hydrate(scored);

    return {
      historyId: history.id,
      bodyShape: m.bodyShape,
      weights,
      recommendations: hydrated,
    };
  },

  async history(userId: string, skip: number, take: number) {
    const [total, rows] = await recommendationRepository.listHistory(userId, skip, take);
    return { total, rows };
  },

  async historyDetail(userId: string, historyId: string) {
    const detail = await recommendationRepository.getHistoryDetail(userId, historyId);
    if (!detail) throw NotFound('Recommendation run not found');
    return detail;
  },

  async selectDress(userId: string, historyId: string, dressId: string) {
    const result = await recommendationRepository.setSelectedDress(userId, historyId, dressId);
    if (result.count === 0) throw NotFound('Recommendation run not found');
    await analyticsService.log('DRESS_SELECTED', { userId, dressId, metadata: { historyId } });
    return { selectedDressId: dressId };
  },
};
