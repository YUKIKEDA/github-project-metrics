import { min } from "@github-project-metrics/ghpm-statistics";
/**
 * ComplexityMetric の各フィールドの最小値を計算します。
 *
 * @param metrics - 最小値を計算する ComplexityMetric 配列
 * @returns 各フィールドの最小値。配列が空、または estimated が存在しない場合は undefined を返します。
 */
export function calculateComplexityMin(metrics) {
    const estimatedValues = metrics
        .map((m) => m.estimated)
        .filter((v) => v !== undefined);
    if (estimatedValues.length === 0) {
        return undefined;
    }
    return {
        estimated: min(estimatedValues),
    };
}
//# sourceMappingURL=index.js.map