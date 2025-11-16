import { mode } from "@github-project-metrics/ghpm-statistics";
/**
 * CommentCountMetric の各フィールドの最頻値を計算します。
 *
 * @param metrics - 最頻値を計算する CommentCountMetric 配列
 * @returns 各フィールドの最頻値。配列が空の場合は undefined を返します。
 */
export function calculateCommentCountMode(metrics) {
    if (metrics.length === 0) {
        return undefined;
    }
    const totals = metrics.map((m) => m.total);
    const participantCounts = metrics.map((m) => m.participantCount);
    return {
        total: mode(totals),
        participantCount: mode(participantCounts),
    };
}
//# sourceMappingURL=index.js.map