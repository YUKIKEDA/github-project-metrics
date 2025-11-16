import { skewness } from "@github-project-metrics/ghpm-statistics";
/**
 * LeadTimeMetric の各フィールドの歪度を計算します。
 *
 * @param metrics - 歪度を計算する LeadTimeMetric 配列
 * @returns 各フィールドの歪度。配列が空、または要素数が不足している場合は undefined を返します。
 */
export function calculateLeadTimeSkewness(metrics) {
    if (metrics.length < 3) {
        return undefined;
    }
    const durationMsValues = metrics.map((m) => m.durationMs);
    try {
        return {
            durationMs: skewness(durationMsValues),
        };
    }
    catch {
        return undefined;
    }
}
//# sourceMappingURL=index.js.map