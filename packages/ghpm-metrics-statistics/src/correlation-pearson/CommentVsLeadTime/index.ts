import type { CommentCountMetric, LeadTimeMetric } from "@github-project-metrics/ghpm-metrics";
import { correlationPearson } from "@github-project-metrics/ghpm-statistics";

/**
 * CommentCountMetric と LeadTimeMetric のピアソン相関係数を計算します。
 *
 * @param comments - CommentCountMetric 配列
 * @param leadTimes - LeadTimeMetric 配列
 * @returns 相関係数（-1 から 1 の範囲）。計算できない場合は undefined を返します。
 */
export function calculateCommentVsLeadTimeCorrelationPearson(
  comments: ReadonlyArray<CommentCountMetric>,
  leadTimes: ReadonlyArray<LeadTimeMetric>,
): number | undefined {
  if (comments.length === 0 || leadTimes.length === 0) {
    return undefined;
  }

  const minLength = Math.min(comments.length, leadTimes.length);
  if (minLength < 2) {
    return undefined;
  }

  const commentValues = comments.slice(0, minLength).map((c) => c.total);
  const leadTimeValues = leadTimes.slice(0, minLength).map((l) => l.durationMs);

  try {
    return correlationPearson(commentValues, leadTimeValues);
  } catch {
    return undefined;
  }
}

