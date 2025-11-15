import type { CommentCountMetric } from "@github-project-metrics/ghpm-metrics";
import { mean } from "@github-project-metrics/ghpm-statistics";

/**
 * CommentCountMetric の各フィールドの平均値を計算します。
 *
 * @param metrics - 平均値を計算する CommentCountMetric 配列
 * @returns 各フィールドの平均値。配列が空の場合は undefined を返します。
 */
export function calculateCommentCountMean(
  metrics: ReadonlyArray<CommentCountMetric>,
): { total: number; participantCount: number } | undefined {
  if (metrics.length === 0) {
    return undefined;
  }

  const totals = metrics.map((m) => m.total);
  const participantCounts = metrics.map((m) => m.participantCount);

  return {
    total: mean(totals),
    participantCount: mean(participantCounts),
  };
}

