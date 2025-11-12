import { describe, expect, it } from "vitest";
import type { CombinedIssue } from "@github-project-metrics/ghpm-issues";
import { createCommentCountMetric } from "./index";

function buildCombinedIssue(events: CombinedIssue["events"], comments = 0): CombinedIssue {
  return {
    issue: {
      comments,
    } as CombinedIssue["issue"],
    events,
    projects: null,
  } as CombinedIssue;
}

describe("createCommentCountMetric", () => {
  it("イベントと issue.comments の大きい方を total として扱う", () => {
    const events = [
      {
        event: "commented",
        actor: { login: "alice" },
      },
      {
        event: "commented",
        actor: { login: "bob" },
      },
    ] as CombinedIssue["events"];

    const metric = createCommentCountMetric(buildCombinedIssue(events, 1));

    expect(metric).toEqual({
      total: 2,
      participantCount: 2,
    });
  });

  it("コメントが存在しない場合は undefined を返す", () => {
    const metric = createCommentCountMetric(buildCombinedIssue([], 0));

    expect(metric).toBeUndefined();
  });
});

