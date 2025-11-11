import type { GitHubGraphQLOptions, GitHubProjectOwnerType } from "./githubGraphqlOptions";

/**
 * 共通のページネーション情報。
 */
export interface PageInfo {
  hasNextPage: boolean;
  endCursor: string | null;
}

/**
 * GraphQL Connection パターンの簡易表現。
 */
export interface Connection<T> {
  totalCount?: number;
  pageInfo: PageInfo;
  nodes: T[];
}

/**
 * プロジェクトの所有者（組織またはユーザー）。
 */
export type ProjectV2Owner =
  | {
      __typename: "Organization";
      id: string;
      login: string;
      name: string | null;
      url: string;
    }
  | {
      __typename: "User";
      id: string;
      login: string;
      name: string | null;
      url: string;
    }
  | {
      __typename: string;
      [key: string]: unknown;
    };

/**
 * 基本的なフィールド情報。
 */
export interface ProjectV2FieldBase {
  __typename: string;
  id: string;
  name: string;
  dataType: string;
}

/**
 * 単一選択フィールドの選択肢。
 */
export interface ProjectV2SingleSelectOption {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
}

/**
 * 単一選択フィールド。
 */
export interface ProjectV2SingleSelectField extends ProjectV2FieldBase {
  __typename: "ProjectV2SingleSelectField";
  options: ProjectV2SingleSelectOption[];
}

/**
 * イテレーション設定。
 */
export interface ProjectV2IterationConfiguration {
  duration: number | null;
  startDay: number | null;
}

/**
 * イテレーションの個別情報。
 */
export interface ProjectV2Iteration {
  id: string;
  title: string;
  startDate: string | null;
  duration: number | null;
}

/**
 * イテレーションフィールド。
 */
export interface ProjectV2IterationField extends ProjectV2FieldBase {
  __typename: "ProjectV2IterationField";
  configuration: ProjectV2IterationConfiguration | null;
  iterations: {
    nodes: ProjectV2Iteration[];
  };
}

/**
 * フィールドの総称型。
 */
export type ProjectV2Field =
  | ProjectV2SingleSelectField
  | ProjectV2IterationField
  | ProjectV2FieldBase;

/**
 * Issue や PullRequest が属するリポジトリ情報。
 */
export interface RepositorySummary {
  id: string;
  nameWithOwner: string;
  name?: string;
  url?: string;
}

/**
 * ユーザーのサマリー。
 */
export interface UserSummary {
  id: string;
  login: string;
  name: string | null;
  url: string;
  avatarUrl?: string;
}

/**
 * Issue のラベル情報。
 */
export interface LabelSummary {
  id: string;
  name: string;
  color: string | null;
  description: string | null;
}

/**
 * GraphQL `DraftIssue` ノード。
 */
