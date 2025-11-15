import type { ComplexityMetric, ReviewTimeMetric } from "@github-project-metrics/ghpm-metrics";
import { correlationPearson } from "@github-project-metrics/ghpm-statistics";

/**
 * ComplexityMetric と ReviewTimeMetric のピアソン相関係数を計算します。
 *
 * @param complexities - ComplexityMetric 配列
 * @param reviewTimes - ReviewTimeMetric 配列
 * @returns 相関係数（-1 から 1 の範囲）。計算できない場合は undefined を返します。
 */
export function calculateComplexityVsReviewTimeCorrelationPearson(
  complexities: ReadonlyArray<ComplexityMetric>,
  reviewTimes: ReadonlyArray<ReviewTimeMetric>,
): number | undefined {
  if (complexities.length === 0 || reviewTimes.length === 0) {
    return undefined;
  }

  const pairs: Array<{ complexity: number; reviewTime: number }> = [];
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
    return correlationPearson(complexityValues, reviewTimeValues);
  } catch {
    return undefined;
  }
}

