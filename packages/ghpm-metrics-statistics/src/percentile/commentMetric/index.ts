import type { CommentCountMetric } from "@github-project-metrics/ghpm-metrics";
import { percentile } from "@github-project-metrics/ghpm-statistics";
import type { PercentileOptions } from "@github-project-metrics/ghpm-statistics";

/**
 * CommentCountMetric の各フィールドのパーセンタイルを計算します。
 *
 * @param metrics - パーセンタイルを計算する CommentCountMetric 配列
 * @param percentileValue - 計算するパーセンタイル値 (0-100)
 * @param options - パーセンタイル計算オプション
 * @returns 各フィールドのパーセンタイル。配列が空の場合は undefined を返します。
 */
export function calculateCommentCountPercentile(
  metrics: ReadonlyArray<CommentCountMetric>,
  percentileValue: number,
  options?: PercentileOptions,
): { total: number; participantCount: number } | undefined {
  if (metrics.length === 0) {
    return undefined;
  }

  const totals = metrics.map((m) => m.total);
  const participantCounts = metrics.map((m) => m.participantCount);

  try {
    return {
      total: percentile(totals, percentileValue, options),
      participantCount: percentile(participantCounts, percentileValue, options),
    };
  } catch {
    return undefined;
  }
}

