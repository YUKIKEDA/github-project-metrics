import type { CommentCountMetric, CycleTimeMetric } from "@github-project-metrics/ghpm-metrics";
import { correlationSpearman } from "@github-project-metrics/ghpm-statistics";

/**
 * CommentCountMetric と CycleTimeMetric のスピアマン相関係数を計算します。
 *
 * @param comments - CommentCountMetric 配列
 * @param cycleTimes - CycleTimeMetric 配列
 * @returns 相関係数（-1 から 1 の範囲）。計算できない場合は undefined を返します。
 */
export function calculateCommentVsCycleTimeCorrelationSpearman(
  comments: ReadonlyArray<CommentCountMetric>,
  cycleTimes: ReadonlyArray<CycleTimeMetric>,
): number | undefined {
  if (comments.length === 0 || cycleTimes.length === 0) {
    return undefined;
  }

  const minLength = Math.min(comments.length, cycleTimes.length);
  if (minLength < 2) {
    return undefined;
  }

  const commentValues = comments.slice(0, minLength).map((c) => c.total);
  const cycleTimeValues = cycleTimes.slice(0, minLength).map((c) => c.durationMs);

  try {
    return correlationSpearman(commentValues, cycleTimeValues);
  } catch {
    return undefined;
  }
}

