import type { CycleTimeMetric } from "@github-project-metrics/ghpm-metrics";
import { mode } from "@github-project-metrics/ghpm-statistics";

/**
 * CycleTimeMetric の各フィールドの最頻値を計算します。
 *
 * @param metrics - 最頻値を計算する CycleTimeMetric 配列
 * @returns 各フィールドの最頻値。配列が空の場合は undefined を返します。
 */
export function calculateCycleTimeMode(
  metrics: ReadonlyArray<CycleTimeMetric>,
): { durationMs: number } | undefined {
  if (metrics.length === 0) {
    return undefined;
  }

  const durationMsValues = metrics.map((m) => m.durationMs);

  return {
    durationMs: mode(durationMsValues),
  };
}

