import { kurtosis } from "@github-project-metrics/ghpm-statistics";
/**
 * PlanVsActualMetric の各フィールドの尖度を計算します。
 *
 * @param metrics - 尖度を計算する PlanVsActualMetric 配列
 * @returns 各フィールドの尖度。配列が空、または要素数が不足している場合は undefined を返します。
 */
export function calculatePlanVsActualKurtosis(metrics) {
    if (metrics.length < 4) {
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
        result.planned = kurtosis(plannedValues);
        result.actual = kurtosis(actualValues);
        result.variance = kurtosis(varianceValues);
        if (varianceRatioValues.length >= 4) {
            result.varianceRatio = kurtosis(varianceRatioValues);
        }
        return result;
    }
    catch {
        return undefined;
    }
}
//# sourceMappingURL=index.js.map