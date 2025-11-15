import type { ComplexityMetric } from "@github-project-metrics/ghpm-metrics";
import { standardDeviation } from "@github-project-metrics/ghpm-statistics";

/**
 * ComplexityMetric の各フィールドの標準偏差を計算します。
 *
 * @param metrics - 標準偏差を計算する ComplexityMetric 配列
 * @returns 各フィールドの標準偏差。配列が空、または estimated が存在しない、または要素数が不足している場合は undefined を返します。
 */
export function calculateComplexityStandardDeviation(
  metrics: ReadonlyArray<ComplexityMetric>,
): { estimated: number } | undefined {
  const estimatedValues = metrics
    .map((m) => m.estimated)
    .filter((v): v is number => v !== undefined);

  if (estimatedValues.length < 2) {
    return undefined;
  }

  try {
    return {
      estimated: standardDeviation(estimatedValues),
    };
  } catch {
    return undefined;
  }
}

