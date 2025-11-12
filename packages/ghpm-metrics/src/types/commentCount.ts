/**
 * コメントに関する集計情報。
 * Issue や Pull Request のフィードバック量を把握するために使用する。
 */
export interface CommentCountMetric {
  /** すべてのコメント数。 */
  total: number;
  /** コメントを残したユニークユーザー数。 */
  participantCount: number;
}

