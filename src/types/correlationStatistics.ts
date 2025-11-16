/**
 * メトリクス間の相関係数。
 */
export interface CorrelationStatistics {
  /** コメント数と複雑さの相関係数。 */
  commentVsComplexity?: {
    pearson?: number;
    spearman?: number;
  };
  /** コメント数とサイクルタイムの相関係数。 */
  commentVsCycleTime?: {
    pearson?: number;
    spearman?: number;
  };
  /** コメント数とリードタイムの相関係数。 */
  commentVsLeadTime?: {
    pearson?: number;
    spearman?: number;
  };
  /** コメント数と計画と実績の差異の相関係数。 */
  commentVsPlanVsActual?: {
    pearson?: number;
    spearman?: number;
  };
  /** コメント数とレビュー時間の相関係数。 */
  commentVsReviewTime?: {
    pearson?: number;
    spearman?: number;
  };
  /** 複雑さとサイクルタイムの相関係数。 */
  complexityVsCycleTime?: {
    pearson?: number;
    spearman?: number;
  };
  /** 複雑さとリードタイムの相関係数。 */
  complexityVsLeadTime?: {
    pearson?: number;
    spearman?: number;
  };
  /** 複雑さと計画と実績の差異の相関係数。 */
  complexityVsPlanVsActual?: {
    pearson?: number;
    spearman?: number;
  };
  /** 複雑さとレビュー時間の相関係数。 */
  complexityVsReviewTime?: {
    pearson?: number;
    spearman?: number;
  };
  /** サイクルタイムとリードタイムの相関係数。 */
  cycleTimeVsLeadTime?: {
    pearson?: number;
    spearman?: number;
  };
  /** サイクルタイムと計画と実績の差異の相関係数。 */
  cycleTimeVsPlanVsActual?: {
    pearson?: number;
    spearman?: number;
  };
  /** サイクルタイムとレビュー時間の相関係数。 */
  cycleTimeVsReviewTime?: {
    pearson?: number;
    spearman?: number;
  };
  /** リードタイムと計画と実績の差異の相関係数。 */
  leadTimeVsPlanVsActual?: {
    pearson?: number;
    spearman?: number;
  };
  /** リードタイムとレビュー時間の相関係数。 */
  leadTimeVsReviewTime?: {
    pearson?: number;
    spearman?: number;
  };
  /** 計画と実績の差異とレビュー時間の相関係数。 */
  planVsActualVsReviewTime?: {
    pearson?: number;
    spearman?: number;
  };
}

