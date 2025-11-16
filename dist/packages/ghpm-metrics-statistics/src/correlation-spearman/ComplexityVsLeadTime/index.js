import { correlationSpearman } from "@github-project-metrics/ghpm-statistics";
/**
 * ComplexityMetric と LeadTimeMetric のスピアマン相関係数を計算します。
 *
 * @param complexities - ComplexityMetric 配列
 * @param leadTimes - LeadTimeMetric 配列
 * @returns 相関係数（-1 から 1 の範囲）。計算できない場合は undefined を返します。
 */
export function calculateComplexityVsLeadTimeCorrelationSpearman(complexities, leadTimes) {
    if (complexities.length === 0 || leadTimes.length === 0) {
        return undefined;
    }
    const pairs = [];
    const minLength = Math.min(complexities.length, leadTimes.length);
    for (let i = 0; i < minLength; i += 1) {
        const complexity = complexities[i];
        const leadTime = leadTimes[i];
        if (complexity.estimated !== undefined) {
            pairs.push({
                complexity: complexity.estimated,
                leadTime: leadTime.durationMs,
            });
        }
    }
    if (pairs.length < 2) {
        return undefined;
    }
    const complexityValues = pairs.map((p) => p.complexity);
    const leadTimeValues = pairs.map((p) => p.leadTime);
    try {
        return correlationSpearman(complexityValues, leadTimeValues);
    }
    catch {
        return undefined;
    }
}
//# sourceMappingURL=index.js.map