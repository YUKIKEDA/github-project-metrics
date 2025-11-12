/**
 * レビュー開始から承認・マージされるまでの期間。
 * レビューの滞留やボトルネックを特定するために使用する。
 */
export interface ReviewTimeMetric {
  /** レビューに費やした合計時間 (ミリ秒など任意の単位)。 */
  duration: number;
  /** レビューがリクエストされた日時 (ISO 8601 形式推奨)。 */
  reviewRequestedAt: string;
  /** 最終的にマージされた日時 (ISO 8601 形式推奨)。 */
  reviewMergedAt: string;
}

