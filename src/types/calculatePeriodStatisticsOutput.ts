import type { IssueMetrics } from "@github-project-metrics/ghpm-metrics";
import type { PeriodStatistics } from "./periodStatistics.js";

/**
 * 期間ごとの統計計算の結果。
 */
export interface CalculatePeriodStatisticsOutput {
  /** 期間ごとの統計データの配列。 */
  periodStatistics: PeriodStatistics[];
  /** 計算に使用したIssueMetricsの配列。 */
  issueMetrics: IssueMetrics[];
}

