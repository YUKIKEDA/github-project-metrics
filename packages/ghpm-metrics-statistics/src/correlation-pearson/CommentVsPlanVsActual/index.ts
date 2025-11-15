import type { CommentCountMetric, PlanVsActualMetric } from "@github-project-metrics/ghpm-metrics";
import { correlationPearson } from "@github-project-metrics/ghpm-statistics";

/**
 * CommentCountMetric と PlanVsActualMetric のピアソン相関係数を計算します。
 * planned フィールドを使用します。
 *
 * @param comments - CommentCountMetric 配列
 * @param planVsActuals - PlanVsActualMetric 配列
 * @returns 相関係数（-1 から 1 の範囲）。計算できない場合は undefined を返します。
 */
export function calculateCommentVsPlanVsActualCorrelationPearson(
  comments: ReadonlyArray<CommentCountMetric>,
  planVsActuals: ReadonlyArray<PlanVsActualMetric>,
): number | undefined {
  if (comments.length === 0 || planVsActuals.length === 0) {
    return undefined;
  }

  const minLength = Math.min(comments.length, planVsActuals.length);
  if (minLength < 2) {
    return undefined;
  }

  const commentValues = comments.slice(0, minLength).map((c) => c.total);
  const plannedValues = planVsActuals.slice(0, minLength).map((p) => p.planned);

  try {
    return correlationPearson(commentValues, plannedValues);
  } catch {
    return undefined;
  }
}

