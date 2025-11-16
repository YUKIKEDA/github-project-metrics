import { interquartileRange } from "@github-project-metrics/ghpm-statistics";
/**
 * PlanVsActualMetric の各フィールドの四分位範囲を計算します。
 *
 * @param metrics - 四分位範囲を計算する PlanVsActualMetric 配列
 * @param options - 四分位範囲計算オプション
 * @returns 各フィールドの四分位範囲。配列が空の場合は undefined を返します。
 */
export function calculatePlanVsActualInterquartileRange(metrics, options) {
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
        planned: 0,
        actual: 0,
        variance: 0,
    };
    try {
        result.planned = interquartileRange(plannedValues, options);
        result.actual = interquartileRange(actualValues, options);
        result.variance = interquartileRange(varianceValues, options);
        if (varianceRatioValues.length > 0) {
            result.varianceRatio = interquartileRange(varianceRatioValues, options);
        }
        return result;
    }
    catch {
        return undefined;
    }
}
//# sourceMappingURL=index.js.map