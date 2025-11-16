import { standardDeviation } from "@github-project-metrics/ghpm-statistics";
/**
 * CommentCountMetric の各フィールドの標準偏差を計算します。
 *
 * @param metrics - 標準偏差を計算する CommentCountMetric 配列
 * @returns 各フィールドの標準偏差。配列が空、または要素数が不足している場合は undefined を返します。
 */
export function calculateCommentCountStandardDeviation(metrics) {
    if (metrics.length < 2) {
        return undefined;
    }
    const totals = metrics.map((m) => m.total);
    const participantCounts = metrics.map((m) => m.participantCount);
    try {
        return {
            total: standardDeviation(totals),
            participantCount: standardDeviation(participantCounts),
        };
    }
    catch {
        return undefined;
    }
}
//# sourceMappingURL=index.js.map