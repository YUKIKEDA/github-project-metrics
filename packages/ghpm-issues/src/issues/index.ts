//@ts-check

import { Octokit } from '@octokit/rest';

import type {
  IssueEvent,
  IssueEventDismissedReview,
  IssueEventProjectCard,
  Issues,
  IssueRecord,
  IssueProject,
  Label,
  Milestone,
  Team,
  User,
} from './type';

/**
 * GitHub Issue 情報取得時のロガー。
 */
export interface GetAllIssuesLogger {
  info(message: string): void;
  warning(message: string): void;
  error(message: string): void;
  debug(message: string): void;
}

/**
 * GitHub リポジトリの識別子。
 */
export interface GitHubRepositoryReference {
  owner: string;
  repo: string;
}

export type OctokitIssuesRestClient = Pick<
  Octokit['rest']['issues'],
  'listForRepo' | 'listEventsForTimeline' | 'listEvents'
>;

/**
 * Octokit の REST クライアント最小表現。
 */
export interface OctokitLike {
  rest: {
    issues: OctokitIssuesRestClient;
  };
}

/**
 * `getAllIssues` 実行時の依存オプション。
 */
export interface GetAllIssuesOptions {
  repo: GitHubRepositoryReference;
  token?: string;
  octokit?: OctokitLike;
  logger?: GetAllIssuesLogger;
  debugJson?: boolean;
}

const DEFAULT_PER_PAGE = 100;

type IssuesListForRepoData = Awaited<
  ReturnType<OctokitIssuesRestClient['listForRepo']>
>['data'];
type IssuesListForRepoItem = IssuesListForRepoData[number];

type IssuesListEventsForTimelineData = Awaited<
  ReturnType<OctokitIssuesRestClient['listEventsForTimeline']>
>['data'];
type IssuesListEventsForTimelineItem = IssuesListEventsForTimelineData[number];

type IssuesListEventsData = Awaited<
  ReturnType<OctokitIssuesRestClient['listEvents']>
>['data'];
type IssuesListEventsItem = IssuesListEventsData[number];

type ApiIssueEvent = IssuesListEventsForTimelineItem | IssuesListEventsItem;

/**
 * GitHub リポジトリの Issue (PR を含む) を取得するメイン関数。
 */
export async function getAllIssues(options: GetAllIssuesOptions): Promise<Issues> {
  const { repo, octokit: providedOctokit, token, logger: providedLogger, debugJson = false } = options;

  const info = providedLogger?.info ?? console.log;
  const warning = providedLogger?.warning ?? console.warn;
  const error = providedLogger?.error ?? console.error;
  const debug = providedLogger?.debug ?? console.debug;

  const logger: GetAllIssuesLogger = {
    info: (message: string) => info(message),
    warning: (message: string) => warning(message),
    error: (message: string) => error(message),
    debug: (message: string) => debug(message),
  };

  const octokit = providedOctokit ?? createOctokit(token, logger);

  logger.info(`リポジトリ ${repo.owner}/${repo.repo} のIssueを取得中...`);

  const issues = await fetchAllIssues(octokit, repo, logger);
  logger.info(`合計 ${issues.length}件のIssueを取得しました`);

  logger.info('各Issueのイベントを取得中...');
  const issuesWithEvents = await Promise.all(
    issues.map(async (issue) => {
      const events = await fetchIssueEvents(octokit, repo, issue.number, logger);
      return formatIssue(issue, events);
    }),
  );
  logger.info('イベント取得が完了しました');

  if (debugJson) {
    logger.info('=== Issueデータ（整形済み） ===');
    logger.info(JSON.stringify(issuesWithEvents, null, 2));
  }

  logSummary(issuesWithEvents, logger);

  return issuesWithEvents;
}

async function fetchAllIssues(
  octokit: OctokitLike,
  repo: GitHubRepositoryReference,
  logger: GetAllIssuesLogger,
): Promise<IssuesListForRepoItem[]> {
  const allIssues: IssuesListForRepoItem[] = [];
  let page = 1;

  while (true) {
    const response = await octokit.rest.issues.listForRepo({
      owner: repo.owner,
      repo: repo.repo,
      state: 'all',
      per_page: DEFAULT_PER_PAGE,
      page,
      sort: 'created',
      direction: 'desc',
    });
    const issues = Array.isArray(response.data) ? response.data : [];

    logger.info(`ページ ${page}: ${issues.length}件のIssueを取得しました`);
    allIssues.push(...issues);

    if (issues.length < DEFAULT_PER_PAGE) {
      break;
    }

    page += 1;
  }

  return allIssues;
}

