import type { CycleTimeMetric } from "@github-project-metrics/ghpm-metrics";
import { median } from "@github-project-metrics/ghpm-statistics";

/**
 * CycleTimeMetric の各フィールドの中央値を計算します。
 *
 * @param metrics - 中央値を計算する CycleTimeMetric 配列
 * @returns 各フィールドの中央値。配列が空の場合は undefined を返します。
 */
export function calculateCycleTimeMedian(
  metrics: ReadonlyArray<CycleTimeMetric>,
): { durationMs: number } | undefined {
  if (metrics.length === 0) {
    return undefined;
  }

  const durationMsValues = metrics.map((m) => m.durationMs);

  return {
    durationMs: median(durationMsValues),
  };
}

