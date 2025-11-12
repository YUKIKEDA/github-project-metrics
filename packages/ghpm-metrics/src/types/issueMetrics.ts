import { MetricData } from "./metricsData";

export interface IssueMetrics {
  issue: IssueItem;
  metrics: MetricData;
}

/**
 * 単一の Issue レコード。
 */
export interface IssueItem {
  number: number;
  title: string;
  state: IssueState;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  user: User;
  assignees: User[];
  labels: Label[];
  milestone: Milestone | null;
  comments: number;
  body: string | null;
  pull_request: boolean;
  draft: boolean;
  events: IssueEvent[];
  projects: IssueProject[];
}

/**
 * GitHub Issue の状態。未知の値も受け入れるため文字列拡張を許容。
 */
export type IssueState = 'open' | 'closed' | (string & {});

/**
 * GitHub ユーザーの最小表現。
 */
export interface User {
  login: string;
  id: number;
}

/**
 * Issue に付与されるラベル。
 */
export interface Label {
  name: string;
  color: string;
  description?: string | null;
}

/**
 * Issue に紐づくマイルストーン。
 */
export interface Milestone {
  title: string;
  state?: 'open' | 'closed' | (string & {});
  description?: string | null;
  due_on?: string | null;
}

/**
 * Issue のタイムラインイベント（REST Issue Events API に対応）。
 */
export interface IssueEvent {
  id?: number;
  node_id?: string;
  url?: string;
  actor?: User | null;
  event: IssueEventType;
  commit_id?: string | null;
  commit_url?: string | null;
  created_at?: string;
  label?: Label | null;
  assignee?: User | null;
  assigner?: User | null;
  review_requester?: User | null;
  requested_reviewer?: User | null;
  requested_team?: Team | null;
  dismissed_review?: IssueEventDismissedReview | null;
  milestone?: Milestone | null;
  project_card?: IssueEventProjectCard | null;
  rename?: IssueRename | null;
  lock_reason?: string | null;
}

/**
 * イベント種別。未知のイベントも受け入れるため文字列拡張を許容。
 */
export type IssueEventType =
  | 'added_to_project_v2'
  | 'assigned'
  | 'closed'
  | 'committed'
  | 'connected'
  | 'cross-referenced'
  | 'head_ref_deleted'
  | 'labeled'
  | 'merged'
  | 'parent_issue_added'
  | 'project_v2_item_status_changed'
  | 'removed_from_project_v2'
  | 'renamed'
  | 'sub_issue_added'
  | (string & {});

/**
 * レビュー依頼などで利用する Team 情報の抜粋。
 */
export interface Team {
  id: number;
  slug: string;
  name?: string;
}

/**
 * Project (classic) のカードに関するイベント詳細。
 */
export interface IssueEventProjectCard {
  url: string;
  id: number;
  project_url: string;
  project_id: number;
  column_name: string;
  previous_column_name?: string | null;
}

/**
 * Review dismissal イベントの詳細。
 */
export interface IssueEventDismissedReview {
  state: string;
  review_id: number;
  dismissal_message?: string | null;
  dismissal_commit_id?: string | null;
}

/**
 * Issue タイトル変更イベントの差分。
 */
export interface IssueRename {
  from: string;
  to: string;
}

/**
 * Issue が属する Project V2 の概要情報。
 */
export interface IssueProject {
  projectId: string;
  projectTitle: string;
  projectNumber: number;
  projectUrl: string;
  fieldValues: ProjectFieldValue[];
}

/**
 * Project V2 フィールド値の種別。
 */
export type ProjectFieldValue =
  | ProjectFieldValueSingleSelect
  | ProjectFieldValueText
  | ProjectFieldValueNumber
  | ProjectFieldValueDate
  | ProjectFieldValueIteration
  | ProjectFieldValueMilestone
  | ProjectFieldValueUsers
  | ProjectFieldValueLabel
  | ProjectFieldValuePullRequest
  | ProjectFieldValueRepository;


/**
 * Single Select フィールドの値。
 */
export interface ProjectFieldValueSingleSelect {
  field: ProjectFieldDefinition;
  fieldName: string;
  type: 'singleSelect';
  value: string | null;
}

/**
 * Text フィールドの値。
 */
export interface ProjectFieldValueText {
  field: ProjectFieldDefinition;
  fieldName: string;
  type: 'text';
  value: string | null;
}

/**
 * Number フィールドの値。
 */
export interface ProjectFieldValueNumber {
  field: ProjectFieldDefinition;
  fieldName: string;
  type: 'number';
  value: number | null;
}

/**
 * Date フィールドの値。
 */
export interface ProjectFieldValueDate {
  field: ProjectFieldDefinition;
  fieldName: string;
  type: 'date';
  value: string | null;
}

/**
 * Iteration フィールドの値。
 */
export interface ProjectFieldValueIteration {
  field: ProjectFieldDefinition;
  fieldName: string;
  type: 'iteration';
  value: null;
  iteration: {  
    iterationId: string;
    title: string;
    startDate: string;
    duration: number;
  };
}

/**
 * Milestone フィールドの値。
 */
export interface ProjectFieldValueMilestone {
  field: ProjectFieldDefinition;
  fieldName: string;
  type: 'milestone';
  value: null;
  milestone: {
    title: string;
    description?: string | null;
    dueOn?: string | null;
    state?: 'open' | 'closed' | (string & {});
  };
}

/**
 * Users フィールドの値。
 */
export interface ProjectFieldValueUsers {
  field: ProjectFieldDefinition;
  fieldName: string;
  type: 'users';
  value: null;
  users: {
    id: string;
    login: string;
  }[];
}

/**
 * Label フィールドの値。
 */
export interface ProjectFieldValueLabel {
  field: ProjectFieldDefinition;
  fieldName: string;
  type: 'label';
  value: null;
  labels: {
    id: string;
    name: string;
    color?: string | null;
  }[];
}

/**
 * PullRequest フィールドの値。
 */
export interface ProjectFieldValuePullRequest {
  field: ProjectFieldDefinition;
  fieldName: string;
  type: 'pullRequest';
  value: null;
  pullRequests: {
    id: string;
    number: number;
    title: string;
    url: string;
  }[];
}

/**
 * Repository フィールドの値。
 */
export interface ProjectFieldValueRepository {
  field: ProjectFieldDefinition;
  fieldName: string;
  type: 'repository';
  value: null;
  repositories: {
    id: string;
    nameWithOwner: string;
    url: string;
  }[];
}

/**
 * Project V2 フィールドの基本情報。
 */
export interface ProjectFieldDefinition {
  id: string;
  name: string;
}
