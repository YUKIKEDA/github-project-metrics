import { CommentCountMetric } from "./commentCount";
import { ComplexityMetric } from "./complexity";
import { CycleTimeMetric } from "./cycleTime";
import { LeadTimeMetric } from "./leadTime";
import { PlanVsActualMetric } from "./planVsActual";
import { ReviewTimeMetric } from "./reviewTime";

/**
 * 単一の Issue／Pull Request に紐づくメトリクスのセット。
 * 各メトリクスは算出できたもののみが設定される。
 */
export interface MetricData {
  /** コメント数に関するメトリクス。 */
  commentCount?: CommentCountMetric;
  /** 複雑さに関するメトリクス。 */
  complexity?: ComplexityMetric;
  /** 作業サイクルタイムに関するメトリクス。 */
  cycleTime?: CycleTimeMetric;
  /** リードタイムに関するメトリクス。 */
  leadTime?: LeadTimeMetric;
  /** 計画と実績の差異に関するメトリクス。 */
  planVsActual?: PlanVsActualMetric;
  /** レビュー時間に関するメトリクス。 */
  reviewTime?: ReviewTimeMetric;
}