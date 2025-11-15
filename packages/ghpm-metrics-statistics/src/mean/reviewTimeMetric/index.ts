import type { ReviewTimeMetric } from "@github-project-metrics/ghpm-metrics";
import { mean } from "@github-project-metrics/ghpm-statistics";

/**
 * ReviewTimeMetric の各フィールドの平均値を計算します。
 *
 * @param metrics - 平均値を計算する ReviewTimeMetric 配列
 * @returns 各フィールドの平均値。配列が空の場合は undefined を返します。
 */
export function calculateReviewTimeMean(
  metrics: ReadonlyArray<ReviewTimeMetric>,
): { duration: number } | undefined {
  if (metrics.length === 0) {
    return undefined;
  }

  const durationValues = metrics.map((m) => m.duration);

  return {
    duration: mean(durationValues),
  };
}

