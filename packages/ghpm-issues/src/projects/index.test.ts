import { describe, expect, it, vi } from "vitest";
import { ORGANIZATION_PROJECT_V2_GRAPHQL, USER_PROJECT_V2_GRAPHQL } from "./graphqlSchema";
import { fetchAllProjectData } from "./index";
import type { GitHubGraphQLContext } from "./types/githubGraphqlContext";
import type {
  OrganizationProjectV2Data,
  ProjectData,
  ProjectV2,
  ProjectV2Item,
  UserProjectV2Data,
} from "./types/projectData";

function createItem(id: string): ProjectV2Item {
  return {
    id,
    type: "ISSUE",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-02T00:00:00Z",
    content: null,
    fieldValues: {
      nodes: [],
    },
  };
}

function createProject(
  itemNodes: ProjectV2Item[],
  pageInfo: ProjectV2["items"]["pageInfo"],
  overrides?: Partial<ProjectV2>,
): ProjectV2 {
  return {
    id: "P_1",
    number: 1,
    title: "Sample Project",
    shortDescription: "sample",
    closed: false,
    closedAt: null,
    public: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-02T00:00:00Z",
    url: "https://github.com/org/project",
    owner: {
      __typename: "Organization",
      id: "ORG_1",
      login: "org",
      name: "org",
      url: "https://github.com/org",
    },
    fields: {
      totalCount: 0,
      pageInfo: {
        hasNextPage: false,
        endCursor: null,
      },
      nodes: [],
    },
    items: {
      totalCount: itemNodes.length,
      pageInfo,
      nodes: itemNodes,
    },
    ...overrides,
  };
}

describe("fetchAllProjectData", () => {
  it("ページングされたすべてのアイテムを集約して返す (Organization)", async () => {
    const graphqlMock = vi.fn();
    const client = { graphql: graphqlMock } as unknown as GitHubGraphQLContext["client"];

    const firstItems = [createItem("item-1")];
    const secondItems = [createItem("item-2"), createItem("item-3")];

    const firstProject = createProject(firstItems, {
      hasNextPage: true,
      endCursor: "cursor-1",
    });

    const secondProject = createProject(secondItems, {
      hasNextPage: false,
      endCursor: null,
    });

    graphqlMock
      .mockResolvedValueOnce({
        organization: { projectV2: firstProject },
      } satisfies OrganizationProjectV2Data)
      .mockResolvedValueOnce({
        organization: { projectV2: secondProject },
      } satisfies OrganizationProjectV2Data);

    const context: GitHubGraphQLContext = {
      client,
      options: {
        ownerType: "Organization",
        login: "org",
        projectNumber: 1,
        pagination: {
          itemsPageSize: 10,
          fieldValuesPageSize: 5,
          fieldLabelPageSize: 6,
          fieldUserPageSize: 7,
          fieldIterationPageSize: 8,
        },
      },
    };

    const result = await fetchAllProjectData(context);

    expect(graphqlMock).toHaveBeenCalledTimes(2);
    expect(graphqlMock).toHaveBeenNthCalledWith(
      1,
      ORGANIZATION_PROJECT_V2_GRAPHQL,
      expect.objectContaining({
        organization: "org",
        projectNumber: 1,
        itemsCursor: undefined,
        itemsPageSize: 10,
        fieldValuesPageSize: 5,
        fieldLabelPageSize: 6,
        fieldUserPageSize: 7,
        fieldIterationPageSize: 8,
      }),
    );
    expect(graphqlMock).toHaveBeenNthCalledWith(
      2,
      ORGANIZATION_PROJECT_V2_GRAPHQL,
      expect.objectContaining({
        organization: "org",
        itemsCursor: "cursor-1",
      }),
    );

    expect(result.project).not.toBeNull();
    expect(result.project?.items.nodes).toHaveLength(3);
    expect(result.project?.items.nodes.map((item) => item.id)).toEqual([
      "item-1",
      "item-2",
      "item-3",
    ]);
    expect(result.project?.items.totalCount).toBe(secondProject.items.totalCount);
    expect(result.project?.items.pageInfo).toEqual(secondProject.items.pageInfo);
    expect(result.options).toEqual(context.options.pagination);
  });

  it("プロジェクトが存在しない場合は null を返す (User)", async () => {
    const graphqlMock = vi
      .fn()
      .mockResolvedValueOnce({ user: { projectV2: null } } satisfies UserProjectV2Data);

    const client = { graphql: graphqlMock } as unknown as GitHubGraphQLContext["client"];

    const context: GitHubGraphQLContext = {
      client,
      options: {
        ownerType: "User",
        login: "alice",
        projectNumber: 42,
      },
    };

    const result: ProjectData = await fetchAllProjectData(context);

    expect(graphqlMock).toHaveBeenCalledTimes(1);
    expect(graphqlMock).toHaveBeenCalledWith(
      USER_PROJECT_V2_GRAPHQL,
      expect.objectContaining({
        user: "alice",
        projectNumber: 42,
      }),
    );

    expect(result.project).toBeNull();
    expect(result.options).toBeUndefined();
    expect(result.ownerType).toBe("User");
    expect(result.login).toBe("alice");
    expect(result.projectNumber).toBe(42);
  });
});
