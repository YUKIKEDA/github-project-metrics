import type { PlanVsActualMetric, ReviewTimeMetric } from "@github-project-metrics/ghpm-metrics";
import { correlationPearson } from "@github-project-metrics/ghpm-statistics";

/**
 * PlanVsActualMetric と ReviewTimeMetric のピアソン相関係数を計算します。
 * planned フィールドを使用します。
 *
 * @param planVsActuals - PlanVsActualMetric 配列
 * @param reviewTimes - ReviewTimeMetric 配列
 * @returns 相関係数（-1 から 1 の範囲）。計算できない場合は undefined を返します。
 */
export function calculatePlanVsActualVsReviewTimeCorrelationPearson(
  planVsActuals: ReadonlyArray<PlanVsActualMetric>,
  reviewTimes: ReadonlyArray<ReviewTimeMetric>,
): number | undefined {
  if (planVsActuals.length === 0 || reviewTimes.length === 0) {
    return undefined;
  }

  const minLength = Math.min(planVsActuals.length, reviewTimes.length);
  if (minLength < 2) {
    return undefined;
  }

  const plannedValues = planVsActuals.slice(0, minLength).map((p) => p.planned);
  const reviewTimeValues = reviewTimes.slice(0, minLength).map((r) => r.duration);

  try {
    return correlationPearson(plannedValues, reviewTimeValues);
  } catch {
    return undefined;
  }
}

