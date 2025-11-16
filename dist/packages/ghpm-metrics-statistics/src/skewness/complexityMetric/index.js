import { skewness } from "@github-project-metrics/ghpm-statistics";
/**
 * ComplexityMetric の各フィールドの歪度を計算します。
 *
 * @param metrics - 歪度を計算する ComplexityMetric 配列
 * @returns 各フィールドの歪度。配列が空、または estimated が存在しない、または要素数が不足している場合は undefined を返します。
 */
export function calculateComplexitySkewness(metrics) {
    const estimatedValues = metrics
        .map((m) => m.estimated)
        .filter((v) => v !== undefined);
    if (estimatedValues.length < 3) {
        return undefined;
    }
    try {
        return {
            estimated: skewness(estimatedValues),
        };
    }
    catch {
        return undefined;
    }
}
//# sourceMappingURL=index.js.map