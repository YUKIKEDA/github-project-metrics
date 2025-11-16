import { outliersIQR } from "@github-project-metrics/ghpm-statistics";
/**
 * ComplexityMetric の各フィールドの外れ値を検出します（IQR法）。
 *
 * @param metrics - 外れ値を検出する ComplexityMetric 配列
 * @param options - 外れ値検出オプション
 * @returns 各フィールドの外れ値。配列が空、または estimated が存在しない場合は undefined を返します。
 */
export function calculateComplexityOutliersIQR(metrics, options) {
    const estimatedValues = metrics
        .map((m) => m.estimated)
        .filter((v) => v !== undefined);
    if (estimatedValues.length === 0) {
        return undefined;
    }
    try {
        return {
            estimated: outliersIQR(estimatedValues, options),
        };
    }
    catch {
        return undefined;
    }
}
//# sourceMappingURL=index.js.map