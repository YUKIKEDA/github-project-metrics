import type { ReviewTimeMetric } from "@github-project-metrics/ghpm-metrics";
import { skewness } from "@github-project-metrics/ghpm-statistics";

/**
 * ReviewTimeMetric の各フィールドの歪度を計算します。
 *
 * @param metrics - 歪度を計算する ReviewTimeMetric 配列
 * @returns 各フィールドの歪度。配列が空、または要素数が不足している場合は undefined を返します。
 */
export function calculateReviewTimeSkewness(
  metrics: ReadonlyArray<ReviewTimeMetric>,
): { duration: number } | undefined {
  if (metrics.length < 3) {
    return undefined;
  }

  const durationValues = metrics.map((m) => m.duration);

  try {
    return {
      duration: skewness(durationValues),
    };
  } catch {
    return undefined;
  }
}

