/**
 * 作業開始から完了までの期間。
 * 実際の開発サイクルの効率を把握するために使用する。
 * 作業開始イベント (InProgress) から完了イベント (Done) までの時間。
 */
export interface CycleTimeMetric {
  /** 作業開始から完了までの合計時間 (ミリ秒)。 */
  durationMs: number;
  /** 作業が開始された日時 (ISO 8601 形式推奨)。 */
  startedAt: string;
  /** 作業が完了した日時 (ISO 8601 形式推奨)。 */
  completedAt: string;
  /** 作業開始イベントの種類 (例: "issue_opened")。 */
  startedEvent?: string;
  /** 作業完了イベントの種類 (例: "issue_closed")。 */
  completedEvent?: string;
}

