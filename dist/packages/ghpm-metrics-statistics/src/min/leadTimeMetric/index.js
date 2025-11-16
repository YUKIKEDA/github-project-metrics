import { min } from "@github-project-metrics/ghpm-statistics";
/**
 * LeadTimeMetric の各フィールドの最小値を計算します。
 *
 * @param metrics - 最小値を計算する LeadTimeMetric 配列
 * @returns 各フィールドの最小値。配列が空の場合は undefined を返します。
 */
export function calculateLeadTimeMin(metrics) {
    if (metrics.length === 0) {
        return undefined;
    }
    const durationMsValues = metrics.map((m) => m.durationMs);
    return {
        durationMs: min(durationMsValues),
    };
}
//# sourceMappingURL=index.js.map