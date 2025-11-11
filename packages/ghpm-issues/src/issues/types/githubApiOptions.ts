/**
 * 対象リポジトリを指定するための情報。
 */
export interface GitHubRepositoryOptions {
  /**
   * リポジトリ所有者のユーザー名または組織名。
   */
  owner: string;

  /**
   * リポジトリ名。
   */
  repo: string;
}

/**
 * REST API のページング設定。
 */
export interface GitHubApiPaginationOptions {
  /**
   * 1ページあたりに取得するアイテム数。
   * GitHub API の仕様上、最大 100 件。
   */
  perPage?: number;

  /**
   * ページング取得時に巡回する最大ページ数。
   * undefined の場合は取得側の実装に委ねる。
   */
  maxPages?: number;
}

type OctokitConstructor = typeof import("@octokit/rest").Octokit;
type OctokitOptions = NonNullable<ConstructorParameters<OctokitConstructor>[0]>;

/**
 * GitHub API クライアントの生成・利用時に必要となるオプション。
 */
export interface GitHubApiOptions {
  /**
   * 対象とするリポジトリ情報。
   */
  repository: GitHubRepositoryOptions;

  /**
   * REST API のページング設定。
   */
  pagination?: GitHubApiPaginationOptions;

  /**
   * Octokitのクライアント初期化時オプション。
   */
  octokitOptions?: OctokitOptions;
}
