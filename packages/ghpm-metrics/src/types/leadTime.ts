/**
 * Issue が作成されてからクローズされるまでの時間。
 * プロダクトの価値提供までのリードタイムを把握するために使用する。
 */
export interface LeadTimeMetric {
  /** Issue 作成からクローズまでの合計時間 (ミリ秒)。 */
  durationMs: number;
  /** Issue が作成された日時 (ISO 8601 形式推奨)。 */
  startedAt: string;
  /** Issue がクローズされた日時 (ISO 8601 形式推奨)。 */
  completedAt: string;
  /** 開始イベントの種類 (例: "issue_opened")。 */
  startedEvent?: string;
  /** 終了イベントの種類 (例: "issue_closed")。 */
  endedEvent?: string;
}