async function fetchIssueEvents(
  octokit: OctokitLike,
  repo: GitHubRepositoryReference,
  issueNumber: number,
  logger: GetAllIssuesLogger,
): Promise<ApiIssueEvent[]> {
  const eventsPerPage = DEFAULT_PER_PAGE;

  const fetchWithPagination = async <T>(
    fetcher: (page: number) => Promise<{ data: T[] }>,
  ): Promise<T[]> => {
    const aggregated: T[] = [];
    let page = 1;
    while (true) {
      const response = await fetcher(page);
      const events = Array.isArray(response.data) ? response.data : [];
      if (events.length === 0) {
        break;
      }
      aggregated.push(...events);
      if (events.length < eventsPerPage) {
        break;
      }
      page += 1;
    }
    return aggregated;
  };

  try {
    const timelineEvents = await fetchWithPagination<IssuesListEventsForTimelineItem>((page) =>
      octokit.rest.issues.listEventsForTimeline({
        owner: repo.owner,
        repo: repo.repo,
        issue_number: issueNumber,
        per_page: eventsPerPage,
        page,
        mediaType: {
          previews: ['mockingbird'],
        },
      }),
    );

    if (timelineEvents.length > 0) {
      logger.info(`Issue #${issueNumber}: ${timelineEvents.length}件のイベントを取得しました`);
    }

    return timelineEvents;
  } catch (error) {
    logger.warning(
      `Issue #${issueNumber} のタイムラインイベント取得に失敗: ${
        error instanceof Error ? error.message : String(error)
      }. listEventsで再試行します。`,
    );
  }

  const events = await fetchWithPagination<IssuesListEventsItem>((page) =>
    octokit.rest.issues.listEvents({
      owner: repo.owner,
      repo: repo.repo,
      issue_number: issueNumber,
      per_page: eventsPerPage,
      page,
    }),
  );

  if (events.length > 0) {
    logger.info(`Issue #${issueNumber}: ${events.length}件のイベントを取得しました (listEvents)`);
  }

  return events;
}

function formatIssue(issue: IssuesListForRepoItem, events: ApiIssueEvent[]): IssueRecord {
  const assignees = Array.isArray(issue.assignees)
    ? issue.assignees.map((assignee) => formatUser(assignee))
    : null;

  return {
    number: issue.number,
    title: issue.title,
    state: issue.state as IssueRecord['state'],
    created_at: issue.created_at,
    updated_at: issue.updated_at,
    closed_at: issue.closed_at ?? null,
    user: formatUser(issue.user),
    assignees,
    labels: Array.isArray(issue.labels)
      ? issue.labels
          .map((rawLabel) => formatLabel(rawLabel))
          .filter((label): label is Label => label !== null)
      : [],
    milestone: issue.milestone ? formatMilestone(issue.milestone) : null,
    comments: issue.comments ?? 0,
    body: issue.body ?? null,
    pull_request: Boolean(issue.pull_request),
    draft: Boolean((issue as { draft?: boolean }).draft),
    events: events.map((event) => formatEvent(event)),
    projects: [] as IssueProject[],
  };
}

function formatUser(user: unknown): User | null {
  if (!user || typeof user !== 'object') {
    return null;
  }
  const record = user as Record<string, unknown>;
  if (typeof record.login !== 'string' || typeof record.id !== 'number') {
    return null;
  }
  return {
    login: record.login,
    id: record.id,
  };
}

function formatLabel(label: unknown): Label | null {
  if (label == null) {
    return null;
  }
  if (typeof label === 'string') {
    return {
      name: label,
      color: '',
      description: null,
    };
  }
  if (typeof label !== 'object') {
    return null;
  }
  const record = label as Record<string, unknown>;
  return {
    name: typeof record.name === 'string' ? record.name : '',
    color: typeof record.color === 'string' ? record.color : '',
    description: typeof record.description === 'string' ? record.description : null,
  };
}

function formatMilestone(milestone: unknown): Milestone {
  if (!milestone || typeof milestone !== 'object') {
    return {
      title: '',
    };
  }
  const record = milestone as Record<string, unknown>;
  return {
    title: typeof record.title === 'string' ? record.title : '',
    state: typeof record.state === 'string' ? (record.state as Milestone['state']) : undefined,
    description: typeof record.description === 'string' ? record.description : null,
    due_on: typeof record.due_on === 'string' ? record.due_on : null,
  };
}

