import { dressSimilarity } from '../engine';
import type { CandidateDress } from '../recommendation.types';
import { RELEVANCE_THRESHOLD } from './ground-truth';

/** Ranking-quality and list-health metrics for one persona's result list. */
export interface RankingMetrics {
  precisionAtK: number;
  ndcgAtK: number;
  /** Mean graded label of the returned items — how good the list is on average. */
  meanRelevance: number;
  /** Count of items labelled 0 (a stylist would not recommend) in the top-k. */
  unsuitableInTopK: number;
  /** Labelled items among the top-k; the metrics above are over these only. */
  labelledInTopK: number;
}

const dcg = (gains: number[]): number =>
  gains.reduce((acc, g, i) => acc + (Math.pow(2, g) - 1) / Math.log2(i + 2), 0);

/**
 * Scores a ranked list against graded relevance labels.
 *
 * Only labelled items contribute: the ground truth covers a sample of the
 * catalogue, so an unlabelled result is treated as unjudged rather than
 * silently counted as irrelevant, which would penalise a larger catalogue.
 */
export function rankingMetrics(
  rankedSlugs: string[],
  labels: Record<string, 0 | 1 | 2 | 3>,
  k: number,
): RankingMetrics {
  const topK = rankedSlugs.slice(0, k);
  const judged = topK.filter((s) => s in labels);
  const gains: number[] = judged.map((s) => labels[s]!);

  if (judged.length === 0) {
    return { precisionAtK: 0, ndcgAtK: 0, meanRelevance: 0, unsuitableInTopK: 0, labelledInTopK: 0 };
  }

  const relevant = gains.filter((g) => g >= RELEVANCE_THRESHOLD).length;

  // Ideal ordering: the best labels available anywhere in the catalogue.
  const ideal: number[] = Object.values(labels)
    .slice()
    .sort((a, b) => b - a)
    .slice(0, judged.length);

  const idealDcg = dcg(ideal);

  return {
    precisionAtK: relevant / judged.length,
    ndcgAtK: idealDcg > 0 ? dcg(gains) / idealDcg : 0,
    meanRelevance: gains.reduce((a, b) => a + b, 0) / gains.length,
    unsuitableInTopK: gains.filter((g) => g === 0).length,
    labelledInTopK: judged.length,
  };
}

/** Diagnostics describing the health of the score distribution itself. */
export interface DistributionMetrics {
  scoreSd: number;
  confidenceMax: number;
  confidenceMin: number;
  confidenceMean: number;
  /** Confidence points between rank 1 and rank k — a flat list scores near 0. */
  topKSpread: number;
  /** Distinct scores among the top k. Fewer than k means arbitrary ordering. */
  distinctScoresInTopK: number;
  /** Catalogue entries scoring within 5 points of the winner. */
  withinFiveOfWinner: number;
}

export function distributionMetrics(
  allConfidences: number[],
  allScores: number[],
  topKScores: number[],
  k: number,
): DistributionMetrics {
  const mean = allConfidences.reduce((a, b) => a + b, 0) / allConfidences.length;
  const scoreMean = allScores.reduce((a, b) => a + b, 0) / allScores.length;
  const sd = Math.sqrt(allScores.reduce((a, b) => a + (b - scoreMean) ** 2, 0) / allScores.length);
  const best = allConfidences[0] ?? 0;

  return {
    scoreSd: sd,
    confidenceMax: best,
    confidenceMin: allConfidences[allConfidences.length - 1] ?? 0,
    confidenceMean: mean,
    topKSpread: best - (allConfidences[Math.min(k, allConfidences.length) - 1] ?? best),
    distinctScoresInTopK: new Set(topKScores.map((s) => s.toFixed(3))).size,
    withinFiveOfWinner: allConfidences.filter((c) => c >= best - 5).length,
  };
}

/** 1 − mean pairwise similarity: how varied the returned list is. */
export function intraListDiversity(items: CandidateDress[]): number {
  if (items.length < 2) return 1;
  let total = 0;
  let pairs = 0;
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      total += dressSimilarity(items[i]!, items[j]!);
      pairs++;
    }
  }
  return 1 - total / pairs;
}

/** Share of the catalogue that appears in at least one persona's results. */
export function catalogueCoverage(lists: string[][], catalogueSize: number): number {
  return new Set(lists.flat()).size / catalogueSize;
}
