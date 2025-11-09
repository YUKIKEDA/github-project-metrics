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
    | "added_to_project"
    | "added_to_project_v2"
    | "assigned"
    | "base_ref_force_pushed"
    | "closed"
    | "connected"
    | "converted_note_to_issue"
    | "deployed"
    | "demilestoned"
    | "disconnected"
    | "head_ref_deleted"
    | "head_ref_force_pushed"
    | "head_ref_restored"
    | "labeled"
    | "locked"
    | "merged"
    | "milestoned"
    | "moved_columns_in_project"
    | "parent_issue_added"
    | "project_v2_item_status_changed"
    | "ready_for_review"
    | "referenced"
    | "removed_from_project"
    | "removed_from_project_v2"
    | "renamed"
    | "review_request_removed"
    | "review_requested"
    | "reopened"
    | "sub_issue_added"
    | "subscribed"
    | "unassigned"
    | "unlabeled"
    | "unlocked"
    | "unsubscribed";

  /**
   * Issueイベント情報
   */
  interface IssueEventProjectStatus {
    /** ステータス名 */
    name: string | null;
    /** ステータスタイプ（存在する場合） */
    type?: string | null;
    /** ステータスタイトル（存在する場合） */
    title?: string | null;
  }

  interface IssueEventProjectItem {
    /** Project Item ID */
    id: string | null;
    /** Project Node ID */
    project_node_id: string | null;
    /** 変更前のステータス */
    previous_status: IssueEventProjectStatus | null;
    /** 変更後のステータス */
    status: IssueEventProjectStatus | null;
  }

  interface IssueEventProjectCard {
    /** プロジェクトID */
    project_id: number | null;
    /** プロジェクトのNode ID */
    project_node_id: string | null;
    /** カラム名 */
    column_name: string | null;
    /** 変更前のカラム名 */
    previous_column_name?: string | null;
    /** カラムID */
    column_id?: number | null;
  }

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
    /** Project (classic) カード情報 */
    project_card: IssueEventProjectCard | null;
    /** Project (v2) アイテム情報 */
    project_item: IssueEventProjectItem | null;
    /** 追加の変更情報（イベント固有） */
    changes: Record<string, unknown> | null;
  }

  /**
   * Issueが属しているProject情報
   */
  interface IssueProject {
    /** Project ID */
    projectId: string;
    /** Projectタイトル */
    projectTitle: string;
    /** Project番号 */
    projectNumber: number;
    /** Project URL */
    projectUrl: string;
    /** このIssueのProject内でのカスタムフィールド値 */
    fieldValues: ProjectFieldValue[];
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
    /** このIssueが属しているProject情報の配列（複数のProjectに属している可能性がある） */
    projects: IssueProject[];
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
    id: string;
    /** マイルストーンタイトル */
    title: string;
    /** マイルストーン説明 */
    description: string | null;
    /** 期日（ISO 8601形式） */
    dueOn: string | null;
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

  /**
   * 記述統計量の型定義
   */
  interface DescriptiveStatsResult {
    count: number;
    mean: number;
    median: number;
    mode: number;
    std_dev: number;
    variance: number;
    min: number;
    max: number;
    q1: number;
    q3: number;
    p90: number;
    p95: number;
    iqr: number;
    cv: number;
    skewness: number;
    kurtosis: number;
  }

  /**
   * 外れ値情報
   */
  interface OutlierInfo {
    index: number;
    value: number;
    isOutlier: boolean;
    zScore: number;
    severity: 'critical' | 'high' | 'medium' | 'low';
  }

  /**
   * 相関分析の結果
   */
  interface CorrelationResult {
    r: number;
    rSquared: number;
    tStatistic: number;
    pValue: number;
    significant: boolean;
    strength: 'weak' | 'moderate' | 'strong';
    sampleSize: number;
  }

  /**
   * 相関分析の要因
   */
  interface TopFactor {
    factor: string;
    correlation: number;
    absCorrelation: number;
    pValue: number;
    strength: 'weak' | 'moderate' | 'strong';
    rSquared: number;
  }

  /**
   * メトリクス抽出結果
   */
  interface ExtractedMetrics {
    leadTimes: number[];
    cycleTimes: number[];
    reviewTimes: number[];
    complexities: number[];
    comments: number[];
    assignees: number[];
  }

  /**
   * パターンベース異常検知の結果
   */
  interface PatternAnomaly {
    type: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    metric: string;
    current: number;
    baseline?: number;
    threshold?: number;
    increase_pct?: number;
    std_deviations?: number;
    cv?: number;
    message: string;
  }

  /**
   * 異常検知結果
   */
  interface Anomalies {
    iqrOutliers: OutlierInfo[];
    zScoreOutliers: OutlierInfo[];
    patterns: PatternAnomaly[];
  }

  /**
   * 相関分析結果
   */
  interface Correlations {
    topFactors: {
      leadTime: TopFactor[];
      cycleTime: TopFactor[];
      reviewTime: TopFactor[];
      complexity: TopFactor[];
      comments: TopFactor[];
      assignees: TopFactor[];
    };
  }

  /**
   * 統計分析結果
   */
  interface StatisticalAnalysisResults {
    descriptive: {
      leadTime: DescriptiveStatsResult | null;
      cycleTime: DescriptiveStatsResult | null;
      reviewTime: DescriptiveStatsResult | null;
      complexity: DescriptiveStatsResult | null;
      comments: DescriptiveStatsResult | null;
      assignees: DescriptiveStatsResult | null;
    };
    anomalies: Anomalies;
    correlations: Correlations;
  }

}

export {};

