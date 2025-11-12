import { describe, expect, it } from "vitest";
import type { CombinedIssue } from "@github-project-metrics/ghpm-issues";
import { createCycleTimeMetric } from "./index";

function buildCombinedIssue(overrides: Partial<CombinedIssue> = {}): CombinedIssue {
  const { issue: issueOverride, events = [], ...rest } = overrides;

  return {
    issue: {
      created_at: "2024-01-01T00:00:00Z",
      closed_at: null,
      ...(issueOverride ?? {}),
    } as CombinedIssue["issue"],
    events,
    projects: null,
    ...rest,
  } as CombinedIssue;
}

describe("createCycleTimeMetric", () => {
  it("in_progress イベントを開始時刻として採用する", () => {
    const events = [
      {
        event: "assigned",
        created_at: "2024-01-02T00:00:00Z",
      },
      {
        event: "in_progress",
        created_at: "2024-01-02T09:00:00Z",
      },
    ] as CombinedIssue["events"];

    const issue = buildCombinedIssue({
      events,
      issue: {
        closed_at: "2024-01-03T12:00:00Z",
      } as CombinedIssue["issue"],
    });
    const metric = createCycleTimeMetric(issue);

    expect(metric).toEqual({
      durationMs: 97_200_000,
      startedAt: "2024-01-02T09:00:00.000Z",
      completedAt: "2024-01-03T12:00:00.000Z",
      startedEvent: "in_progress",
      completedEvent: "issue_closed",
    });
  });

  it("in_progress が無い場合は assigned を開始時刻にする", () => {
    const events = [
      {
        event: "assigned",
        created_at: "2024-01-02T00:00:00Z",
      },
    ] as CombinedIssue["events"];

    const issue = buildCombinedIssue({
      events,
      issue: {
        closed_at: "2024-01-03T00:00:00Z",
      } as CombinedIssue["issue"],
    });
    const metric = createCycleTimeMetric(issue);

    expect(metric).toEqual({
      durationMs: 86_400_000,
      startedAt: "2024-01-02T00:00:00.000Z",
      completedAt: "2024-01-03T00:00:00.000Z",
      startedEvent: "assigned",
      completedEvent: "issue_closed",
    });
  });

  it("開始イベントが無い場合は issue 作成日時を開始時刻にする", () => {
    const issue = buildCombinedIssue({
      issue: {
        closed_at: "2024-01-04T00:00:00Z",
      } as CombinedIssue["issue"],
    });
    const metric = createCycleTimeMetric(issue);

    expect(metric).toEqual({
      durationMs: 259_200_000,
      startedAt: "2024-01-01T00:00:00.000Z",
      completedAt: "2024-01-04T00:00:00.000Z",
      startedEvent: "issue_opened",
      completedEvent: "issue_closed",
    });
  });

  it("closed_at が無い場合は undefined を返す", () => {
    const events = [
      {
        event: "assigned",
        created_at: "2024-01-02T00:00:00Z",
      },
    ] as CombinedIssue["events"];

    const issue = buildCombinedIssue({ events });

    expect(createCycleTimeMetric(issue)).toBeUndefined();
  });
});
