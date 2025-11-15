import type { PlanVsActualMetric } from "@github-project-metrics/ghpm-metrics";
import { variance } from "@github-project-metrics/ghpm-statistics";

/**
 * PlanVsActualMetric の各フィールドの分散を計算します。
 *
 * @param metrics - 分散を計算する PlanVsActualMetric 配列
 * @returns 各フィールドの分散。配列が空、または要素数が不足している場合は undefined を返します。
 */
export function calculatePlanVsActualVariance(
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
    result.planned = variance(plannedValues);
    result.actual = variance(actualValues);
    result.variance = variance(varianceValues);

    if (varianceRatioValues.length >= 2) {
      result.varianceRatio = variance(varianceRatioValues);
    }

    return result;
  } catch {
    return undefined;
  }
}

