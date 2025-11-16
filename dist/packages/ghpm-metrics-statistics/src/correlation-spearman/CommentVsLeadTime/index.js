import { correlationSpearman } from "@github-project-metrics/ghpm-statistics";
/**
 * CommentCountMetric と LeadTimeMetric のスピアマン相関係数を計算します。
 *
 * @param comments - CommentCountMetric 配列
 * @param leadTimes - LeadTimeMetric 配列
 * @returns 相関係数（-1 から 1 の範囲）。計算できない場合は undefined を返します。
 */
export function calculateCommentVsLeadTimeCorrelationSpearman(comments, leadTimes) {
    if (comments.length === 0 || leadTimes.length === 0) {
        return undefined;
    }
    const minLength = Math.min(comments.length, leadTimes.length);
    if (minLength < 2) {
        return undefined;
    }
    const commentValues = comments.slice(0, minLength).map((c) => c.total);
    const leadTimeValues = leadTimes.slice(0, minLength).map((l) => l.durationMs);
    try {
        return correlationSpearman(commentValues, leadTimeValues);
    }
    catch {
        return undefined;
    }
}
//# sourceMappingURL=index.js.map