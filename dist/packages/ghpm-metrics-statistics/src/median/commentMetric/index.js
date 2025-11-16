import { median } from "@github-project-metrics/ghpm-statistics";
/**
 * CommentCountMetric の各フィールドの中央値を計算します。
 *
 * @param metrics - 中央値を計算する CommentCountMetric 配列
 * @returns 各フィールドの中央値。配列が空の場合は undefined を返します。
 */
export function calculateCommentCountMedian(metrics) {
    if (metrics.length === 0) {
        return undefined;
    }
    const totals = metrics.map((m) => m.total);
    const participantCounts = metrics.map((m) => m.participantCount);
    return {
        total: median(totals),
        participantCount: median(participantCounts),
    };
}
//# sourceMappingURL=index.js.map