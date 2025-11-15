import type { PlanVsActualMetric } from "@github-project-metrics/ghpm-metrics";
import { mode } from "@github-project-metrics/ghpm-statistics";

/**
 * PlanVsActualMetric の各フィールドの最頻値を計算します。
 *
 * @param metrics - 最頻値を計算する PlanVsActualMetric 配列
 * @returns 各フィールドの最頻値。配列が空の場合は undefined を返します。
 */
export function calculatePlanVsActualMode(
  metrics: ReadonlyArray<PlanVsActualMetric>,
): {
  planned: number;
  actual: number;
  variance: number;
  varianceRatio?: number;
} | undefined {
  if (metrics.length === 0) {
    return undefined;
  }

  const plannedValues = metrics.map((m) => m.planned);
  const actualValues = metrics.map((m) => m.actual);
  const varianceValues = metrics.map((m) => m.variance);
  const varianceRatioValues = metrics
    .map((m) => m.varianceRatio)
    .filter((v): v is number => v !== undefined);

  const result: {
    planned: number;
    actual: number;
    variance: number;
    varianceRatio?: number;
  } = {
    planned: mode(plannedValues),
    actual: mode(actualValues),
    variance: mode(varianceValues),
  };

  if (varianceRatioValues.length > 0) {
    result.varianceRatio = mode(varianceRatioValues);
  }

  return result;
}

