import { ORGANIZATION_PROJECT_V2_GRAPHQL, USER_PROJECT_V2_GRAPHQL } from "./graphqlSchema";
import type { GitHubGraphQLContext } from "./types/githubGraphqlContext";
import type {
  OrganizationProjectV2Data,
  ProjectData,
  ProjectV2,
  ProjectV2Item,
  UserProjectV2Data,
} from "./types/projectData";

/**
 * Projects v2 データを全件取得する。
 * GraphQL API のページングを考慮し、全アイテムを走査して集約した結果を返す。
 */
export async function fetchAllProjectData(context: GitHubGraphQLContext): Promise<ProjectData> {
  const { client, options } = context;
  const { ownerType, login, projectNumber, pagination } = options;

  const baseVariables = {
    projectNumber,
    itemsPageSize: pagination?.itemsPageSize ?? 100,
    fieldValuesPageSize: pagination?.fieldValuesPageSize ?? 20,
    fieldLabelPageSize: pagination?.fieldLabelPageSize ?? 20,
    fieldUserPageSize: pagination?.fieldUserPageSize ?? 20,
    fieldIterationPageSize: pagination?.fieldIterationPageSize ?? 20,
  };

  const aggregateItems: ProjectV2Item[] = [];
  let aggregatedProject: ProjectV2 | null = null;
  let lastProjectSnapshot: ProjectV2 | null = null;
  let itemsCursor: string | undefined;

  try {
    // ページネーションを考慮してすべてのアイテムを取得する。
    // API コールの最終結果を `aggregatedProject` に格納しながら集計。
    // eslint-disable-next-line no-constant-condition
    while (true) {
      let project: ProjectV2 | null;

      if (ownerType === "Organization") {
        const variables = {
          ...baseVariables,
          organization: login,
          itemsCursor,
        };
        const response = await client.graphql<OrganizationProjectV2Data>(
          ORGANIZATION_PROJECT_V2_GRAPHQL,
          variables,
        );
        project = response.organization?.projectV2 ?? null;
      } else {
        const variables = {
          ...baseVariables,
          user: login,
          itemsCursor,
        };
        const response = await client.graphql<UserProjectV2Data>(
          USER_PROJECT_V2_GRAPHQL,
          variables,
        );
        project = response.user?.projectV2 ?? null;
      }

      if (!project) {
        return {
          ownerType,
          login,
          projectNumber,
          options: pagination,
          project: null,
        };
      }

      lastProjectSnapshot = project;

      if (!aggregatedProject) {
        aggregatedProject = {
          ...project,
          items: {
            totalCount: project.items.totalCount,
            pageInfo: project.items.pageInfo,
            nodes: [],
          },
        };
      }

      aggregateItems.push(...project.items.nodes);

      const { hasNextPage, endCursor } = project.items.pageInfo;

      if (!hasNextPage || !endCursor) {
        break;
      }

      itemsCursor = endCursor;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to fetch project data: ${message}`);
  }

  if (!aggregatedProject || !lastProjectSnapshot) {
    return {
      ownerType,
      login,
      projectNumber,
      options: pagination,
      project: null,
    };
  }

  const itemsConnection = {
    totalCount: lastProjectSnapshot.items.totalCount,
    pageInfo: lastProjectSnapshot.items.pageInfo,
    nodes: aggregateItems,
  };

  const project: ProjectV2 = {
    ...aggregatedProject,
    items: itemsConnection,
  };

  return {
    ownerType,
    login,
    projectNumber,
    options: pagination,
    project,
  };
}
