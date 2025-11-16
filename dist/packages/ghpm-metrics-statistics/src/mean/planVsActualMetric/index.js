import { mean } from "@github-project-metrics/ghpm-statistics";
/**
 * PlanVsActualMetric の各フィールドの平均値を計算します。
 *
 * @param metrics - 平均値を計算する PlanVsActualMetric 配列
 * @returns 各フィールドの平均値。配列が空の場合は undefined を返します。
 */
export function calculatePlanVsActualMean(metrics) {
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
        planned: mean(plannedValues),
        actual: mean(actualValues),
        variance: mean(varianceValues),
    };
    if (varianceRatioValues.length > 0) {
        result.varianceRatio = mean(varianceRatioValues);
    }
    return result;
}
//# sourceMappingURL=index.js.map