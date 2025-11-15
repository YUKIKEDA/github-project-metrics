import type { CommentCountMetric, ReviewTimeMetric } from "@github-project-metrics/ghpm-metrics";
import { correlationPearson } from "@github-project-metrics/ghpm-statistics";

/**
 * CommentCountMetric と ReviewTimeMetric のピアソン相関係数を計算します。
 *
 * @param comments - CommentCountMetric 配列
 * @param reviewTimes - ReviewTimeMetric 配列
 * @returns 相関係数（-1 から 1 の範囲）。計算できない場合は undefined を返します。
 */
export function calculateCommentVsReviewTimeCorrelationPearson(
  comments: ReadonlyArray<CommentCountMetric>,
  reviewTimes: ReadonlyArray<ReviewTimeMetric>,
): number | undefined {
  if (comments.length === 0 || reviewTimes.length === 0) {
    return undefined;
  }

  const minLength = Math.min(comments.length, reviewTimes.length);
  if (minLength < 2) {
    return undefined;
  }

  const commentValues = comments.slice(0, minLength).map((c) => c.total);
  const reviewTimeValues = reviewTimes.slice(0, minLength).map((r) => r.duration);

  try {
    return correlationPearson(commentValues, reviewTimeValues);
  } catch {
    return undefined;
  }
}

