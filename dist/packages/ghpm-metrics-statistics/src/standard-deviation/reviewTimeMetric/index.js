import { standardDeviation } from "@github-project-metrics/ghpm-statistics";
/**
 * ReviewTimeMetric の各フィールドの標準偏差を計算します。
 *
 * @param metrics - 標準偏差を計算する ReviewTimeMetric 配列
 * @returns 各フィールドの標準偏差。配列が空、または要素数が不足している場合は undefined を返します。
 */
export function calculateReviewTimeStandardDeviation(metrics) {
    if (metrics.length < 2) {
        return undefined;
    }
    const durationValues = metrics.map((m) => m.duration);
    try {
        return {
            duration: standardDeviation(durationValues),
        };
    }
    catch {
        return undefined;
    }
}
//# sourceMappingURL=index.js.map