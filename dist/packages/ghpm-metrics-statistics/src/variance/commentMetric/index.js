import { variance } from "@github-project-metrics/ghpm-statistics";
/**
 * CommentCountMetric の各フィールドの分散を計算します。
 *
 * @param metrics - 分散を計算する CommentCountMetric 配列
 * @returns 各フィールドの分散。配列が空、または要素数が不足している場合は undefined を返します。
 */
export function calculateCommentCountVariance(metrics) {
    if (metrics.length < 2) {
        return undefined;
    }
    const totals = metrics.map((m) => m.total);
    const participantCounts = metrics.map((m) => m.participantCount);
    try {
        return {
            total: variance(totals),
            participantCount: variance(participantCounts),
        };
    }
    catch {
        return undefined;
    }
}
//# sourceMappingURL=index.js.map