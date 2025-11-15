import type { ComplexityMetric, CycleTimeMetric } from "@github-project-metrics/ghpm-metrics";
import { correlationPearson } from "@github-project-metrics/ghpm-statistics";

/**
 * ComplexityMetric と CycleTimeMetric のピアソン相関係数を計算します。
 *
 * @param complexities - ComplexityMetric 配列
 * @param cycleTimes - CycleTimeMetric 配列
 * @returns 相関係数（-1 から 1 の範囲）。計算できない場合は undefined を返します。
 */
export function calculateComplexityVsCycleTimeCorrelationPearson(
  complexities: ReadonlyArray<ComplexityMetric>,
  cycleTimes: ReadonlyArray<CycleTimeMetric>,
): number | undefined {
  if (complexities.length === 0 || cycleTimes.length === 0) {
    return undefined;
  }

  const pairs: Array<{ complexity: number; cycleTime: number }> = [];
  const minLength = Math.min(complexities.length, cycleTimes.length);

  for (let i = 0; i < minLength; i += 1) {
    const complexity = complexities[i];
    const cycleTime = cycleTimes[i];
    if (complexity.estimated !== undefined) {
      pairs.push({
        complexity: complexity.estimated,
        cycleTime: cycleTime.durationMs,
      });
    }
  }

  if (pairs.length < 2) {
    return undefined;
  }

  const complexityValues = pairs.map((p) => p.complexity);
  const cycleTimeValues = pairs.map((p) => p.cycleTime);

  try {
    return correlationPearson(complexityValues, cycleTimeValues);
  } catch {
    return undefined;
  }
}

