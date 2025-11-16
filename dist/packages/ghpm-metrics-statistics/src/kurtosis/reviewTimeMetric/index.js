import { kurtosis } from "@github-project-metrics/ghpm-statistics";
/**
 * ReviewTimeMetric の各フィールドの尖度を計算します。
 *
 * @param metrics - 尖度を計算する ReviewTimeMetric 配列
 * @returns 各フィールドの尖度。配列が空、または要素数が不足している場合は undefined を返します。
 */
export function calculateReviewTimeKurtosis(metrics) {
    if (metrics.length < 4) {
        return undefined;
    }
    const durationValues = metrics.map((m) => m.duration);
    try {
        return {
            duration: kurtosis(durationValues),
        };
    }
    catch {
        return undefined;
    }
}
//# sourceMappingURL=index.js.map