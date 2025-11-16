import type { CombinedIssue } from "@github-project-metrics/ghpm-issues";
import type { PeriodType } from "./periodType.js";

/**
 * 期間ごとの統計計算の入力パラメータ。
 */
export interface CalculatePeriodStatisticsInput {
  /** CombinedIssueの配列。 */
  combinedIssues: CombinedIssue[];
  /** 期間の種類。Issueの作成日（created_at）を基準に期間を分割します。 */
  periodType: PeriodType;
}

