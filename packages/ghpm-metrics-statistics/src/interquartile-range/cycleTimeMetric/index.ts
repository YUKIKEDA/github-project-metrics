import type { CycleTimeMetric } from "@github-project-metrics/ghpm-metrics";
import { interquartileRange } from "@github-project-metrics/ghpm-statistics";
import type { InterquartileRangeOptions } from "@github-project-metrics/ghpm-statistics";

/**
 * CycleTimeMetric の各フィールドの四分位範囲を計算します。
 *
 * @param metrics - 四分位範囲を計算する CycleTimeMetric 配列
 * @param options - 四分位範囲計算オプション
 * @returns 各フィールドの四分位範囲。配列が空の場合は undefined を返します。
 */
export function calculateCycleTimeInterquartileRange(
  metrics: ReadonlyArray<CycleTimeMetric>,
  options?: InterquartileRangeOptions,
): { durationMs: number } | undefined {
  if (metrics.length === 0) {
    return undefined;
  }

  const durationMsValues = metrics.map((m) => m.durationMs);

  try {
    return {
      durationMs: interquartileRange(durationMsValues, options),
    };
  } catch {
    return undefined;
  }
}

