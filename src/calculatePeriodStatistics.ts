import { createIssueMetrics } from "@github-project-metrics/ghpm-metrics";
import type { IssueMetrics } from "@github-project-metrics/ghpm-metrics";
import {
  calculateCommentCountMean,
  calculateCommentCountMedian,
  calculateCommentCountMode,
  calculateCommentCountMax,
  calculateCommentCountMin,
  calculateCommentCountVariance,
  calculateCommentCountStandardDeviation,
  calculateCommentCountInterquartileRange,
  calculateCommentCountKurtosis,
  calculateCommentCountSkewness,
  calculateCommentCountPercentile,
  calculateCommentCountOutliersIQR,
  calculateCommentCountOutliersZScore,
  calculateComplexityMean,
  calculateComplexityMedian,
  calculateComplexityMode,
  calculateComplexityMax,
  calculateComplexityMin,
  calculateComplexityVariance,
  calculateComplexityStandardDeviation,
  calculateComplexityInterquartileRange,
  calculateComplexityKurtosis,
  calculateComplexitySkewness,
  calculateComplexityPercentile,
  calculateComplexityOutliersIQR,
  calculateComplexityOutliersZScore,
  calculateCycleTimeMean,
  calculateCycleTimeMedian,
  calculateCycleTimeMode,
  calculateCycleTimeMax,
  calculateCycleTimeMin,
  calculateCycleTimeVariance,
  calculateCycleTimeStandardDeviation,
  calculateCycleTimeInterquartileRange,
  calculateCycleTimeKurtosis,
  calculateCycleTimeSkewness,
  calculateCycleTimePercentile,
  calculateCycleTimeOutliersIQR,
  calculateCycleTimeOutliersZScore,
  calculateLeadTimeMean,
  calculateLeadTimeMedian,
  calculateLeadTimeMode,
  calculateLeadTimeMax,
  calculateLeadTimeMin,
  calculateLeadTimeVariance,
  calculateLeadTimeStandardDeviation,
  calculateLeadTimeInterquartileRange,
  calculateLeadTimeKurtosis,
  calculateLeadTimeSkewness,
  calculateLeadTimePercentile,
  calculateLeadTimeOutliersIQR,
  calculateLeadTimeOutliersZScore,
  calculatePlanVsActualMean,
  calculatePlanVsActualMedian,
  calculatePlanVsActualMode,
  calculatePlanVsActualMax,
  calculatePlanVsActualMin,
  calculatePlanVsActualVariance,
  calculatePlanVsActualStandardDeviation,
  calculatePlanVsActualInterquartileRange,
  calculatePlanVsActualKurtosis,
  calculatePlanVsActualSkewness,
  calculatePlanVsActualPercentile,
  calculatePlanVsActualOutliersIQR,
  calculatePlanVsActualOutliersZScore,
  calculateReviewTimeMean,
  calculateReviewTimeMedian,
  calculateReviewTimeMode,
  calculateReviewTimeMax,
  calculateReviewTimeMin,
  calculateReviewTimeVariance,
  calculateReviewTimeStandardDeviation,
  calculateReviewTimeInterquartileRange,
  calculateReviewTimeKurtosis,
  calculateReviewTimeSkewness,
  calculateReviewTimePercentile,
  calculateReviewTimeOutliersIQR,
  calculateReviewTimeOutliersZScore,
  calculateCommentVsComplexityCorrelationPearson,
  calculateCommentVsComplexityCorrelationSpearman,
  calculateCommentVsCycleTimeCorrelationPearson,
  calculateCommentVsCycleTimeCorrelationSpearman,
  calculateCommentVsLeadTimeCorrelationPearson,
  calculateCommentVsLeadTimeCorrelationSpearman,
  calculateCommentVsPlanVsActualCorrelationPearson,
  calculateCommentVsPlanVsActualCorrelationSpearman,
  calculateCommentVsReviewTimeCorrelationPearson,
  calculateCommentVsReviewTimeCorrelationSpearman,
  calculateComplexityVsCycleTimeCorrelationPearson,
  calculateComplexityVsCycleTimeCorrelationSpearman,
  calculateComplexityVsLeadTimeCorrelationPearson,
  calculateComplexityVsLeadTimeCorrelationSpearman,
  calculateComplexityVsPlanVsActualCorrelationPearson,
  calculateComplexityVsPlanVsActualCorrelationSpearman,
  calculateComplexityVsReviewTimeCorrelationPearson,
  calculateComplexityVsReviewTimeCorrelationSpearman,
  calculateCycleTimeVsLeadTimeCorrelationPearson,
  calculateCycleTimeVsLeadTimeCorrelationSpearman,
  calculateCycleTimeVsPlanVsActualCorrelationPearson,
  calculateCycleTimeVsPlanVsActualCorrelationSpearman,
  calculateCycleTimeVsReviewTimeCorrelationPearson,
  calculateCycleTimeVsReviewTimeCorrelationSpearman,
  calculateLeadTimeVsPlanVsActualCorrelationPearson,
  calculateLeadTimeVsPlanVsActualCorrelationSpearman,
  calculateLeadTimeVsReviewTimeCorrelationPearson,
  calculateLeadTimeVsReviewTimeCorrelationSpearman,
  calculatePlanVsActualVsReviewTimeCorrelationPearson,
  calculatePlanVsActualVsReviewTimeCorrelationSpearman,
} from "@github-project-metrics/ghpm-metrics-statistics";
import type { PeriodType } from "./types/periodType";
import type { CalculatePeriodStatisticsInput } from "./types/calculatePeriodStatisticsInput";
import type { CalculatePeriodStatisticsOutput } from "./types/calculatePeriodStatisticsOutput";
import type { PeriodStatistics } from "./types/periodStatistics";

