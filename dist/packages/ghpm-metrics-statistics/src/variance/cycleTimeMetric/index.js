import { variance } from "@github-project-metrics/ghpm-statistics";
/**
 * CycleTimeMetric の各フィールドの分散を計算します。
 *
 * @param metrics - 分散を計算する CycleTimeMetric 配列
 * @returns 各フィールドの分散。配列が空、または要素数が不足している場合は undefined を返します。
 */
export function calculateCycleTimeVariance(metrics) {
    if (metrics.length < 2) {
        return undefined;
    }
    const durationMsValues = metrics.map((m) => m.durationMs);
    try {
        return {
            durationMs: variance(durationMsValues),
        };
    }
    catch {
        return undefined;
    }
}
//# sourceMappingURL=index.js.map