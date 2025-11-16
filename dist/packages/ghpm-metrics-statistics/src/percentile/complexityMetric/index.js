import { percentile } from "@github-project-metrics/ghpm-statistics";
/**
 * ComplexityMetric の各フィールドのパーセンタイルを計算します。
 *
 * @param metrics - パーセンタイルを計算する ComplexityMetric 配列
 * @param percentileValue - 計算するパーセンタイル値 (0-100)
 * @param options - パーセンタイル計算オプション
 * @returns 各フィールドのパーセンタイル。配列が空、または estimated が存在しない場合は undefined を返します。
 */
export function calculateComplexityPercentile(metrics, percentileValue, options) {
    const estimatedValues = metrics
        .map((m) => m.estimated)
        .filter((v) => v !== undefined);
    if (estimatedValues.length === 0) {
        return undefined;
    }
    try {
        return {
            estimated: percentile(estimatedValues, percentileValue, options),
        };
    }
    catch {
        return undefined;
    }
}
//# sourceMappingURL=index.js.map