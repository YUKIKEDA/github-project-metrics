import { mean } from "@github-project-metrics/ghpm-statistics";
/**
 * ComplexityMetric の各フィールドの平均値を計算します。
 *
 * @param metrics - 平均値を計算する ComplexityMetric 配列
 * @returns 各フィールドの平均値。配列が空、または estimated が存在しない場合は undefined を返します。
 */
export function calculateComplexityMean(metrics) {
    const estimatedValues = metrics
        .map((m) => m.estimated)
        .filter((v) => v !== undefined);
    if (estimatedValues.length === 0) {
        return undefined;
    }
    return {
        estimated: mean(estimatedValues),
    };
}
//# sourceMappingURL=index.js.map