function formatEvent(event: ApiIssueEvent): IssueEvent {
  const record = event as Record<string, unknown>;
  const label = formatLabel(record.label);
  const assignee = formatUser(record.assignee);
  const assigner = formatUser(record.assigner);
  const reviewRequester = formatUser(record.review_requester);
  const requestedReviewer = formatUser(record.requested_reviewer);
  const requestedTeam = formatTeam(record.requested_team);
  const milestone = record.milestone && typeof record.milestone === 'object'
    ? { title: String((record.milestone as Record<string, unknown>).title ?? '') }
    : undefined;
  const rename = record.rename && typeof record.rename === 'object'
    ? {
        from: String((record.rename as Record<string, unknown>).from ?? ''),
        to: String((record.rename as Record<string, unknown>).to ?? ''),
      }
    : undefined;

  const formatted: IssueEvent = {
    id: typeof record.id === 'number' ? record.id : undefined,
    node_id: typeof record.node_id === 'string' ? record.node_id : undefined,
    url: typeof record.url === 'string' ? record.url : undefined,
    actor: formatUser(record.actor),
    event: (typeof record.event === 'string' ? record.event : '') as IssueEvent['event'],
    commit_id: typeof record.commit_id === 'string' ? record.commit_id : undefined,
    commit_url: typeof record.commit_url === 'string' ? record.commit_url : undefined,
    created_at: typeof record.created_at === 'string' ? record.created_at : undefined,
    label: label ?? undefined,
    assignee: assignee ?? undefined,
    assigner: assigner ?? undefined,
    review_requester: reviewRequester ?? undefined,
    requested_reviewer: requestedReviewer ?? undefined,
    requested_team: requestedTeam ?? undefined,
    dismissed_review: formatDismissedReview(record.dismissed_review),
    milestone,
    rename,
    lock_reason: typeof record.lock_reason === 'string' ? record.lock_reason : undefined,
    project_card: formatProjectCard(record.project_card),
  };

  return formatted;
}

function formatTeam(team: unknown): Team | null {
  if (!team || typeof team !== 'object') {
    return null;
  }
  const record = team as Record<string, unknown>;
  if (typeof record.id !== 'number' || typeof record.slug !== 'string') {
    return null;
  }
  return {
    id: record.id,
    slug: record.slug,
    name: typeof record.name === 'string' ? record.name : undefined,
  };
}

function formatDismissedReview(value: unknown): IssueEventDismissedReview | undefined {
  if (!value || typeof value !== 'object') {
    return undefined;
  }
  const record = value as Record<string, unknown>;
  if (typeof record.review_id !== 'number') {
    return undefined;
  }
  return {
    state: typeof record.state === 'string' ? record.state : '',
    review_id: record.review_id,
    dismissal_message:
      typeof record.dismissal_message === 'string' ? record.dismissal_message : null,
    dismissal_commit_id:
      typeof record.dismissal_commit_id === 'string' ? record.dismissal_commit_id : null,
  };
}

function formatProjectCard(value: unknown): IssueEventProjectCard | undefined {
  if (!value || typeof value !== 'object') {
    return undefined;
  }
  const record = value as Record<string, unknown>;
  if (typeof record.id !== 'number') {
    return undefined;
  }
  return {
    url: typeof record.url === 'string' ? record.url : '',
    id: record.id,
    project_url: typeof record.project_url === 'string' ? record.project_url : '',
    project_id: typeof record.project_id === 'number' ? record.project_id : 0,
    column_name: typeof record.column_name === 'string' ? record.column_name : '',
    previous_column_name:
      typeof record.previous_column_name === 'string' ? record.previous_column_name : null,
  };
}

function logSummary(issues: Issues, logger: GetAllIssuesLogger): void {
  const openIssues = issues.filter((issue) => issue.state === 'open').length;
  const closedIssues = issues.filter((issue) => issue.state === 'closed').length;
  const pullRequests = issues.filter((issue) => issue.pull_request).length;
  const issuesWithEventsCount = issues.filter((issue) => issue.events.length > 0).length;
  const totalEventCount = issues.reduce((sum, issue) => sum + issue.events.length, 0);

  logger.info('=== Issueサマリー ===');
  logger.info(`総数: ${issues.length}件`);
  logger.info(`オープン: ${openIssues}件`);
  logger.info(`クローズ: ${closedIssues}件`);
  logger.info(`プルリクエスト: ${pullRequests}件`);
  logger.info(`イベントがあるIssue: ${issuesWithEventsCount}件`);
  logger.info(`イベント総数: ${totalEventCount}件`);

  const eventTypeCounts = new Map<string, number>();
  for (const issue of issues) {
    for (const event of issue.events) {
      const key = event.event;
      eventTypeCounts.set(key, (eventTypeCounts.get(key) ?? 0) + 1);
    }
  }

  if (eventTypeCounts.size > 0) {
    logger.info('=== イベントタイプ別の集計 ===');
    for (const [eventType, count] of eventTypeCounts.entries()) {
      logger.info(`${eventType}: ${count}件`);
    }
  }
}

function createOctokit(token: string | undefined, logger: GetAllIssuesLogger): OctokitLike {
  if (!token) {
    const message = 'GitHub トークンが指定されていません。options.token もしくは options.octokit を設定してください。';
    logger.error(message);
    throw new Error(message);
  }
  return new Octokit({ auth: token }) as unknown as OctokitLike;
}
