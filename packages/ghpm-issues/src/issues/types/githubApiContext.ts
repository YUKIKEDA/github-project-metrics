import type { Octokit } from "@octokit/rest";
import type { GitHubApiOptions } from "./githubApiOptions.js";

/**
 * GitHub REST API を利用する際に共有して扱うコンテキスト。
 */
export interface GitHubApiContext {
  /**
   * 事前に初期化された Octokit クライアント。
   */
  client: Octokit;

  /**
   * クライアント生成時に利用したオプション。
   */
  options: GitHubApiOptions;
}
