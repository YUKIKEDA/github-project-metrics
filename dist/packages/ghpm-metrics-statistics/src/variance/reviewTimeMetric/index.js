import { variance } from "@github-project-metrics/ghpm-statistics";
/**
 * ReviewTimeMetric の各フィールドの分散を計算します。
 *
 * @param metrics - 分散を計算する ReviewTimeMetric 配列
 * @returns 各フィールドの分散。配列が空、または要素数が不足している場合は undefined を返します。
 */
export function calculateReviewTimeVariance(metrics) {
    if (metrics.length < 2) {
        return undefined;
    }
    const durationValues = metrics.map((m) => m.duration);
    try {
        return {
            duration: variance(durationValues),
        };
    }
    catch {
        return undefined;
    }
}
//# sourceMappingURL=index.js.map