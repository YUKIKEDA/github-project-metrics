import type { CommentCountStatistics } from "./commentCountStatistics.js";
import type { ComplexityStatistics } from "./complexityStatistics.js";
import type { CorrelationStatistics } from "./correlationStatistics.js";
import type { CycleTimeStatistics } from "./cycleTimeStatistics.js";
import type { LeadTimeStatistics } from "./leadTimeStatistics.js";
import type { PlanVsActualStatistics } from "./planVsActualStatistics.js";
import type { ReviewTimeStatistics } from "./reviewTimeStatistics.js";

/**
 * 各メトリクスの統計値を表す型。
 */
export interface MetricsStatistics {
  /** コメント数の統計値。 */
  commentCount?: CommentCountStatistics;
  /** 複雑さの統計値。 */
  complexity?: ComplexityStatistics;
  /** サイクルタイムの統計値。 */
  cycleTime?: CycleTimeStatistics;
  /** リードタイムの統計値。 */
  leadTime?: LeadTimeStatistics;
  /** 計画と実績の差異の統計値。 */
  planVsActual?: PlanVsActualStatistics;
  /** レビュー時間の統計値。 */
  reviewTime?: ReviewTimeStatistics;
  /** メトリクス間の相関係数。 */
  correlation?: CorrelationStatistics;
}

