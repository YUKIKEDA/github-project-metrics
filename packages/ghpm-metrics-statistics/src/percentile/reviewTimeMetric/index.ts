import type { ReviewTimeMetric } from "@github-project-metrics/ghpm-metrics";
import { percentile } from "@github-project-metrics/ghpm-statistics";
import type { PercentileOptions } from "@github-project-metrics/ghpm-statistics";

/**
 * ReviewTimeMetric の各フィールドのパーセンタイルを計算します。
 *
 * @param metrics - パーセンタイルを計算する ReviewTimeMetric 配列
 * @param percentileValue - 計算するパーセンタイル値 (0-100)
 * @param options - パーセンタイル計算オプション
 * @returns 各フィールドのパーセンタイル。配列が空の場合は undefined を返します。
 */
export function calculateReviewTimePercentile(
  metrics: ReadonlyArray<ReviewTimeMetric>,
  percentileValue: number,
  options?: PercentileOptions,
): { duration: number } | undefined {
  if (metrics.length === 0) {
    return undefined;
  }

  const durationValues = metrics.map((m) => m.duration);

  try {
    return {
      duration: percentile(durationValues, percentileValue, options),
    };
  } catch {
    return undefined;
  }
}

