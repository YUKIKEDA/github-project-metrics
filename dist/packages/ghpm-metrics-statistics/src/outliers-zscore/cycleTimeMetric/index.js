import { outliersZScore } from "@github-project-metrics/ghpm-statistics";
/**
 * CycleTimeMetric の各フィールドの外れ値を検出します（Z-score法）。
 *
 * @param metrics - 外れ値を検出する CycleTimeMetric 配列
 * @param options - 外れ値検出オプション
 * @returns 各フィールドの外れ値。配列が空の場合は undefined を返します。
 */
export function calculateCycleTimeOutliersZScore(metrics, options) {
    if (metrics.length === 0) {
        return undefined;
    }
    const durationMsValues = metrics.map((m) => m.durationMs);
    try {
        return {
            durationMs: outliersZScore(durationMsValues, options),
        };
    }
    catch {
        return undefined;
    }
}
//# sourceMappingURL=index.js.map