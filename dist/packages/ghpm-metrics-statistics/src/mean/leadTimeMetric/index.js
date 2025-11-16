import { mean } from "@github-project-metrics/ghpm-statistics";
/**
 * LeadTimeMetric の各フィールドの平均値を計算します。
 *
 * @param metrics - 平均値を計算する LeadTimeMetric 配列
 * @returns 各フィールドの平均値。配列が空の場合は undefined を返します。
 */
export function calculateLeadTimeMean(metrics) {
    if (metrics.length === 0) {
        return undefined;
    }
    const durationMsValues = metrics.map((m) => m.durationMs);
    return {
        durationMs: mean(durationMsValues),
    };
}
//# sourceMappingURL=index.js.map