import { describe, expect, it } from "vitest";
import type { CombinedIssue } from "@github-project-metrics/ghpm-issues";
import { createReviewTimeMetric } from "./index";

function buildEvent(event: string, createdAt: string) {
  return {
    id: `${event}-${createdAt}`,
    event,
    created_at: createdAt,
  } as const;
}

function buildIssue({
  events = [],
  pullRequest = true,
  closedAt = "2024-01-03T00:00:00Z",
}: {
  events?: Array<ReturnType<typeof buildEvent>>;
  pullRequest?: boolean;
  closedAt?: string | null;
} = {}): CombinedIssue {
  const issue = {
    number: 42,
    title: "Add new feature",
    state: "closed",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-03T00:00:00Z",
    closed_at: closedAt,
    comments: 0,
    user: {
      login: "alice",
      id: 1,
    },
    pull_request: pullRequest
      ? {
          url: "https://api.github.com/repos/octocat/example/pulls/1",
          html_url: "https://github.com/octocat/example/pull/1",
          diff_url: "https://github.com/octocat/example/pull/1.diff",
          patch_url: "https://github.com/octocat/example/pull/1.patch",
        }
      : undefined,
  };

  return {
    issue: issue as unknown as CombinedIssue["issue"],
    events: events as unknown as CombinedIssue["events"],
    projects: null,
  } as CombinedIssue;
}

describe("createReviewTimeMetric", () => {
  it("Pull Request でない場合は undefined を返す", () => {
    const issue = buildIssue({ pullRequest: false });

    expect(createReviewTimeMetric(issue)).toBeUndefined();
  });

  it("レビューリクエストが無い場合は undefined を返す", () => {
    const issue = buildIssue({
      events: [buildEvent("merged", "2024-01-02T00:00:00Z")],
    });

    expect(createReviewTimeMetric(issue)).toBeUndefined();
  });

  it("レビューリクエストからマージまでの時間を算出する", () => {
    const issue = buildIssue({
      events: [
        buildEvent("review_requested", "2024-01-01T12:00:00Z"),
        buildEvent("merged", "2024-01-02T12:00:00Z"),
      ],
    });

    const metric = createReviewTimeMetric(issue);

    expect(metric).toEqual({
      duration: 86_400_000,
      reviewRequestedAt: "2024-01-01T12:00:00.000Z",
      reviewMergedAt: "2024-01-02T12:00:00.000Z",
    });
  });

  it("マージイベントが無い場合はクローズ日時を使用する", () => {
    const issue = buildIssue({
      events: [buildEvent("review_requested", "2024-01-01T00:00:00Z")],
      closedAt: "2024-01-01T06:00:00Z",
    });

    const metric = createReviewTimeMetric(issue);

    expect(metric).toEqual({
      duration: 21_600_000,
      reviewRequestedAt: "2024-01-01T00:00:00.000Z",
      reviewMergedAt: "2024-01-01T06:00:00.000Z",
    });
  });
});