import type { LeadTimeMetric } from "@github-project-metrics/ghpm-metrics";
import { outliersZScore } from "@github-project-metrics/ghpm-statistics";
import type { OutliersZScoreOptions, ZScoreOutlier } from "@github-project-metrics/ghpm-statistics";

/**
 * LeadTimeMetric の各フィールドの外れ値を検出します（Z-score法）。
 *
 * @param metrics - 外れ値を検出する LeadTimeMetric 配列
 * @param options - 外れ値検出オプション
 * @returns 各フィールドの外れ値。配列が空の場合は undefined を返します。
 */
export function calculateLeadTimeOutliersZScore(
  metrics: ReadonlyArray<LeadTimeMetric>,
  options?: OutliersZScoreOptions,
): { durationMs: ZScoreOutlier[] } | undefined {
  if (metrics.length === 0) {
    return undefined;
  }

  const durationMsValues = metrics.map((m) => m.durationMs);

  try {
    return {
      durationMs: outliersZScore(durationMsValues, options),
    };
  } catch {
    return undefined;
  }
}

