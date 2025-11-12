import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { Octokit } from "@octokit/rest";
import { config as loadEnv } from "dotenv";
import type { CombinedIssue } from "@github-project-metrics/ghpm-issues";
import { describe, expect, it } from "vitest";
import { combineIssuesWithProject } from "../../../ghpm-issues/src/combinedIssue/index.js";
import { fetchIssuesWithEvents } from "../../../ghpm-issues/src/issueEvent/index.js";
import { fetchAllIssues } from "../../../ghpm-issues/src/issues/index.js";
import type { GitHubApiContext } from "../../../ghpm-issues/src/issues/types/githubApiContext.js";
import { fetchAllProjectData } from "../../../ghpm-issues/src/projects/index.js";
import { createIssueMetrics } from "./index";

loadEnv();

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

describe("createIssueMetrics (integration)", () => {
  it("実際の Issue や Project からメトリクスを生成する", async () => {
    const token = process.env.GITHUB_PERSONAL_ACCESS_TOKEN;

    if (!token) {
      throw new Error("GITHUB_PERSONAL_ACCESS_TOKEN が設定されていません。");
    }

    const client = new Octokit({ auth: token });
    const repositoryOptions = {
      owner: "YUKIKEDA",
      repo: "github-project-metrics",
    } as const;

    const context = {
      client,
      options: {
        repository: {
          owner: repositoryOptions.owner,
          repo: repositoryOptions.repo,
        },
      },
    } satisfies GitHubApiContext;

    const issues = await fetchAllIssues(context);
    const issuesWithEvents = await fetchIssuesWithEvents(context, issues);
    const projectData = await fetchAllProjectData({
      client,
      options: {
        ownerType: "User",
        login: "YUKIKEDA",
        projectNumber: 8,
      },
    });

    if (!projectData.project) {
      throw new Error("指定した Projects v2 が取得できませんでした。");
    }

    const combined = combineIssuesWithProject(issuesWithEvents, projectData);
    const metrics = createIssueMetrics(combined);
    const debugDir = join(process.cwd(), "tmp");

    mkdirSync(debugDir, { recursive: true });
    writeFileSync(
      join(debugDir, "createIssueMetrics.integration.json"),
      JSON.stringify(metrics, null, 2),
      "utf-8",
    );

    expect(metrics.length).toBeGreaterThan(0);
    expect(metrics).toHaveLength(combined.length);

    for (let index = 0; index < combined.length; index += 1) {
      const source = combined[index];
      const normalized = metrics[index].issue;

      expect(normalized.number).toBe(source.issue.number);
      expect(normalized.events).toHaveLength(source.events.length);

      if (source.projects) {
        expect(normalized.projects).toHaveLength(1);
        expect(normalized.projects[0]?.projectId).toBe(source.projects.id);
      } else {
        expect(normalized.projects).toEqual([]);
      }
    }

    expect(metrics.some((entry) => Object.keys(entry.metrics).length > 0)).toBe(true);
  }, 30_000);
});

