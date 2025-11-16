import { correlationSpearman } from "@github-project-metrics/ghpm-statistics";
/**
 * CycleTimeMetric と ReviewTimeMetric のスピアマン相関係数を計算します。
 *
 * @param cycleTimes - CycleTimeMetric 配列
 * @param reviewTimes - ReviewTimeMetric 配列
 * @returns 相関係数（-1 から 1 の範囲）。計算できない場合は undefined を返します。
 */
export function calculateCycleTimeVsReviewTimeCorrelationSpearman(cycleTimes, reviewTimes) {
    if (cycleTimes.length === 0 || reviewTimes.length === 0) {
        return undefined;
    }
    const minLength = Math.min(cycleTimes.length, reviewTimes.length);
    if (minLength < 2) {
        return undefined;
    }
    const cycleTimeValues = cycleTimes.slice(0, minLength).map((c) => c.durationMs);
    const reviewTimeValues = reviewTimes.slice(0, minLength).map((r) => r.duration);
    try {
        return correlationSpearman(cycleTimeValues, reviewTimeValues);
    }
    catch {
        return undefined;
    }
}
//# sourceMappingURL=index.js.map