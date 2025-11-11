/**
 * Projects v2 取得時の所有者区分。
 */
export type GitHubProjectOwnerType = "Organization" | "User";

/**
 * Projects v2 のページネーション設定。
 */
export interface GitHubGraphQLPaginationOptions {
  /**
   * プロジェクトアイテム取得時のページサイズ（最大 100）。
   */
  itemsPageSize?: number;
  /**
   * フィールド値取得時のページサイズ。
   */
  fieldValuesPageSize?: number;
  /**
   * ラベル取得時のページサイズ。
   */
  fieldLabelPageSize?: number;
  /**
   * ユーザー取得時のページサイズ。
   */
  fieldUserPageSize?: number;
}

/**
 * Projects v2 の GraphQL クエリ実行に必要なオプション。
 */
export interface GitHubGraphQLOptions {
  /**
   * プロジェクト所有者の区分。
   */
  ownerType: GitHubProjectOwnerType;
  /**
   * 所有者のログイン名（組織またはユーザー）。
   */
  login: string;
  /**
   * 対象プロジェクトの番号。
   */
  projectNumber: number;
  /**
   * ページネーション設定。
   */
  pagination?: GitHubGraphQLPaginationOptions;
}
