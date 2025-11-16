import { correlationSpearman } from "@github-project-metrics/ghpm-statistics";
/**
 * ComplexityMetric と ReviewTimeMetric のスピアマン相関係数を計算します。
 *
 * @param complexities - ComplexityMetric 配列
 * @param reviewTimes - ReviewTimeMetric 配列
 * @returns 相関係数（-1 から 1 の範囲）。計算できない場合は undefined を返します。
 */
export function calculateComplexityVsReviewTimeCorrelationSpearman(complexities, reviewTimes) {
    if (complexities.length === 0 || reviewTimes.length === 0) {
        return undefined;
    }
    const pairs = [];
    const minLength = Math.min(complexities.length, reviewTimes.length);
    for (let i = 0; i < minLength; i += 1) {
        const complexity = complexities[i];
        const reviewTime = reviewTimes[i];
        if (complexity.estimated !== undefined) {
            pairs.push({
                complexity: complexity.estimated,
                reviewTime: reviewTime.duration,
            });
        }
    }
    if (pairs.length < 2) {
        return undefined;
    }
    const complexityValues = pairs.map((p) => p.complexity);
    const reviewTimeValues = pairs.map((p) => p.reviewTime);
    try {
        return correlationSpearman(complexityValues, reviewTimeValues);
    }
    catch {
        return undefined;
    }
}
//# sourceMappingURL=index.js.map