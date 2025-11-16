import { kurtosis } from "@github-project-metrics/ghpm-statistics";
/**
 * ComplexityMetric の各フィールドの尖度を計算します。
 *
 * @param metrics - 尖度を計算する ComplexityMetric 配列
 * @returns 各フィールドの尖度。配列が空、または estimated が存在しない、または要素数が不足している場合は undefined を返します。
 */
export function calculateComplexityKurtosis(metrics) {
    const estimatedValues = metrics
        .map((m) => m.estimated)
        .filter((v) => v !== undefined);
    if (estimatedValues.length < 4) {
        return undefined;
    }
    try {
        return {
            estimated: kurtosis(estimatedValues),
        };
    }
    catch {
        return undefined;
    }
}
//# sourceMappingURL=index.js.map