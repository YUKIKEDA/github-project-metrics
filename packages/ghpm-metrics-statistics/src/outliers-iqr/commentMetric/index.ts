import type { CommentCountMetric } from "@github-project-metrics/ghpm-metrics";
import { outliersIQR } from "@github-project-metrics/ghpm-statistics";
import type { IQROutlier, OutliersIQROptions } from "@github-project-metrics/ghpm-statistics";

/**
 * CommentCountMetric の各フィールドの外れ値を検出します（IQR法）。
 *
 * @param metrics - 外れ値を検出する CommentCountMetric 配列
 * @param options - 外れ値検出オプション
 * @returns 各フィールドの外れ値。配列が空の場合は undefined を返します。
 */
export function calculateCommentCountOutliersIQR(
  metrics: ReadonlyArray<CommentCountMetric>,
  options?: OutliersIQROptions,
): { total: IQROutlier[]; participantCount: IQROutlier[] } | undefined {
  if (metrics.length === 0) {
    return undefined;
  }

  const totals = metrics.map((m) => m.total);
  const participantCounts = metrics.map((m) => m.participantCount);

  try {
    return {
      total: outliersIQR(totals, options),
      participantCount: outliersIQR(participantCounts, options),
    };
  } catch {
    return undefined;
  }
}

