import { correlationPearson } from "@github-project-metrics/ghpm-statistics";
/**
 * LeadTimeMetric と PlanVsActualMetric のピアソン相関係数を計算します。
 * planned フィールドを使用します。
 *
 * @param leadTimes - LeadTimeMetric 配列
 * @param planVsActuals - PlanVsActualMetric 配列
 * @returns 相関係数（-1 から 1 の範囲）。計算できない場合は undefined を返します。
 */
export function calculateLeadTimeVsPlanVsActualCorrelationPearson(leadTimes, planVsActuals) {
    if (leadTimes.length === 0 || planVsActuals.length === 0) {
        return undefined;
    }
    const minLength = Math.min(leadTimes.length, planVsActuals.length);
    if (minLength < 2) {
        return undefined;
    }
    const leadTimeValues = leadTimes.slice(0, minLength).map((l) => l.durationMs);
    const plannedValues = planVsActuals.slice(0, minLength).map((p) => p.planned);
    try {
        return correlationPearson(leadTimeValues, plannedValues);
    }
    catch {
        return undefined;
    }
}
//# sourceMappingURL=index.js.map