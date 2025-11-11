import type { Octokit } from "@octokit/rest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchAllIssues } from "./index.js";
import type { GitHubApiContext } from "./types/githubApiContext.js";
import type { ResponseIssue } from "./types/responseIssue.js";

const defaultRepository: GitHubApiContext["options"]["repository"] = {
  owner: "acme",
  repo: "metrics",
};

const createIssue = (id: number): ResponseIssue =>
  ({
    id,
  }) as ResponseIssue;

function createContext(
  pages: ResponseIssue[][],
  options: Partial<GitHubApiContext["options"]> = {},
): {
  context: GitHubApiContext;
  iteratorMock: ReturnType<typeof vi.fn>;
  consumedPageIndices: number[];
} {
  const consumedPageIndices: number[] = [];

  const iteratorMock = vi.fn((_method, _params) => {
    async function* generator() {
      for (const [index, page] of pages.entries()) {
        consumedPageIndices.push(index);
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
      listForRepo: vi.fn(),
    },
  } as unknown as Octokit;

  const repository = options.repository ?? { ...defaultRepository };
  const pagination = options.pagination;

  const context: GitHubApiContext = {
    client,
    options: {
      repository,
      ...(pagination ? { pagination } : {}),
    },
  };

  return { context, iteratorMock, consumedPageIndices };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("fetchAllIssues", () => {
  it("全ページの issue を結合して返す", async () => {
    const issuePages = [[createIssue(1)], [createIssue(2), createIssue(3)], [createIssue(4)]];

    const { context, iteratorMock, consumedPageIndices } = createContext(issuePages);

    const result = await fetchAllIssues(context);

    expect(result).toEqual(issuePages.flat());
    expect(iteratorMock).toHaveBeenCalledOnce();

    const [method, params] = iteratorMock.mock.calls[0];
    expect(method).toBe(context.client.issues.listForRepo);
    expect(params).toEqual({
      owner: context.options.repository.owner,
      repo: context.options.repository.repo,
      per_page: 100,
      state: "all",
    });

    expect(consumedPageIndices).toEqual([0, 1, 2]);
  });

  it("maxPages 指定時は指定ページ数で巡回を停止する", async () => {
    const issuePages = [[createIssue(10)], [createIssue(20)], [createIssue(30)]];

    const { context, iteratorMock, consumedPageIndices } = createContext(issuePages, {
      pagination: {
        perPage: 30,
        maxPages: 2,
      },
    });

    const result = await fetchAllIssues(context);

    expect(result).toEqual(issuePages.slice(0, 2).flat());
    expect(iteratorMock).toHaveBeenCalledOnce();

    const [, params] = iteratorMock.mock.calls[0];
    expect(params).toMatchObject({
      per_page: 30,
    });

    expect(consumedPageIndices).toEqual([0, 1]);
  });
});
