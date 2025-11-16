import { mode } from "@github-project-metrics/ghpm-statistics";
/**
 * ReviewTimeMetric の各フィールドの最頻値を計算します。
 *
 * @param metrics - 最頻値を計算する ReviewTimeMetric 配列
 * @returns 各フィールドの最頻値。配列が空の場合は undefined を返します。
 */
export function calculateReviewTimeMode(metrics) {
    if (metrics.length === 0) {
        return undefined;
    }
    const durationValues = metrics.map((m) => m.duration);
    return {
        duration: mode(durationValues),
    };
}
//# sourceMappingURL=index.js.map