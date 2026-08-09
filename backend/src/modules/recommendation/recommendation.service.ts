import type { Prisma } from '@prisma/client';
import { recommendationRepository, type CandidateFilters } from './recommendation.repository';
import { rulesService } from './rules.service';
import { affinityService } from './affinity';
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

/** Defaults written by `UserPreferences` when the user has not chosen a budget. */
const UNSET_BUDGET_MIN = 0;
const UNSET_BUDGET_MAX = 100000;

/**
 * Tells the user which factors are dormant and what to supply to activate them,
 * so an incomplete profile produces an explicit prompt rather than a
 * confident-looking percentage derived from half the signals.
 */
function describeCompleteness(ctx: ScoringContext, coverage: number) {
  const missing: { factor: string; action: string }[] = [];
  if (!ctx.bodyShapeKey) missing.push({ factor: 'bodyShape', action: 'Add your measurements to match by body shape' });
  if (!ctx.hasBudget) missing.push({ factor: 'budget', action: 'Set a budget range to filter by price' });
  if (ctx.requestedOccasionIds.size === 0 && ctx.favoriteOccasionIds.size === 0)
    missing.push({ factor: 'occasion', action: 'Choose an occasion to sharpen the match' });
  if (ctx.preferredColorIds.size === 0) missing.push({ factor: 'color', action: 'Pick preferred colours' });
  if (ctx.preferredStyleIds.size === 0) missing.push({ factor: 'style', action: 'Pick preferred styles' });
  if (ctx.favoriteBrandIds.size === 0) missing.push({ factor: 'brand', action: 'Choose favourite brands' });
  if (ctx.affinity.signalCount < 2)
    missing.push({ factor: 'personalization', action: 'Save or select dresses so we can learn your taste' });

  return {
    coverage: Math.round(coverage * 100) / 100,
    isLowConfidence: coverage < RECOMMENDATION.LOW_COVERAGE_THRESHOLD,
    missing,
  };
}

export const recommendationService = {
  /**
   * The orchestration at the heart of the platform: build the user context,
   * load configurable weights, score every candidate, persist the run, and
   * return ranked, explained results with calibrated confidence scores.
   */
  async generate(userId: string, input: GenerateInput) {
    const profile = await profileRepository.getFullProfile(userId);
    if (!profile?.measurements) {
      throw BadRequest('Please complete your body measurements before generating recommendations');
    }

    const m = profile.measurements;
    const prefs = profile.preferences;
    const affinity = await affinityService.forUser(userId);

    const ctx: ScoringContext = {
      age: m.age,
      bustCm: m.bustCm,
      waistCm: m.waistCm,
      hipCm: m.hipCm,
      bodyShapeKey: (m.bodyShape?.key as BodyShapeKey | undefined) ?? null,
      budgetMin: prefs?.budgetMin ?? UNSET_BUDGET_MIN,
      budgetMax: prefs?.budgetMax ?? UNSET_BUDGET_MAX,
      // A budget only counts as set if the user moved it off the defaults —
      // otherwise every dress trivially "fits the budget".
      hasBudget: Boolean(
        prefs && (prefs.budgetMin > UNSET_BUDGET_MIN || prefs.budgetMax < UNSET_BUDGET_MAX),
      ),
      preferredColorIds: new Set(prefs?.preferredColors.map((c) => c.id) ?? []),
      preferredStyleIds: new Set(prefs?.preferredStyles.map((s) => s.id) ?? []),
      favoriteBrandIds: new Set(prefs?.favoriteBrands.map((b) => b.id) ?? []),
      favoriteOccasionIds: new Set(prefs?.favoriteOccasions.map((o) => o.id) ?? []),
      requestedOccasionIds: new Set(input.occasionIds ?? []),
      affinity,
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
    const { ranked, excluded, coverage } = rankCandidates(candidates, ctx, weights, limit);

    const completeness = describeCompleteness(ctx, coverage);

    if (ranked.length === 0) {
      return {
        recommendations: [],
        historyId: null,
        bodyShape: m.bodyShape,
        weights,
        completeness,
        excludedCount: excluded.length,
        excludedReasons: summariseExclusions(excluded),
      };
    }

    const topConfidence = ranked[0]?.confidence ?? 0;

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
        budget: { min: ctx.budgetMin, max: ctx.budgetMax, isSet: ctx.hasBudget },
        candidatesConsidered: candidates.length,
        excluded: excluded.length,
      } as unknown as Prisma.InputJsonValue,
      resultCount: ranked.length,
      topConfidence,
      coverage,
      items: ranked.map((s, idx) => ({
        dressId: s.dressId,
        rank: idx + 1,
        score: s.score,
        confidence: s.confidence,
        factors: s.factors as unknown as Prisma.InputJsonValue,
        reasons: s.reasons,
        caveats: s.caveats,
      })),
    });

    await analyticsService.log('RECOMMENDATION_GENERATED', {
      userId,
      metadata: { resultCount: ranked.length, topConfidence, coverage, excluded: excluded.length },
    });

    const hydrated = await recommendationRepository.hydrate(ranked);

    return {
      historyId: history.id,
      bodyShape: m.bodyShape,
      weights,
      completeness,
      excludedCount: excluded.length,
      excludedReasons: summariseExclusions(excluded),
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

/** Groups hard-constraint removals so the UI can explain what was filtered out. */
function summariseExclusions(excluded: { reason: string }[]): { reason: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const e of excluded) {
    // Collapse the parameterised tail so similar reasons group together.
    const key = e.reason.replace(/\d+/g, 'N');
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count);
}
