/**
 * GitHub Project Metrics - Type Definitions
 * 
 * IssueとProjectから取得したデータの型定義
 * 
 * これらの型定義は、@ts-checkが有効なJavaScriptファイルで使用できます。
 * JSDocコメントの@type注釈で型を参照するために、型はグローバルスコープに宣言されています。
 */

// グローバル名前空間に型を定義
declare global {
  /**
   * Issueの状態
   */
  type IssueState = "open" | "closed";

  /**
   * ユーザー情報
   */
  interface User {
    /** ユーザー名 */
    login: string;
    /** ユーザーID */
    id: number;
  }

  /**
   * ラベル情報
   */
  interface Label {
    /** ラベル名 */
    name: string;
    /** ラベルの色（16進数6桁）。設定されていない場合はnull */
    color: string | null;
  }

  /**
   * マイルストーン情報
   */
  interface Milestone {
    /** マイルストーンタイトル */
    title: string;
    /** マイルストーンの状態 */
    state: "open" | "closed";
  }

  /**
   * GitHubリポジトリから取得したIssue（プルリクエスト含む）のデータ型
   */
  interface Issue {
    /** Issue番号 */
    number: number;
    /** Issueタイトル */
    title: string;
    /** Issueの状態 */
    state: IssueState;
    /** 作成日時（ISO 8601形式） */
    created_at: string;
    /** 更新日時（ISO 8601形式） */
    updated_at: string;
    /** クローズ日時（ISO 8601形式）。クローズされていない場合はnull */
    closed_at: string | null;
    /** 作成者情報 */
    user: User | null;
    /** アサイニー情報の配列 */
    assignees: User[];
    /** ラベル情報の配列 */
    labels: Label[];
    /** マイルストーン情報 */
    milestone: Milestone | null;
    /** コメント数 */
    comments: number;
    /** Issue本文。本文がない場合はnull */
    body: string | null;
    /** プルリクエストかどうかのフラグ */
    pull_request: boolean;
    /** ドラフトかどうかのフラグ（プルリクエストの場合） */
    draft: boolean;
  }

  /**
   * Issueデータの配列
   */
  type Issues = Issue[];

  /**
   * Project内のアイテムタイプ
   */
  type ProjectItemType = "ISSUE" | "PULL_REQUEST" | "DRAFT_ISSUE";

  /**
   * Project内のアイテムコンテンツの状態
   */
  type ProjectItemContentState = "OPEN" | "CLOSED";

  /**
   * Project内のアイテムのアサイニー情報（GraphQL形式）
   */
  interface ProjectItemAssignee {
    /** ユーザーID */
    id: string;
    /** ユーザー名 */
    login: string;
  }

  /**
   * Project内のアイテムのラベル情報（GraphQL形式）
   */
  interface ProjectItemLabel {
    /** ラベルID */
    id: string;
    /** ラベル名 */
    name: string;
    /** ラベルの色（16進数6桁）。設定されていない場合はnull */
    color: string | null;
  }

  /**
   * Project内のアイテムのコンテンツ情報
   */
  interface ProjectItemContent {
    /** コンテンツID */
    id: string;
    /** Issue/PR番号。Draft Issueの場合はnull */
    number: number | null;
    /** タイトル */
    title: string;
    /** 状態（Issue/PRの場合）。Draft Issueの場合はnull */
    state: ProjectItemContentState | null;
    /** 作成日時（ISO 8601形式） */
    createdAt: string;
    /** 更新日時（ISO 8601形式） */
    updatedAt: string;
    /** クローズ日時（ISO 8601形式）。クローズされていない場合はnull */
    closedAt: string | null;
    /** URL（Issue/PRの場合）。Draft Issueの場合はnull */
    url: string | null;
    /** ドラフトかどうかのフラグ（Pull Requestの場合） */
    isDraft: boolean;
    /** アサイニー情報の配列 */
    assignees: ProjectItemAssignee[];
    /** ラベル情報の配列 */
    labels: ProjectItemLabel[];
    /** 本文（Draft Issueの場合）。Issue/PRの場合は通常null */
    body: string | null;
  }

  /**
   * Projectのカスタムフィールド情報
   */
  interface ProjectField {
    /** フィールドID */
    id: string;
    /** フィールド名 */
    name: string;
  }

  /**
   * Projectのカスタムフィールド値
   */
  interface ProjectFieldValue {
    /** フィールド情報 */
    field: ProjectField | null;
    /** フィールド値（SingleSelectの場合は選択肢名、Textの場合はテキスト、Numberの場合は数値、Dateの場合は日時文字列） */
    value: string | number | null;
  }

  /**
   * Project内のアイテム（タスク）
   */
  interface ProjectItem {
    /** Project Item ID */
    id: string;
    /** タスクタイプ */
    type: ProjectItemType;
    /** タスクの内容（Issue、Pull Request、Draft Issueの詳細情報） */
    content: ProjectItemContent | null;
    /** Projectのカスタムフィールド値の配列 */
    fieldValues: ProjectFieldValue[];
  }

  /**
   * GitHub Project（v2）のデータ型
   */
  interface Project {
    /** Project ID */
    id: string;
    /** Projectタイトル */
    title: string;
    /** Project番号 */
    number: number;
    /** Project URL */
    url: string;
    /** 作成日時（ISO 8601形式） */
    createdAt: string;
    /** 更新日時（ISO 8601形式） */
    updatedAt: string;
    /** クローズ日時（ISO 8601形式）。クローズされていない場合はnull */
    closedAt: string | null;
    /** 短い説明。設定されていない場合はnull */
    shortDescription: string | null;
    /** Project内のタスク（Issue、Pull Request、Draft Issue）の配列 */
    items: ProjectItem[];
    /** Project内のタスク総数 */
    totalItems: number;
  }

  /**
   * Projectデータの配列
   */
  type Projects = Project[];

  /**
   * Issueデータを保存するグローバル変数
   */
  var issuesData: Issue[] | undefined;
}

export {};

