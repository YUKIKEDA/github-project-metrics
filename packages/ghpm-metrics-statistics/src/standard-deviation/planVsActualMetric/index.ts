import type { PlanVsActualMetric } from "@github-project-metrics/ghpm-metrics";
import { standardDeviation } from "@github-project-metrics/ghpm-statistics";

/**
 * PlanVsActualMetric の各フィールドの標準偏差を計算します。
 *
 * @param metrics - 標準偏差を計算する PlanVsActualMetric 配列
 * @returns 各フィールドの標準偏差。配列が空、または要素数が不足している場合は undefined を返します。
 */
export function calculatePlanVsActualStandardDeviation(
  metrics: ReadonlyArray<PlanVsActualMetric>,
): {
  planned: number;
  actual: number;
  variance: number;
  varianceRatio?: number;
} | undefined {
  if (metrics.length < 2) {
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
    planned: 0,
    actual: 0,
    variance: 0,
  };

  try {
    result.planned = standardDeviation(plannedValues);
    result.actual = standardDeviation(actualValues);
    result.variance = standardDeviation(varianceValues);

    if (varianceRatioValues.length >= 2) {
      result.varianceRatio = standardDeviation(varianceRatioValues);
    }

    return result;
  } catch {
    return undefined;
  }
}

