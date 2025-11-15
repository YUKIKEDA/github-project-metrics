import type { CommentCountMetric } from "@github-project-metrics/ghpm-metrics";
import { interquartileRange } from "@github-project-metrics/ghpm-statistics";
import type { InterquartileRangeOptions } from "@github-project-metrics/ghpm-statistics";

/**
 * CommentCountMetric の各フィールドの四分位範囲を計算します。
 *
 * @param metrics - 四分位範囲を計算する CommentCountMetric 配列
 * @param options - 四分位範囲計算オプション
 * @returns 各フィールドの四分位範囲。配列が空の場合は undefined を返します。
 */
export function calculateCommentCountInterquartileRange(
  metrics: ReadonlyArray<CommentCountMetric>,
  options?: InterquartileRangeOptions,
): { total: number; participantCount: number } | undefined {
  if (metrics.length === 0) {
    return undefined;
  }

  const totals = metrics.map((m) => m.total);
  const participantCounts = metrics.map((m) => m.participantCount);

  try {
    return {
      total: interquartileRange(totals, options),
      participantCount: interquartileRange(participantCounts, options),
    };
  } catch {
    return undefined;
  }
}

