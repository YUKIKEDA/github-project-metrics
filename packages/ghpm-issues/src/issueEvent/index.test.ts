import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { Octokit, type Octokit as OctokitType } from "@octokit/rest";
import { config as loadEnv } from "dotenv";
import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchIssuesWithEvents, fetchTimelineEventsForIssue } from "./index.js";
import type { GitHubApiContext } from "../issues/types/githubApiContext.js";
import type { ResponseIssue } from "../issues/types/responseIssue.js";
import type { IssueEvent } from "./types/issueEvent.js";

loadEnv();

const defaultRepository: GitHubApiContext["options"]["repository"] = {
  owner: "acme",
  repo: "metrics",
};

const createEvent = (id: number, overrides: Partial<IssueEvent> = {}): IssueEvent =>
  ({
    id,
    event: "closed",
    created_at: "2024-01-01T00:00:00Z",
    ...overrides,
  }) as IssueEvent;

const createIssue = (number: number, overrides: Partial<ResponseIssue> = {}): ResponseIssue =>
  ({
    id: number,
    number,
    ...overrides,
  }) as ResponseIssue;

type TimelinePages = Record<number, IssueEvent[][]>;

function createContext(
  pages: TimelinePages,
  options: Partial<GitHubApiContext["options"]> = {},
): {
  context: GitHubApiContext;
  iteratorMock: ReturnType<typeof vi.fn>;
  yieldedPages: Array<{ issueNumber: number; pageIndex: number }>;
  callParams: Array<unknown>;
} {
  const yieldedPages: Array<{ issueNumber: number; pageIndex: number }> = [];
  const callParams: Array<unknown> = [];

  const iteratorMock = vi.fn((method, params) => {
    callParams.push([method, params]);

    const issueNumber = (params as { issue_number: number }).issue_number;
    const issuePages = pages[issueNumber] ?? [];

    async function* generator() {
      for (const [pageIndex, page] of issuePages.entries()) {
        yieldedPages.push({ issueNumber, pageIndex });
        yield { data: page };
      }
    }

    return generator();
  });

  const client = {
    paginate: {
      iterator: iteratorMock,
    },
    issues: {
      listEventsForTimeline: vi.fn(),
    },
  } as unknown as OctokitType;

  const repository = options.repository ?? { ...defaultRepository };
  const pagination = options.pagination;

  const context: GitHubApiContext = {
    client,
    options: {
      repository,
      ...(pagination ? { pagination } : {}),
    },
  };

  return { context, iteratorMock, yieldedPages, callParams };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("fetchTimelineEventsForIssue", () => {
  it("単一 Issue のタイムラインイベントをすべて取得する", async () => {
    const { context, iteratorMock, yieldedPages, callParams } = createContext({
      101: [[createEvent(1)], [createEvent(2), createEvent(3)]],
    });

    const events = await fetchTimelineEventsForIssue(context, 101);

    expect(events).toEqual([createEvent(1), createEvent(2), createEvent(3)]);
    expect(iteratorMock).toHaveBeenCalledOnce();

    const [method, params] = callParams[0] as [unknown, Record<string, unknown>];
    expect(method).toBe(context.client.issues.listEventsForTimeline);
    expect(params).toMatchObject({
      owner: context.options.repository.owner,
      repo: context.options.repository.repo,
      issue_number: 101,
      per_page: 100,
      mediaType: {
        previews: ["mockingbird"],
      },
    });

    expect(yieldedPages).toEqual([
      { issueNumber: 101, pageIndex: 0 },
      { issueNumber: 101, pageIndex: 1 },
    ]);
  });

  it("maxPages 指定時は指定ページ数で停止する", async () => {
    const { context, yieldedPages } = createContext(
      {
        202: [[createEvent(10)], [createEvent(20)]],
      },
      {
        pagination: {
          perPage: 30,
          maxPages: 1,
        },
      },
    );

    const events = await fetchTimelineEventsForIssue(context, 202);

    expect(events).toEqual([createEvent(10)]);
    expect(yieldedPages).toEqual([{ issueNumber: 202, pageIndex: 0 }]);
  });
});

describe("fetchIssuesWithEvents", () => {
  it("複数 Issue のイベントを取得して結合する", async () => {
    const issueA = createIssue(1);
    const issueB = createIssue(2);

    const { context, iteratorMock } = createContext({
      1: [[createEvent(101)]],
      2: [[createEvent(201), createEvent(202)]],
    });

    const result = await fetchIssuesWithEvents(context, [issueA, issueB]);

    expect(result).toEqual([
      { issue: issueA, events: [createEvent(101)] },
      { issue: issueB, events: [createEvent(201), createEvent(202)] },
    ]);

    expect(iteratorMock).toHaveBeenCalledTimes(2);
  });
});

describe("fetchTimelineEventsForIssue (integration)", () => {
  it("実リポジトリからタイムラインイベントを取得できる", async () => {
    const token = process.env.GITHUB_PERSONAL_ACCESS_TOKEN;

    if (!token) {
      throw new Error("GITHUB_PERSONAL_ACCESS_TOKEN が設定されていません。");
    }

    const client = new Octokit({
      auth: token,
    });

    const context: GitHubApiContext = {
      client,
      options: {
        repository: {
          owner: "YUKIKEDA",
          repo: "github-project-metrics",
        },
        pagination: {
          perPage: 40,
          maxPages: 1,
        },
      },
    };

    const events = await fetchTimelineEventsForIssue(context, 1);

    expect(Array.isArray(events)).toBe(true);

    const debugDir = join(process.cwd(), "tmp");
    mkdirSync(debugDir, { recursive: true });
    writeFileSync(
      join(debugDir, "fetchTimelineEventsForIssue.integration.json"),
      JSON.stringify(events, null, 2),
      "utf-8",
    );
  }, 30_000);
});

