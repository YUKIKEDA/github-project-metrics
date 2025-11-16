import { skewness } from "@github-project-metrics/ghpm-statistics";
/**
 * CommentCountMetric の各フィールドの歪度を計算します。
 *
 * @param metrics - 歪度を計算する CommentCountMetric 配列
 * @returns 各フィールドの歪度。配列が空、または要素数が不足している場合は undefined を返します。
 */
export function calculateCommentCountSkewness(metrics) {
    if (metrics.length < 3) {
        return undefined;
    }
    const totals = metrics.map((m) => m.total);
    const participantCounts = metrics.map((m) => m.participantCount);
    try {
        return {
            total: skewness(totals),
            participantCount: skewness(participantCounts),
        };
    }
    catch {
        return undefined;
    }
}
//# sourceMappingURL=index.js.map