export interface ProjectV2DraftIssue {
  __typename: "DraftIssue";
  id: string;
  title: string;
  body: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * GraphQL `Issue` ノード。
 */
export interface ProjectV2Issue {
  __typename: "Issue";
  id: string;
  number: number;
  title: string;
  url: string;
  state: string;
  repository: RepositorySummary;
  assignees: {
    nodes: UserSummary[];
  };
  labels: {
    nodes: LabelSummary[];
  };
}

/**
 * GraphQL `PullRequest` ノード。
 */
export interface ProjectV2PullRequest {
  __typename: "PullRequest";
  id: string;
  number: number;
  title: string;
  url: string;
  state: string;
  merged: boolean;
  mergedAt: string | null;
  repository: RepositorySummary;
  author:
    | (UserSummary & { __typename: "User" })
    | {
        __typename: string;
        [key: string]: unknown;
      }
    | null;
}

/**
 * プロジェクトアイテムが参照するコンテンツのユニオン。
 */
export type ProjectV2ItemContent =
  | ProjectV2DraftIssue
  | ProjectV2Issue
  | ProjectV2PullRequest
  | null;

/**
 * マイルストーン情報。
 */
export interface MilestoneSummary {
  id: string;
  number: number;
  title: string;
  url: string;
  state: string;
  dueOn: string | null;
}

/**
 * Project アイテムのフィールド値ユニオン。
 * 必要に応じて拡張できるよう、既知ケース以外のキャッチオールも含める。
 */
export type ProjectV2ItemFieldValue =
  | {
      __typename: "ProjectV2ItemFieldDateValue";
      field: ProjectV2FieldBase;
      date: string | null;
    }
  | {
      __typename: "ProjectV2ItemFieldIterationValue";
      field: ProjectV2FieldBase;
      iterationId: string | null;
      title: string | null;
      duration: number | null;
      startDate: string | null;
    }
  | {
      __typename: "ProjectV2ItemFieldLabelValue";
      field: ProjectV2FieldBase;
      labels: {
        nodes: LabelSummary[];
      };
    }
  | {
      __typename: "ProjectV2ItemFieldMilestoneValue";
      field: ProjectV2FieldBase;
      milestone: MilestoneSummary | null;
    }
  | {
      __typename: "ProjectV2ItemFieldNumberValue";
      field: ProjectV2FieldBase;
      number: number | null;
    }
  | {
      __typename: "ProjectV2ItemFieldPullRequestValue";
      field: ProjectV2FieldBase;
      pullRequests: {
        nodes: ProjectV2PullRequest[];
      };
    }
  | {
      __typename: "ProjectV2ItemFieldRepositoryValue";
      field: ProjectV2FieldBase;
      repositories: {
        nodes: RepositorySummary[];
      };
    }
  | {
      __typename: "ProjectV2ItemFieldSingleSelectValue";
      field: ProjectV2FieldBase;
      optionId: string | null;
      name: string | null;
    }
  | {
      __typename: "ProjectV2ItemFieldTextValue";
      field: ProjectV2FieldBase;
      text: string | null;
    }
  | {
      __typename: "ProjectV2ItemFieldUserValue";
      field: ProjectV2FieldBase;
      users: {
        nodes: UserSummary[];
      };
    }
  | {
      __typename: string;
      field: ProjectV2FieldBase;
      [key: string]: unknown;
    };

/**
 * プロジェクトアイテム本体。
 */
export interface ProjectV2Item {
  id: string;
  type: string;
  createdAt: string;
  updatedAt: string;
  content: ProjectV2ItemContent;
  fieldValues: {
    nodes: ProjectV2ItemFieldValue[];
  };
}

/**
 * プロジェクト本体。
 */
export interface ProjectV2 {
  id: string;
  number: number;
  title: string;
  shortDescription: string | null;
  closed: boolean;
  closedAt: string | null;
  public: boolean;
  createdAt: string;
  updatedAt: string;
  url: string;
  owner: ProjectV2Owner | null;
  fields: Connection<ProjectV2Field>;
  items: Connection<ProjectV2Item>;
}

/**
 * 組織所有プロジェクトのクエリ結果。
 */
export interface OrganizationProjectV2Data {
  organization: {
    projectV2: ProjectV2 | null;
  } | null;
}

/**
 * ユーザー所有プロジェクトのクエリ結果。
 */
export interface UserProjectV2Data {
  user: {
    projectV2: ProjectV2 | null;
  } | null;
}

/**
 * 取得対象プロジェクトの所有者区分。
 */
export type ProjectOwnerType = GitHubProjectOwnerType;

/**
 * Projects v2 から取得したデータの集約結果。
 */
export interface ProjectData {
  ownerType: ProjectOwnerType;
  /**
   * 所有者のログイン名（組織またはユーザー）。
   */
  login: string;
  /**
   * 対象プロジェクト番号。
   */
  projectNumber: number;
  /**
   * GraphQL オプション（ページサイズなど）。再実行時の参考用に保持。
   */
  options: GitHubGraphQLOptions["pagination"] | undefined;
  /**
   * 取得したプロジェクト本体。存在しない場合は null。
   */
  project: ProjectV2 | null;
}
