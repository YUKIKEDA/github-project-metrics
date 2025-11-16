import { correlationPearson } from "@github-project-metrics/ghpm-statistics";
/**
 * CycleTimeMetric と PlanVsActualMetric のピアソン相関係数を計算します。
 * planned フィールドを使用します。
 *
 * @param cycleTimes - CycleTimeMetric 配列
 * @param planVsActuals - PlanVsActualMetric 配列
 * @returns 相関係数（-1 から 1 の範囲）。計算できない場合は undefined を返します。
 */
export function calculateCycleTimeVsPlanVsActualCorrelationPearson(cycleTimes, planVsActuals) {
    if (cycleTimes.length === 0 || planVsActuals.length === 0) {
        return undefined;
    }
    const minLength = Math.min(cycleTimes.length, planVsActuals.length);
    if (minLength < 2) {
        return undefined;
    }
    const cycleTimeValues = cycleTimes.slice(0, minLength).map((c) => c.durationMs);
    const plannedValues = planVsActuals.slice(0, minLength).map((p) => p.planned);
    try {
        return correlationPearson(cycleTimeValues, plannedValues);
    }
    catch {
        return undefined;
    }
}
//# sourceMappingURL=index.js.map