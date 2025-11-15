import type { PlanVsActualMetric } from "@github-project-metrics/ghpm-metrics";
import { percentile } from "@github-project-metrics/ghpm-statistics";
import type { PercentileOptions } from "@github-project-metrics/ghpm-statistics";

/**
 * PlanVsActualMetric の各フィールドのパーセンタイルを計算します。
 *
 * @param metrics - パーセンタイルを計算する PlanVsActualMetric 配列
 * @param percentileValue - 計算するパーセンタイル値 (0-100)
 * @param options - パーセンタイル計算オプション
 * @returns 各フィールドのパーセンタイル。配列が空の場合は undefined を返します。
 */
export function calculatePlanVsActualPercentile(
  metrics: ReadonlyArray<PlanVsActualMetric>,
  percentileValue: number,
  options?: PercentileOptions,
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
    planned: 0,
    actual: 0,
    variance: 0,
  };

  try {
    result.planned = percentile(plannedValues, percentileValue, options);
    result.actual = percentile(actualValues, percentileValue, options);
    result.variance = percentile(varianceValues, percentileValue, options);

    if (varianceRatioValues.length > 0) {
      result.varianceRatio = percentile(
        varianceRatioValues,
        percentileValue,
        options,
      );
    }

    return result;
  } catch {
    return undefined;
  }
}

