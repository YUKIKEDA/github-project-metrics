import type { Octokit } from "@octokit/rest";
import type { GitHubGraphQLOptions } from "./githubGraphqlOptions";

/**
 * GitHub GraphQL API を利用する際に共有して扱うコンテキスト。
 */
export interface GitHubGraphQLContext {
  /**
   * 事前に初期化された Octokit クライアント。
   */
  client: Octokit;

  /**
   * GraphQL クエリ実行時のオプション。
   */
  options: GitHubGraphQLOptions;
}
