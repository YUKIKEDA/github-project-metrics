import { describe, expect, it } from "vitest";
import type { CombinedIssue } from "@github-project-metrics/ghpm-issues";
import { createLeadTimeMetric } from "./index";

function buildCombinedIssue(createdAt?: string, closedAt?: string): CombinedIssue {
  return {
    issue: {
      created_at: createdAt,
      closed_at: closedAt,
    } as CombinedIssue["issue"],
    events: [],
    projects: null,
  } as CombinedIssue;
}

describe("createLeadTimeMetric", () => {
  it("作成日時とクローズ日時を元にリードタイムを算出する", () => {
    const metric = createLeadTimeMetric(
      buildCombinedIssue("2024-01-01T00:00:00Z", "2024-01-02T12:00:00Z"),
    );

    expect(metric).toEqual({
      durationMs: 129_600_000,
      startedAt: "2024-01-01T00:00:00.000Z",
      completedAt: "2024-01-02T12:00:00.000Z",
      startedEvent: "issue_opened",
      endedEvent: "issue_closed",
    });
  });

  it("クローズ日時が無い場合は undefined を返す", () => {
    expect(createLeadTimeMetric(buildCombinedIssue("2024-01-01T00:00:00Z", undefined))).toBeUndefined();
  });
});

