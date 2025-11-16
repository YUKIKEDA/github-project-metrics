import type { CombinedIssue } from "@github-project-metrics/ghpm-issues";
import { combineIssuesWithProject } from "@github-project-metrics/ghpm-issues";
import { fetchAllIssues } from "@github-project-metrics/ghpm-issues";
import { fetchIssuesWithEvents } from "@github-project-metrics/ghpm-issues";
import { fetchAllProjectData } from "@github-project-metrics/ghpm-issues";
import type { GitHubApiContext } from "@github-project-metrics/ghpm-issues";
import type { GitHubGraphQLContext } from "@github-project-metrics/ghpm-issues";

/**
 * CombinedIssueを取得する。
 *
 * @param apiContext - GitHub REST APIのコンテキスト
 * @param graphqlContext - GitHub GraphQL APIのコンテキスト（オプション）
 * @returns CombinedIssueの配列
 */
export async function fetchCombinedIssues(
  apiContext: GitHubApiContext,
  graphqlContext?: GitHubGraphQLContext,
): Promise<CombinedIssue[]> {
  // Issueを取得
  const issues = await fetchAllIssues(apiContext);

  // Issueのイベントを取得
  const issuesWithEvents = await fetchIssuesWithEvents(apiContext, issues);

  // Projectデータを取得（オプション）
  const projectData = graphqlContext ? await fetchAllProjectData(graphqlContext) : null;

  // IssueとProjectを結合
  const combinedIssues = combineIssuesWithProject(issuesWithEvents, projectData);

  return combinedIssues;
}

