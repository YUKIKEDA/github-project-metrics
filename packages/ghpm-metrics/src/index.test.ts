import { describe, expect, it } from "vitest";
import { createIssueMetrics } from "./index";
import type { CombinedIssue } from "@github-project-metrics/ghpm-issues";

function createCombinedIssue(overrides: Partial<CombinedIssue> = {}): CombinedIssue {
  const baseIssue = {
    id: 123,
    number: 123,
    title: "Sample Issue",
    state: "open",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-02T00:00:00Z",
    closed_at: "2024-01-05T12:00:00Z",
    comments: 5,
    body: "Issue body",
    pull_request: undefined,
    draft: false,
    user: { login: "reporter", id: 1 },
    assignees: [{ login: "assignee", id: 2 }],
    labels: [{ name: "bug", color: "ff0000", description: "Bug" }],
    milestone: {
      title: "v1.0",
      state: "open",
      description: "Initial release",
      due_on: "2024-02-01T00:00:00Z",
    },
  } as CombinedIssue["issue"];

  const baseProject = {
    id: "project-item-1",
    type: "ISSUE",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-02T00:00:00Z",
    content: {
      __typename: "Issue",
      id: "issue-123",
      number: 123,
      title: "Sample Issue",
      url: "https://github.com/acme/repo/issues/123",
      state: "OPEN",
      repository: {
        id: "repo-1",
        nameWithOwner: "acme/repo",
        url: "https://github.com/acme/repo",
      },
      assignees: { nodes: [] },
      labels: { nodes: [] },
    },
    fieldValues: { nodes: [] },
  } as CombinedIssue["projects"];

  const baseTimelineEvent = {
    id: 1001,
    node_id: "node-1001",
    url: "https://api.github.com/repos/acme/repo/issues/events/1001",
    actor: { login: "actor", id: 10 },
    event: "assigned",
    commit_id: "abcdef",
    commit_url: "https://github.com/acme/repo/commit/abcdef",
    created_at: "2024-01-03T00:00:00Z",
    label: { name: "bug", color: "ff0000", description: "Bug" },
    assignee: { login: "assignee", id: 2 },
    assigner: { login: "assigner", id: 3 },
    review_requester: null,
    requested_reviewer: null,
    requested_team: { id: 99, slug: "team-slug", name: "Team Name" },
    dismissed_review: null,
    milestone: {
      title: "Timeline milestone",
      description: "Timeline milestone description",
      due_on: "2024-01-10T00:00:00Z",
      state: "open",
    },
    project_card: {
      url: "https://github.com/acme/repo/projects/cards/1",
      id: 500,
      project_url: "https://github.com/orgs/acme/projects/1",
      project_id: 200,
      column_name: "Doing",
      previous_column_name: "Todo",
    },
    rename: { from: "Old title", to: "New title" },
    lock_reason: "resolved",
  } as CombinedIssue["events"][number];

  const commentEvent = {
    id: 1002,
    node_id: "node-1002",
    url: "https://api.github.com/repos/acme/repo/issues/events/1002",
    actor: { login: "commenter", id: 20 },
    event: "commented",
    created_at: "2024-01-04T10:00:00Z",
  } as CombinedIssue["events"][number];

  const closedEvent = {
    id: 1003,
    node_id: "node-1003",
    url: "https://api.github.com/repos/acme/repo/issues/events/1003",
    actor: { login: "actor", id: 10 },
    event: "closed",
    created_at: "2024-01-05T12:00:00Z",
  } as CombinedIssue["events"][number];

  return {
    issue: overrides.issue ?? baseIssue,
    events: overrides.events ?? [baseTimelineEvent, commentEvent, closedEvent],
    projects: overrides.projects === undefined ? baseProject : overrides.projects,
  };
}

describe("createIssueMetrics", () => {
  it("Issue・Project・Event 情報を正規化して返す", () => {
    const combinedIssue = createCombinedIssue();

    const [result] = createIssueMetrics([combinedIssue]);

    expect(result.metrics).toMatchObject({
      commentCount: {
        total: 5,
        participantCount: 1,
      },
      leadTime: {
        durationMs: 388_800_000,
        startedAt: "2024-01-01T00:00:00.000Z",
        completedAt: "2024-01-05T12:00:00.000Z",
        startedEvent: "issue_opened",
        endedEvent: "issue_closed",
      },
      cycleTime: {
        durationMs: 216_000_000,
        startedAt: "2024-01-03T00:00:00.000Z",
        completedAt: "2024-01-05T12:00:00.000Z",
        startedEvent: "assigned",
        completedEvent: "closed",
      },
    });
    expect(result.issue).toMatchObject({
      number: 123,
      title: "Sample Issue",
      state: "open",
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-02T00:00:00Z",
      closed_at: "2024-01-05T12:00:00Z",
      user: { login: "reporter", id: 1 },
      assignees: [{ login: "assignee", id: 2 }],
      labels: [{ name: "bug", color: "ff0000", description: "Bug" }],
      milestone: {
        title: "v1.0",
        state: "open",
        description: "Initial release",
        due_on: "2024-02-01T00:00:00Z",
      },
      events: expect.arrayContaining([
        expect.objectContaining({
          id: 1001,
          event: "assigned",
        }),
        expect.objectContaining({
          id: 1002,
          event: "commented",
        }),
        expect.objectContaining({
          id: 1003,
          event: "closed",
        }),
      ]),
      projects: [
        {
          projectId: "project-item-1",
          projectTitle: "Sample Issue",
          projectNumber: 123,
          projectUrl: "https://github.com/acme/repo/issues/123",
          fieldValues: [],
        },
      ],
    });
  });

  it("Project が null の場合でもイベント情報を保持する", () => {
    const minimalEvent = {
      id: 2001,
      node_id: "node-2001",
      url: "https://api.github.com/repos/acme/repo/issues/events/2001",
      event: "closed",
      created_at: "2024-02-01T00:00:00Z",
    } as CombinedIssue["events"][number];

    const combinedIssue = createCombinedIssue({
      projects: null,
      events: [minimalEvent],
      issue: { ...createCombinedIssue().issue, closed_at: null },
    });

    const [result] = createIssueMetrics([combinedIssue]);

    expect(result.issue.projects).toEqual([]);
    expect(result.issue.events).toEqual([
      {
        id: 2001,
        node_id: "node-2001",
        url: "https://api.github.com/repos/acme/repo/issues/events/2001",
        actor: null,
        event: "closed",
        commit_id: null,
        commit_url: null,
        created_at: "2024-02-01T00:00:00Z",
        label: null,
        assignee: null,
        assigner: null,
        review_requester: null,
        requested_reviewer: null,
        requested_team: null,
        dismissed_review: null,
        milestone: null,
        project_card: null,
        rename: null,
        lock_reason: null,
      },
    ]);
  });
});

