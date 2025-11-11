import { describe, expect, it } from "vitest";
import type { ResponseIssue } from "../issues/types/responseIssue";
import type {
  ProjectData,
  ProjectV2Issue,
  ProjectV2Item,
  ProjectV2PullRequest,
} from "../projects/types/projectData";
import { combineIssuesWithProject } from "./index";

const iso = "2024-01-01T00:00:00Z";

const repository = {
  id: "repo-1",
  nameWithOwner: "acme/repo",
};

function createIssueItem(number: number): ProjectV2Item {
  const content: ProjectV2Issue = {
    __typename: "Issue",
    id: `issue-${number}`,
    number,
    title: `Issue ${number}`,
    url: `https://github.com/acme/repo/issues/${number}`,
    state: "OPEN",
    repository,
    assignees: { nodes: [] },
    labels: { nodes: [] },
  };

  return {
    id: `item-issue-${number}`,
    type: "ISSUE",
    createdAt: iso,
    updatedAt: iso,
    content,
    fieldValues: { nodes: [] },
  };
}

function createPullRequestItem(number: number): ProjectV2Item {
  const content: ProjectV2PullRequest = {
    __typename: "PullRequest",
    id: `pr-${number}`,
    number,
    title: `PR ${number}`,
    url: `https://github.com/acme/repo/pull/${number}`,
    state: "OPEN",
    merged: false,
    mergedAt: null,
    repository,
    author: null,
  };

  return {
    id: `item-pr-${number}`,
    type: "PULL_REQUEST",
    createdAt: iso,
    updatedAt: iso,
    content,
    fieldValues: { nodes: [] },
  };
}

function createProjectData(items: ProjectV2Item[]): ProjectData {
  return {
    ownerType: "Organization",
    login: "acme",
    projectNumber: 1,
    options: undefined,
    project: {
      id: "project-1",
      number: 1,
      title: "Project 1",
      shortDescription: null,
      closed: false,
      closedAt: null,
      public: true,
      createdAt: iso,
      updatedAt: iso,
      url: "https://github.com/orgs/acme/projects/1",
      owner: null,
      fields: {
        totalCount: 0,
        pageInfo: { hasNextPage: false, endCursor: null },
        nodes: [],
      },
      items: {
        totalCount: items.length,
        pageInfo: { hasNextPage: false, endCursor: null },
        nodes: items,
      },
    },
  };
}

const createRestIssue = (number: number, overrides: Record<string, unknown> = {}): ResponseIssue =>
  ({
    id: number,
    number,
    ...overrides,
  }) as ResponseIssue;

describe("combineIssuesWithProject", () => {
  it("Issue と Projects v2 の Issue アイテムを結合する", () => {
    const issues = [createRestIssue(101), createRestIssue(102)];
    const projectData = createProjectData([createIssueItem(101), createIssueItem(102)]);

    const result = combineIssuesWithProject(issues, projectData);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      issue: issues[0],
      projects: projectData.project?.items.nodes[0],
    });
    expect(result[1]).toEqual({
      issue: issues[1],
      projects: projectData.project?.items.nodes[1],
    });
  });

  it("Pull Request も番号で結合する", () => {
    const pullRequestIssue = createRestIssue(200, {
      pull_request: {
        url: "https://api.github.com/repos/acme/repo/pulls/200",
      },
    });
    const projectData = createProjectData([createPullRequestItem(200)]);

    const result = combineIssuesWithProject([pullRequestIssue], projectData);

    expect(result[0]).toEqual({
      issue: pullRequestIssue,
      projects: projectData.project?.items.nodes[0],
    });
  });

  it("対応する Project アイテムが無い場合は null を設定する", () => {
    const issues = [createRestIssue(300)];
    const projectData = createProjectData([]);

    const result = combineIssuesWithProject(issues, projectData);

    expect(result[0]).toEqual({
      issue: issues[0],
      projects: null,
    });
  });

  it("projectData が null の場合でも安全に処理する", () => {
    const issues = [createRestIssue(400)];

    const result = combineIssuesWithProject(issues, null);

    expect(result).toEqual([
      {
        issue: issues[0],
        projects: null,
      },
    ]);
  });
});