/**
 * 期間の種類からミリ秒単位の期間を取得する。
 */
function getPeriodDurationMs(periodType: PeriodType): number {
  switch (periodType) {
    case "1week":
      return 7 * 24 * 60 * 60 * 1000;
    case "2weeks":
      return 14 * 24 * 60 * 60 * 1000;
    case "1month":
      return 30 * 24 * 60 * 60 * 1000;
    case "3months":
      return 90 * 24 * 60 * 60 * 1000;
    case "6months":
      return 180 * 24 * 60 * 60 * 1000;
    case "1year":
      return 365 * 24 * 60 * 60 * 1000;
    default:
      throw new Error(`Unknown period type: ${periodType}`);
  }
}

/**
 * 期間ごとの統計を計算する。
 *
 * @param input - 統計計算の入力パラメータ
 * @returns 期間ごとの統計計算結果
 */
export function calculatePeriodStatistics(
  input: CalculatePeriodStatisticsInput,
): CalculatePeriodStatisticsOutput {
  const { combinedIssues, periodType } = input;

  // メトリクスを計算
  const issueMetrics = createIssueMetrics(combinedIssues);

  // 期間の長さを取得
  const periodDurationMs = getPeriodDurationMs(periodType);

  // Issueを期間ごとにグループ化
  const periodGroups = new Map<string, IssueMetrics[]>();

  for (const issueMetric of issueMetrics) {
    const createdAt = new Date(issueMetric.issue.created_at);
    const periodStart = new Date(
      Math.floor(createdAt.getTime() / periodDurationMs) * periodDurationMs,
    );
    const periodKey = periodStart.toISOString();

    if (!periodGroups.has(periodKey)) {
      periodGroups.set(periodKey, []);
    }
    periodGroups.get(periodKey)!.push(issueMetric);
  }

  // 期間ごとの統計を計算
  const periodStatistics: PeriodStatistics[] = [];

  for (const [periodKey, metrics] of periodGroups.entries()) {
    const periodStart = new Date(periodKey);
    const periodEnd = new Date(periodStart.getTime() + periodDurationMs);

    const statistics = calculateStatisticsForPeriod(metrics);

    periodStatistics.push({
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
      issueCount: metrics.length,
      metrics: statistics,
    });
  }

  // 期間の開始日時でソート
  periodStatistics.sort((a, b) => a.periodStart.localeCompare(b.periodStart));

  return {
    periodStatistics,
    issueMetrics,
  };
}

/**
 * 期間内のメトリクスから統計を計算する。
 */
