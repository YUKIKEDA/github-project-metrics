import { kurtosis } from "@github-project-metrics/ghpm-statistics";
/**
 * CommentCountMetric の各フィールドの尖度を計算します。
 *
 * @param metrics - 尖度を計算する CommentCountMetric 配列
 * @returns 各フィールドの尖度。配列が空、または要素数が不足している場合は undefined を返します。
 */
export function calculateCommentCountKurtosis(metrics) {
    if (metrics.length < 4) {
        return undefined;
    }
    const totals = metrics.map((m) => m.total);
    const participantCounts = metrics.map((m) => m.participantCount);
    try {
        return {
            total: kurtosis(totals),
            participantCount: kurtosis(participantCounts),
        };
    }
    catch {
        return undefined;
    }
}
//# sourceMappingURL=index.js.map