import type { ReviewTimeMetric } from "@github-project-metrics/ghpm-metrics";
import { outliersZScore } from "@github-project-metrics/ghpm-statistics";
import type { OutliersZScoreOptions, ZScoreOutlier } from "@github-project-metrics/ghpm-statistics";

/**
 * ReviewTimeMetric の各フィールドの外れ値を検出します（Z-score法）。
 *
 * @param metrics - 外れ値を検出する ReviewTimeMetric 配列
 * @param options - 外れ値検出オプション
 * @returns 各フィールドの外れ値。配列が空の場合は undefined を返します。
 */
export function calculateReviewTimeOutliersZScore(
  metrics: ReadonlyArray<ReviewTimeMetric>,
  options?: OutliersZScoreOptions,
): { duration: ZScoreOutlier[] } | undefined {
  if (metrics.length === 0) {
    return undefined;
  }

  const durationValues = metrics.map((m) => m.duration);

  try {
    return {
      duration: outliersZScore(durationValues, options),
    };
  } catch {
    return undefined;
  }
}

