import type { ReviewTimeMetric } from "@github-project-metrics/ghpm-metrics";
import { median } from "@github-project-metrics/ghpm-statistics";

/**
 * ReviewTimeMetric の各フィールドの中央値を計算します。
 *
 * @param metrics - 中央値を計算する ReviewTimeMetric 配列
 * @returns 各フィールドの中央値。配列が空の場合は undefined を返します。
 */
export function calculateReviewTimeMedian(
  metrics: ReadonlyArray<ReviewTimeMetric>,
): { duration: number } | undefined {
  if (metrics.length === 0) {
    return undefined;
  }

  const durationValues = metrics.map((m) => m.duration);

  return {
    duration: median(durationValues),
  };
}

