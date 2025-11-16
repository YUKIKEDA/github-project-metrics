import { interquartileRange } from "@github-project-metrics/ghpm-statistics";
/**
 * ReviewTimeMetric の各フィールドの四分位範囲を計算します。
 *
 * @param metrics - 四分位範囲を計算する ReviewTimeMetric 配列
 * @param options - 四分位範囲計算オプション
 * @returns 各フィールドの四分位範囲。配列が空の場合は undefined を返します。
 */
export function calculateReviewTimeInterquartileRange(metrics, options) {
    if (metrics.length === 0) {
        return undefined;
    }
    const durationValues = metrics.map((m) => m.duration);
    try {
        return {
            duration: interquartileRange(durationValues, options),
        };
    }
    catch {
        return undefined;
    }
}
//# sourceMappingURL=index.js.map