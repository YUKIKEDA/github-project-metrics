/**
 * Issue メタ情報と算出済みメトリクスの集合。
 */
export interface IssueMetricsRecord {
  issueNumber: number;
  title: string;
  metrics: IssueMetrics;
}

/**
 * Issue 毎に保持する指標値の集合。
 */
export interface IssueMetrics {
  leadTime: MetricResult<number, LeadTimeDetails>;
  cycleTime: MetricResult<number, CycleTimeDetails>;
  reviewTime: MetricResult<number, ReviewTimeDetails>;
  commentCount: MetricResult<number, CommentCountDetails>;
  complexity: MetricResult<number, ComplexityDetails>;
  planVsActual: MetricResult<number, PlanVsActualDetails>;
}

/**
 * 単一指標の算出結果。成功・失敗と補足情報を表現する。
 */
export type MetricResult<TValue, TDetails = undefined> =
  | {
      status: 'success';
      value: TValue;
      details?: TDetails;
    }
  | {
      status: 'failure';
      reason: string;
      details?: TDetails;
    };

/**
 * リードタイム算出に使用した詳細情報。
 * Issue が作成されてからクローズされるまでの期間を表す。
 */
export interface LeadTimeDetails {
  startedAt: string;
  completedAt: string;
  startEvent?: string;
  endEvent?: string;
}

/**
 * サイクルタイム算出に使用した詳細情報。
 * 「作業開始イベント」（例: In Progress 遷移）からクローズまでの期間を表す。
 */
export interface CycleTimeDetails {
  startedAt: string;
  completedAt: string;
  startEvent?: string;
  endEvent?: string;
}

/**
 * レビュー時間算出に使用した詳細情報。
 * PR のレビュー依頼からレビュー完了までの期間を表す。
 */
export interface ReviewTimeDetails {
  reviewRequestedAt?: string;
  reviewCompletedAt?: string;
  pullRequestNumber?: number;
}

/**
 * コメント数算出に使用した詳細情報。
 */
export interface CommentCountDetails {
  commentIds?: number[];
  includedEvents?: string[];
}

/**
 * 複雑度指標の評価根拠。
 * ラベル、見積値、または独自基準など、複雑度を算出する際の元データを示す。
 */
export interface ComplexityDetails {
  basis: 'label' | 'estimate' | 'custom';
  source?: string;
}

/**
 * 予実差（見積 vs 実績）の詳細情報。
 * 見積値と実績値、および比較に利用した単位を保持する。
 */
export interface PlanVsActualDetails {
  estimated?: number;
  actual?: number;
  unit?: 'minutes' | 'hours' | 'days';
}
