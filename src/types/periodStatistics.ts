import type { MetricsStatistics } from "./metricsStatistics.js";

/**
 * 期間ごとの統計データ。
 */
export interface PeriodStatistics {
  /** 期間の開始日時（ISO 8601形式）。 */
  periodStart: string;
  /** 期間の終了日時（ISO 8601形式）。 */
  periodEnd: string;
  /** 該当期間内のIssue数。 */
  issueCount: number;
  /** 各メトリクスの統計値。 */
  metrics: MetricsStatistics;
}

