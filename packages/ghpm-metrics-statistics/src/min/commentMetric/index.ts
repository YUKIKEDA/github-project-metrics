import type { CommentCountMetric } from "@github-project-metrics/ghpm-metrics";
import { min } from "@github-project-metrics/ghpm-statistics";

/**
 * CommentCountMetric の各フィールドの最小値を計算します。
 *
 * @param metrics - 最小値を計算する CommentCountMetric 配列
 * @returns 各フィールドの最小値。配列が空の場合は undefined を返します。
 */
export function calculateCommentCountMin(
  metrics: ReadonlyArray<CommentCountMetric>,
): { total: number; participantCount: number } | undefined {
  if (metrics.length === 0) {
    return undefined;
  }

  const totals = metrics.map((m) => m.total);
  const participantCounts = metrics.map((m) => m.participantCount);

  return {
    total: min(totals),
    participantCount: min(participantCounts),
  };
}

