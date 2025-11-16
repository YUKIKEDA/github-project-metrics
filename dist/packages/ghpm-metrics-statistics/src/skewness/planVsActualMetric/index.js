import { skewness } from "@github-project-metrics/ghpm-statistics";
/**
 * PlanVsActualMetric の各フィールドの歪度を計算します。
 *
 * @param metrics - 歪度を計算する PlanVsActualMetric 配列
 * @returns 各フィールドの歪度。配列が空、または要素数が不足している場合は undefined を返します。
 */
export function calculatePlanVsActualSkewness(metrics) {
    if (metrics.length < 3) {
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
        result.planned = skewness(plannedValues);
        result.actual = skewness(actualValues);
        result.variance = skewness(varianceValues);
        if (varianceRatioValues.length >= 3) {
            result.varianceRatio = skewness(varianceRatioValues);
        }
        return result;
    }
    catch {
        return undefined;
    }
}
//# sourceMappingURL=index.js.map