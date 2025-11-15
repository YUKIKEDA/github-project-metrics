import type { ComplexityMetric, PlanVsActualMetric } from "@github-project-metrics/ghpm-metrics";
import { correlationSpearman } from "@github-project-metrics/ghpm-statistics";

/**
 * ComplexityMetric と PlanVsActualMetric のスピアマン相関係数を計算します。
 * planned フィールドを使用します。
 *
 * @param complexities - ComplexityMetric 配列
 * @param planVsActuals - PlanVsActualMetric 配列
 * @returns 相関係数（-1 から 1 の範囲）。計算できない場合は undefined を返します。
 */
export function calculateComplexityVsPlanVsActualCorrelationSpearman(
  complexities: ReadonlyArray<ComplexityMetric>,
  planVsActuals: ReadonlyArray<PlanVsActualMetric>,
): number | undefined {
  if (complexities.length === 0 || planVsActuals.length === 0) {
    return undefined;
  }

  const pairs: Array<{ complexity: number; planned: number }> = [];
  const minLength = Math.min(complexities.length, planVsActuals.length);

  for (let i = 0; i < minLength; i += 1) {
    const complexity = complexities[i];
    const planVsActual = planVsActuals[i];
    if (complexity.estimated !== undefined) {
      pairs.push({
        complexity: complexity.estimated,
        planned: planVsActual.planned,
      });
    }
  }

  if (pairs.length < 2) {
    return undefined;
  }

  const complexityValues = pairs.map((p) => p.complexity);
  const plannedValues = pairs.map((p) => p.planned);

  try {
    return correlationSpearman(complexityValues, plannedValues);
  } catch {
    return undefined;
  }
}

