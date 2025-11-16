import { interquartileRange } from "@github-project-metrics/ghpm-statistics";
/**
 * ComplexityMetric の各フィールドの四分位範囲を計算します。
 *
 * @param metrics - 四分位範囲を計算する ComplexityMetric 配列
 * @param options - 四分位範囲計算オプション
 * @returns 各フィールドの四分位範囲。配列が空、または estimated が存在しない場合は undefined を返します。
 */
export function calculateComplexityInterquartileRange(metrics, options) {
    const estimatedValues = metrics
        .map((m) => m.estimated)
        .filter((v) => v !== undefined);
    if (estimatedValues.length === 0) {
        return undefined;
    }
    try {
        return {
            estimated: interquartileRange(estimatedValues, options),
        };
    }
    catch {
        return undefined;
    }
}
//# sourceMappingURL=index.js.map