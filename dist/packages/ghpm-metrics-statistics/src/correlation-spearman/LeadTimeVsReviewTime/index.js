import { correlationSpearman } from "@github-project-metrics/ghpm-statistics";
/**
 * LeadTimeMetric と ReviewTimeMetric のスピアマン相関係数を計算します。
 *
 * @param leadTimes - LeadTimeMetric 配列
 * @param reviewTimes - ReviewTimeMetric 配列
 * @returns 相関係数（-1 から 1 の範囲）。計算できない場合は undefined を返します。
 */
export function calculateLeadTimeVsReviewTimeCorrelationSpearman(leadTimes, reviewTimes) {
    if (leadTimes.length === 0 || reviewTimes.length === 0) {
        return undefined;
    }
    const minLength = Math.min(leadTimes.length, reviewTimes.length);
    if (minLength < 2) {
        return undefined;
    }
    const leadTimeValues = leadTimes.slice(0, minLength).map((l) => l.durationMs);
    const reviewTimeValues = reviewTimes.slice(0, minLength).map((r) => r.duration);
    try {
        return correlationSpearman(leadTimeValues, reviewTimeValues);
    }
    catch {
        return undefined;
    }
}
//# sourceMappingURL=index.js.map