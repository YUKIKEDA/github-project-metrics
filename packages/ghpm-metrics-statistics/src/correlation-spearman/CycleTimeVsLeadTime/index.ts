import type { CycleTimeMetric, LeadTimeMetric } from "@github-project-metrics/ghpm-metrics";
import { correlationSpearman } from "@github-project-metrics/ghpm-statistics";

/**
 * CycleTimeMetric と LeadTimeMetric のスピアマン相関係数を計算します。
 *
 * @param cycleTimes - CycleTimeMetric 配列
 * @param leadTimes - LeadTimeMetric 配列
 * @returns 相関係数（-1 から 1 の範囲）。計算できない場合は undefined を返します。
 */
export function calculateCycleTimeVsLeadTimeCorrelationSpearman(
  cycleTimes: ReadonlyArray<CycleTimeMetric>,
  leadTimes: ReadonlyArray<LeadTimeMetric>,
): number | undefined {
  if (cycleTimes.length === 0 || leadTimes.length === 0) {
    return undefined;
  }

  const minLength = Math.min(cycleTimes.length, leadTimes.length);
  if (minLength < 2) {
    return undefined;
  }

  const cycleTimeValues = cycleTimes.slice(0, minLength).map((c) => c.durationMs);
  const leadTimeValues = leadTimes.slice(0, minLength).map((l) => l.durationMs);

  try {
    return correlationSpearman(cycleTimeValues, leadTimeValues);
  } catch {
    return undefined;
  }
}

