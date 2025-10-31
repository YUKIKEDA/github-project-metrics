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
   * Issueイベントのタイプ
   */
  type IssueEventType = 
    | "assigned"
    | "unassigned"
    | "labeled"
    | "unlabeled"
    | "milestoned"
    | "demilestoned"
    | "closed"
    | "reopened"
    | "referenced"
    | "renamed"
    | "locked"
    | "unlocked"
    | "head_ref_deleted"
    | "head_ref_restored"
    | "head_ref_force_pushed"
    | "base_ref_force_pushed"
    | "converted_note_to_issue"
    | "moved_columns_in_project"
    | "added_to_project"
    | "removed_from_project"
    | "review_requested"
    | "review_request_removed"
    | "ready_for_review"
    | "merged"
    | "deployed"
    | "connected"
    | "disconnected"
    | "subscribed"
    | "unsubscribed";

  /**
   * Issueイベント情報
   */
  interface IssueEvent {
    /** イベントID */
    id: number;
    /** イベントタイプ */
    event: IssueEventType;
    /** イベント作成日時（ISO 8601形式） */
    created_at: string;
    /** イベント作成者 */
    actor: User | null;
    /** アサイニーされたユーザー（assigned/unassignedイベントの場合） */
    assignee: User | null;
    /** 追加/削除されたラベル（labeled/unlabeledイベントの場合） */
    label: Label | null;
    /** 追加/削除されたマイルストーン（milestoned/demilestonedイベントの場合） */
    milestone: {
      /** マイルストーンタイトル */
      title: string;
    } | null;
    /** リネーム前のタイトル（renamedイベントの場合） */
    rename: {
      /** 変更前のタイトル */
      from: string;
      /** 変更後のタイトル */
      to: string;
    } | null;
    /** レビューリクエストされたユーザー（review_requested/review_request_removedイベントの場合） */
    requested_reviewer: User | null;
    /** レビューリクエストされたチーム（review_requested/review_request_removedイベントの場合） */
    requested_team: {
      /** チーム名 */
      name: string;
      /** チームID */
      id: number;
    } | null;
    /** コミットID（head_ref_force_pushed/base_ref_force_pushedイベントの場合） */
    commit_id: string | null;
    /** コミットURL（head_ref_force_pushed/base_ref_force_pushedイベントの場合） */
    commit_url: string | null;
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
    /** Issueイベントの配列（ステータス変更、ラベル変更、アサイニーなど） */
    events: IssueEvent[];
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
   * Projectのイテレーションフィールド値
   */
  interface ProjectIterationValue {
    /** イテレーションID */
    iterationId: string;
    /** イテレーションタイトル */
    title: string;
    /** 開始日時（ISO 8601形式） */
    startDate: string;
    /** 期間（日数） */
    duration: number;
  }

  /**
   * Projectのマイルストーンフィールド値
   */
  interface ProjectMilestoneValue {
    /** マイルストーンID */
    milestoneId: string;
    /** マイルストーンタイトル */
    title: string;
    /** マイルストーン説明 */
    description: string | null;
    /** 期日（ISO 8601形式） */
    dueDate: string | null;
  }

  /**
   * Projectのカスタムフィールド値
   */
  interface ProjectFieldValue {
    /** フィールド情報 */
    field: ProjectField | null;
    /** フィールド名（Status、Iteration、Start Date、End Date、Estimationなど） */
    fieldName: string;
    /** フィールド値（SingleSelectの場合は選択肢名、Textの場合はテキスト、Numberの場合は数値、Dateの場合は日時文字列） */
    value: string | number | null;
    /** イテレーションフィールド値（Iterationフィールドの場合） */
    iteration: ProjectIterationValue | null;
    /** マイルストーンフィールド値（Milestoneフィールドの場合） */
    milestone: ProjectMilestoneValue | null;
    /** ユーザーフィールド値（Userフィールドの場合） */
    users: ProjectItemAssignee[] | null;
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

