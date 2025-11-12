import type { CombinedIssue } from "@github-project-metrics/ghpm-issues";
import type { LeadTimeMetric } from "../types/leadTime";

/**
 * Issue の作成〜クローズ日時からリードタイムを算出する。
 */
export function createLeadTimeMetric(issue: CombinedIssue): LeadTimeMetric | undefined {
  const createdAt = issue.issue.created_at;
  const closedAt = issue.issue.closed_at;

  if (!createdAt || !closedAt) {
    return undefined;
  }

  const start = Date.parse(createdAt);
  const end = Date.parse(closedAt);

  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    return undefined;
  }

  return {
    durationMs: end - start,
    startedAt: new Date(start).toISOString(),
    completedAt: new Date(end).toISOString(),
    startedEvent: "issue_opened",
    endedEvent: "issue_closed",
  };
}

