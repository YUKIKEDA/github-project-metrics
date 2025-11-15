import type { ReviewTimeMetric } from "@github-project-metrics/ghpm-metrics";
import { min } from "@github-project-metrics/ghpm-statistics";

/**
 * ReviewTimeMetric の各フィールドの最小値を計算します。
 *
 * @param metrics - 最小値を計算する ReviewTimeMetric 配列
 * @returns 各フィールドの最小値。配列が空の場合は undefined を返します。
 */
export function calculateReviewTimeMin(
  metrics: ReadonlyArray<ReviewTimeMetric>,
): { duration: number } | undefined {
  if (metrics.length === 0) {
    return undefined;
  }

  const durationValues = metrics.map((m) => m.duration);

  return {
    duration: min(durationValues),
  };
}

