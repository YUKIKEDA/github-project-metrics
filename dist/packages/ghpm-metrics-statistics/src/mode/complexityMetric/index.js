import { mode } from "@github-project-metrics/ghpm-statistics";
/**
 * ComplexityMetric の各フィールドの最頻値を計算します。
 *
 * @param metrics - 最頻値を計算する ComplexityMetric 配列
 * @returns 各フィールドの最頻値。配列が空、または estimated が存在しない場合は undefined を返します。
 */
export function calculateComplexityMode(metrics) {
    const estimatedValues = metrics
        .map((m) => m.estimated)
        .filter((v) => v !== undefined);
    if (estimatedValues.length === 0) {
        return undefined;
    }
    return {
        estimated: mode(estimatedValues),
    };
}
//# sourceMappingURL=index.js.map