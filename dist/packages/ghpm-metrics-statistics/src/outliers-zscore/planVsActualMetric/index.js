import { outliersZScore } from "@github-project-metrics/ghpm-statistics";
/**
 * PlanVsActualMetric の各フィールドの外れ値を検出します（Z-score法）。
 *
 * @param metrics - 外れ値を検出する PlanVsActualMetric 配列
 * @param options - 外れ値検出オプション
 * @returns 各フィールドの外れ値。配列が空の場合は undefined を返します。
 */
export function calculatePlanVsActualOutliersZScore(metrics, options) {
    if (metrics.length === 0) {
        return undefined;
    }
    const plannedValues = metrics.map((m) => m.planned);
    const actualValues = metrics.map((m) => m.actual);
    const varianceValues = metrics.map((m) => m.variance);
    const varianceRatioValues = metrics
        .map((m) => m.varianceRatio)
        .filter((v) => v !== undefined);
    const result = {
        planned: [],
        actual: [],
        variance: [],
    };
    try {
        result.planned = outliersZScore(plannedValues, options);
        result.actual = outliersZScore(actualValues, options);
        result.variance = outliersZScore(varianceValues, options);
        if (varianceRatioValues.length > 0) {
            result.varianceRatio = outliersZScore(varianceRatioValues, options);
        }
        return result;
    }
    catch {
        return undefined;
    }
}
//# sourceMappingURL=index.js.map