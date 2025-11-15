import type { PlanVsActualMetric } from "@github-project-metrics/ghpm-metrics";
import { outliersIQR } from "@github-project-metrics/ghpm-statistics";
import type { IQROutlier, OutliersIQROptions } from "@github-project-metrics/ghpm-statistics";

/**
 * PlanVsActualMetric の各フィールドの外れ値を検出します（IQR法）。
 *
 * @param metrics - 外れ値を検出する PlanVsActualMetric 配列
 * @param options - 外れ値検出オプション
 * @returns 各フィールドの外れ値。配列が空の場合は undefined を返します。
 */
export function calculatePlanVsActualOutliersIQR(
  metrics: ReadonlyArray<PlanVsActualMetric>,
  options?: OutliersIQROptions,
): {
  planned: IQROutlier[];
  actual: IQROutlier[];
  variance: IQROutlier[];
  varianceRatio?: IQROutlier[];
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
    planned: IQROutlier[];
    actual: IQROutlier[];
    variance: IQROutlier[];
    varianceRatio?: IQROutlier[];
  } = {
    planned: [],
    actual: [],
    variance: [],
  };

  try {
    result.planned = outliersIQR(plannedValues, options);
    result.actual = outliersIQR(actualValues, options);
    result.variance = outliersIQR(varianceValues, options);

    if (varianceRatioValues.length > 0) {
      result.varianceRatio = outliersIQR(varianceRatioValues, options);
    }

    return result;
  } catch {
    return undefined;
  }
}

