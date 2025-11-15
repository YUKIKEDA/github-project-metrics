import type { ComplexityMetric } from "@github-project-metrics/ghpm-metrics";
import { median } from "@github-project-metrics/ghpm-statistics";

/**
 * ComplexityMetric の各フィールドの中央値を計算します。
 *
 * @param metrics - 中央値を計算する ComplexityMetric 配列
 * @returns 各フィールドの中央値。配列が空、または estimated が存在しない場合は undefined を返します。
 */
export function calculateComplexityMedian(
  metrics: ReadonlyArray<ComplexityMetric>,
): { estimated: number } | undefined {
  const estimatedValues = metrics
    .map((m) => m.estimated)
    .filter((v): v is number => v !== undefined);

  if (estimatedValues.length === 0) {
    return undefined;
  }

  return {
    estimated: median(estimatedValues),
  };
}

