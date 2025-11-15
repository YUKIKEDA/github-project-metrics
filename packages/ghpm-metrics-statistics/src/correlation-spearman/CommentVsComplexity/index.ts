import type { CommentCountMetric, ComplexityMetric } from "@github-project-metrics/ghpm-metrics";
import { correlationSpearman } from "@github-project-metrics/ghpm-statistics";

/**
 * CommentCountMetric と ComplexityMetric のスピアマン相関係数を計算します。
 *
 * @param comments - CommentCountMetric 配列
 * @param complexities - ComplexityMetric 配列
 * @returns 相関係数（-1 から 1 の範囲）。計算できない場合は undefined を返します。
 */
export function calculateCommentVsComplexityCorrelationSpearman(
  comments: ReadonlyArray<CommentCountMetric>,
  complexities: ReadonlyArray<ComplexityMetric>,
): number | undefined {
  if (comments.length === 0 || complexities.length === 0) {
    return undefined;
  }

  const pairs: Array<{ comment: number; complexity: number }> = [];
  const minLength = Math.min(comments.length, complexities.length);

  for (let i = 0; i < minLength; i += 1) {
    const comment = comments[i];
    const complexity = complexities[i];
    if (complexity.estimated !== undefined) {
      pairs.push({
        comment: comment.total,
        complexity: complexity.estimated,
      });
    }
  }

  if (pairs.length < 2) {
    return undefined;
  }

  const commentValues = pairs.map((p) => p.comment);
  const complexityValues = pairs.map((p) => p.complexity);

  try {
    return correlationSpearman(commentValues, complexityValues);
  } catch {
    return undefined;
  }
}

