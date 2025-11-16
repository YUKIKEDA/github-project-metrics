import { standardDeviation } from "@github-project-metrics/ghpm-statistics";
/**
 * CycleTimeMetric の各フィールドの標準偏差を計算します。
 *
 * @param metrics - 標準偏差を計算する CycleTimeMetric 配列
 * @returns 各フィールドの標準偏差。配列が空、または要素数が不足している場合は undefined を返します。
 */
export function calculateCycleTimeStandardDeviation(metrics) {
    if (metrics.length < 2) {
        return undefined;
    }
    const durationMsValues = metrics.map((m) => m.durationMs);
    try {
        return {
            durationMs: standardDeviation(durationMsValues),
        };
    }
    catch {
        return undefined;
    }
}
//# sourceMappingURL=index.js.map