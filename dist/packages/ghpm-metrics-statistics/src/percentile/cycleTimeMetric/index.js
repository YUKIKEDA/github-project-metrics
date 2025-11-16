import { percentile } from "@github-project-metrics/ghpm-statistics";
/**
 * CycleTimeMetric の各フィールドのパーセンタイルを計算します。
 *
 * @param metrics - パーセンタイルを計算する CycleTimeMetric 配列
 * @param percentileValue - 計算するパーセンタイル値 (0-100)
 * @param options - パーセンタイル計算オプション
 * @returns 各フィールドのパーセンタイル。配列が空の場合は undefined を返します。
 */
export function calculateCycleTimePercentile(metrics, percentileValue, options) {
    if (metrics.length === 0) {
        return undefined;
    }
    const durationMsValues = metrics.map((m) => m.durationMs);
    try {
        return {
            durationMs: percentile(durationMsValues, percentileValue, options),
        };
    }
    catch {
        return undefined;
    }
}
//# sourceMappingURL=index.js.map