function calculateStatisticsForPeriod(metrics: IssueMetrics[]): PeriodStatistics["metrics"] {
  // 各メトリクスを抽出
  const commentCounts = metrics
    .map((m) => m.metrics.commentCount)
    .filter((m): m is NonNullable<typeof m> => m !== undefined);
  const complexities = metrics
    .map((m) => m.metrics.complexity)
    .filter((m): m is NonNullable<typeof m> => m !== undefined);
  const cycleTimes = metrics
    .map((m) => m.metrics.cycleTime)
    .filter((m): m is NonNullable<typeof m> => m !== undefined);
  const leadTimes = metrics
    .map((m) => m.metrics.leadTime)
    .filter((m): m is NonNullable<typeof m> => m !== undefined);
  const planVsActuals = metrics
    .map((m) => m.metrics.planVsActual)
    .filter((m): m is NonNullable<typeof m> => m !== undefined);
  const reviewTimes = metrics
    .map((m) => m.metrics.reviewTime)
    .filter((m): m is NonNullable<typeof m> => m !== undefined);

  // コメント数の統計を計算
  const commentCountStatistics = commentCounts.length > 0
    ? {
        mean: calculateCommentCountMean(commentCounts),
        median: calculateCommentCountMedian(commentCounts),
        mode: calculateCommentCountMode(commentCounts),
        max: calculateCommentCountMax(commentCounts),
        min: calculateCommentCountMin(commentCounts),
        variance: calculateCommentCountVariance(commentCounts),
        standardDeviation: calculateCommentCountStandardDeviation(commentCounts),
        interquartileRange: calculateCommentCountInterquartileRange(commentCounts),
        kurtosis: calculateCommentCountKurtosis(commentCounts),
        skewness: calculateCommentCountSkewness(commentCounts),
        percentile: Object.fromEntries(
          [
            [25, calculateCommentCountPercentile(commentCounts, 25)],
            [50, calculateCommentCountPercentile(commentCounts, 50)],
            [75, calculateCommentCountPercentile(commentCounts, 75)],
            [90, calculateCommentCountPercentile(commentCounts, 90)],
            [95, calculateCommentCountPercentile(commentCounts, 95)],
            [99, calculateCommentCountPercentile(commentCounts, 99)],
          ].filter(([, value]) => value !== undefined),
        ) as { [key: number]: { total: number; participantCount: number } },
        outliersIqr: calculateCommentCountOutliersIQR(commentCounts),
        outliersZscore: calculateCommentCountOutliersZScore(commentCounts),
      }
    : undefined;

  // 複雑さの統計を計算
  const complexityStatistics = complexities.length > 0
    ? {
        mean: calculateComplexityMean(complexities),
        median: calculateComplexityMedian(complexities),
        mode: calculateComplexityMode(complexities),
        max: calculateComplexityMax(complexities),
        min: calculateComplexityMin(complexities),
        variance: calculateComplexityVariance(complexities),
        standardDeviation: calculateComplexityStandardDeviation(complexities),
        interquartileRange: calculateComplexityInterquartileRange(complexities),
        kurtosis: calculateComplexityKurtosis(complexities),
        skewness: calculateComplexitySkewness(complexities),
        percentile: Object.fromEntries(
          [
            [25, calculateComplexityPercentile(complexities, 25)],
            [50, calculateComplexityPercentile(complexities, 50)],
            [75, calculateComplexityPercentile(complexities, 75)],
            [90, calculateComplexityPercentile(complexities, 90)],
            [95, calculateComplexityPercentile(complexities, 95)],
            [99, calculateComplexityPercentile(complexities, 99)],
          ].filter(([, value]) => value !== undefined),
        ) as { [key: number]: { estimated: number } },
        outliersIqr: calculateComplexityOutliersIQR(complexities),
        outliersZscore: calculateComplexityOutliersZScore(complexities),
      }
    : undefined;

  // サイクルタイムの統計を計算
  const cycleTimeStatistics = cycleTimes.length > 0
    ? {
        mean: calculateCycleTimeMean(cycleTimes),
        median: calculateCycleTimeMedian(cycleTimes),
        mode: calculateCycleTimeMode(cycleTimes),
        max: calculateCycleTimeMax(cycleTimes),
        min: calculateCycleTimeMin(cycleTimes),
        variance: calculateCycleTimeVariance(cycleTimes),
        standardDeviation: calculateCycleTimeStandardDeviation(cycleTimes),
        interquartileRange: calculateCycleTimeInterquartileRange(cycleTimes),
        kurtosis: calculateCycleTimeKurtosis(cycleTimes),
        skewness: calculateCycleTimeSkewness(cycleTimes),
        percentile: Object.fromEntries(
          [
            [25, calculateCycleTimePercentile(cycleTimes, 25)],
            [50, calculateCycleTimePercentile(cycleTimes, 50)],
            [75, calculateCycleTimePercentile(cycleTimes, 75)],
            [90, calculateCycleTimePercentile(cycleTimes, 90)],
            [95, calculateCycleTimePercentile(cycleTimes, 95)],
            [99, calculateCycleTimePercentile(cycleTimes, 99)],
          ].filter(([, value]) => value !== undefined),
        ) as { [key: number]: { durationMs: number } },
        outliersIqr: calculateCycleTimeOutliersIQR(cycleTimes),
        outliersZscore: calculateCycleTimeOutliersZScore(cycleTimes),
      }
    : undefined;

  // リードタイムの統計を計算
  const leadTimeStatistics = leadTimes.length > 0
    ? {
        mean: calculateLeadTimeMean(leadTimes),
        median: calculateLeadTimeMedian(leadTimes),
        mode: calculateLeadTimeMode(leadTimes),
        max: calculateLeadTimeMax(leadTimes),
        min: calculateLeadTimeMin(leadTimes),
        variance: calculateLeadTimeVariance(leadTimes),
        standardDeviation: calculateLeadTimeStandardDeviation(leadTimes),
        interquartileRange: calculateLeadTimeInterquartileRange(leadTimes),
        kurtosis: calculateLeadTimeKurtosis(leadTimes),
        skewness: calculateLeadTimeSkewness(leadTimes),
        percentile: Object.fromEntries(
          [
            [25, calculateLeadTimePercentile(leadTimes, 25)],
            [50, calculateLeadTimePercentile(leadTimes, 50)],
            [75, calculateLeadTimePercentile(leadTimes, 75)],
            [90, calculateLeadTimePercentile(leadTimes, 90)],
            [95, calculateLeadTimePercentile(leadTimes, 95)],
            [99, calculateLeadTimePercentile(leadTimes, 99)],
          ].filter(([, value]) => value !== undefined),
        ) as { [key: number]: { durationMs: number } },
        outliersIqr: calculateLeadTimeOutliersIQR(leadTimes),
        outliersZscore: calculateLeadTimeOutliersZScore(leadTimes),
      }
    : undefined;

  // 計画と実績の差異の統計を計算
  const planVsActualStatistics = planVsActuals.length > 0
    ? {
        mean: calculatePlanVsActualMean(planVsActuals),
        median: calculatePlanVsActualMedian(planVsActuals),
        mode: calculatePlanVsActualMode(planVsActuals),
        max: calculatePlanVsActualMax(planVsActuals),
        min: calculatePlanVsActualMin(planVsActuals),
        variance: calculatePlanVsActualVariance(planVsActuals),
        standardDeviation: calculatePlanVsActualStandardDeviation(planVsActuals),
        interquartileRange: calculatePlanVsActualInterquartileRange(planVsActuals),
        kurtosis: calculatePlanVsActualKurtosis(planVsActuals),
        skewness: calculatePlanVsActualSkewness(planVsActuals),
        percentile: Object.fromEntries(
          [
            [25, calculatePlanVsActualPercentile(planVsActuals, 25)],
            [50, calculatePlanVsActualPercentile(planVsActuals, 50)],
            [75, calculatePlanVsActualPercentile(planVsActuals, 75)],
            [90, calculatePlanVsActualPercentile(planVsActuals, 90)],
            [95, calculatePlanVsActualPercentile(planVsActuals, 95)],
            [99, calculatePlanVsActualPercentile(planVsActuals, 99)],
          ].filter(([, value]) => value !== undefined),
        ) as {
          [key: number]: {
            planned: number;
            actual: number;
            variance: number;
            varianceRatio?: number;
          };
        },
        outliersIqr: calculatePlanVsActualOutliersIQR(planVsActuals),
        outliersZscore: calculatePlanVsActualOutliersZScore(planVsActuals),
      }
    : undefined;

  // レビュー時間の統計を計算
  const reviewTimeStatistics = reviewTimes.length > 0
    ? {
        mean: calculateReviewTimeMean(reviewTimes),
        median: calculateReviewTimeMedian(reviewTimes),
        mode: calculateReviewTimeMode(reviewTimes),
        max: calculateReviewTimeMax(reviewTimes),
        min: calculateReviewTimeMin(reviewTimes),
        variance: calculateReviewTimeVariance(reviewTimes),
        standardDeviation: calculateReviewTimeStandardDeviation(reviewTimes),
        interquartileRange: calculateReviewTimeInterquartileRange(reviewTimes),
        kurtosis: calculateReviewTimeKurtosis(reviewTimes),
        skewness: calculateReviewTimeSkewness(reviewTimes),
        percentile: Object.fromEntries(
          [
            [25, calculateReviewTimePercentile(reviewTimes, 25)],
            [50, calculateReviewTimePercentile(reviewTimes, 50)],
            [75, calculateReviewTimePercentile(reviewTimes, 75)],
            [90, calculateReviewTimePercentile(reviewTimes, 90)],
            [95, calculateReviewTimePercentile(reviewTimes, 95)],
            [99, calculateReviewTimePercentile(reviewTimes, 99)],
          ].filter(([, value]) => value !== undefined),
        ) as { [key: number]: { duration: number } },
        outliersIqr: calculateReviewTimeOutliersIQR(reviewTimes),
        outliersZscore: calculateReviewTimeOutliersZScore(reviewTimes),
      }
    : undefined;

  // 相関係数を計算
  const correlationStatistics = {
    commentVsComplexity: {
      pearson: calculateCommentVsComplexityCorrelationPearson(commentCounts, complexities),
      spearman: calculateCommentVsComplexityCorrelationSpearman(commentCounts, complexities),
    },
    commentVsCycleTime: {
      pearson: calculateCommentVsCycleTimeCorrelationPearson(commentCounts, cycleTimes),
      spearman: calculateCommentVsCycleTimeCorrelationSpearman(commentCounts, cycleTimes),
    },
    commentVsLeadTime: {
      pearson: calculateCommentVsLeadTimeCorrelationPearson(commentCounts, leadTimes),
      spearman: calculateCommentVsLeadTimeCorrelationSpearman(commentCounts, leadTimes),
    },
    commentVsPlanVsActual: {
      pearson: calculateCommentVsPlanVsActualCorrelationPearson(commentCounts, planVsActuals),
      spearman: calculateCommentVsPlanVsActualCorrelationSpearman(commentCounts, planVsActuals),
    },
    commentVsReviewTime: {
      pearson: calculateCommentVsReviewTimeCorrelationPearson(commentCounts, reviewTimes),
      spearman: calculateCommentVsReviewTimeCorrelationSpearman(commentCounts, reviewTimes),
    },
    complexityVsCycleTime: {
      pearson: calculateComplexityVsCycleTimeCorrelationPearson(complexities, cycleTimes),
      spearman: calculateComplexityVsCycleTimeCorrelationSpearman(complexities, cycleTimes),
    },
    complexityVsLeadTime: {
      pearson: calculateComplexityVsLeadTimeCorrelationPearson(complexities, leadTimes),
      spearman: calculateComplexityVsLeadTimeCorrelationSpearman(complexities, leadTimes),
    },
    complexityVsPlanVsActual: {
      pearson: calculateComplexityVsPlanVsActualCorrelationPearson(complexities, planVsActuals),
      spearman: calculateComplexityVsPlanVsActualCorrelationSpearman(complexities, planVsActuals),
    },
    complexityVsReviewTime: {
      pearson: calculateComplexityVsReviewTimeCorrelationPearson(complexities, reviewTimes),
      spearman: calculateComplexityVsReviewTimeCorrelationSpearman(complexities, reviewTimes),
    },
    cycleTimeVsLeadTime: {
      pearson: calculateCycleTimeVsLeadTimeCorrelationPearson(cycleTimes, leadTimes),
      spearman: calculateCycleTimeVsLeadTimeCorrelationSpearman(cycleTimes, leadTimes),
    },
    cycleTimeVsPlanVsActual: {
      pearson: calculateCycleTimeVsPlanVsActualCorrelationPearson(cycleTimes, planVsActuals),
      spearman: calculateCycleTimeVsPlanVsActualCorrelationSpearman(cycleTimes, planVsActuals),
    },
    cycleTimeVsReviewTime: {
      pearson: calculateCycleTimeVsReviewTimeCorrelationPearson(cycleTimes, reviewTimes),
      spearman: calculateCycleTimeVsReviewTimeCorrelationSpearman(cycleTimes, reviewTimes),
    },
    leadTimeVsPlanVsActual: {
      pearson: calculateLeadTimeVsPlanVsActualCorrelationPearson(leadTimes, planVsActuals),
      spearman: calculateLeadTimeVsPlanVsActualCorrelationSpearman(leadTimes, planVsActuals),
    },
    leadTimeVsReviewTime: {
      pearson: calculateLeadTimeVsReviewTimeCorrelationPearson(leadTimes, reviewTimes),
      spearman: calculateLeadTimeVsReviewTimeCorrelationSpearman(leadTimes, reviewTimes),
    },
    planVsActualVsReviewTime: {
      pearson: calculatePlanVsActualVsReviewTimeCorrelationPearson(planVsActuals, reviewTimes),
      spearman: calculatePlanVsActualVsReviewTimeCorrelationSpearman(planVsActuals, reviewTimes),
    },
  };

  return {
    commentCount: commentCountStatistics,
    complexity: complexityStatistics,
    cycleTime: cycleTimeStatistics,
    leadTime: leadTimeStatistics,
    planVsActual: planVsActualStatistics,
    reviewTime: reviewTimeStatistics,
    correlation: correlationStatistics,
  };
}

