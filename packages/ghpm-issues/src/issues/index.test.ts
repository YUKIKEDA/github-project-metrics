import { afterEach, describe, expect, it, vi } from 'vitest';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { GetAllIssuesLogger, OctokitLike } from './index.js';
import { getAllIssues } from './index.js';

const baseRepo = { owner: 'octocat', repo: 'hello-world' };

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '../../../../');

loadEnvFiles([resolve(projectRoot, '.env'), resolve(projectRoot, '.env.local')]);

type IssueListForRepoResponse = Awaited<ReturnType<OctokitLike['rest']['issues']['listForRepo']>>;

type IssueListForRepoItem = IssueListForRepoResponse['data'][number];

type LoggerMock = {
  [K in keyof GetAllIssuesLogger]: ReturnType<typeof vi.fn<(message: string) => void>>;
};

function createLogger(): GetAllIssuesLogger & LoggerMock {
  return {
    info: vi.fn<(message: string) => void>(),
    warning: vi.fn<(message: string) => void>(),
    error: vi.fn<(message: string) => void>(),
    debug: vi.fn<(message: string) => void>(),
  };
}

function createIssue(overrides: Partial<IssueListForRepoItem> = {}): IssueListForRepoItem {
  const issue = {
    number: 42,
    title: 'Sample Issue',
    state: 'open',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
    closed_at: null,
    user: { login: 'alice', id: 1 },
    assignees: [{ login: 'bob', id: 2 }],
    labels: [
      {
        id: 1,
        name: 'bug',
        color: 'ff0000',
        description: 'Bug label',
        url: '',
        node_id: '',
        default: false,
      },
    ],
    milestone: {
      title: 'v1.0',
      state: 'open',
      description: 'First milestone',
      due_on: '2024-02-01T00:00:00Z',
    },
    comments: 3,
    body: 'Issue body',
    pull_request: { url: 'https://example.com/pr/42' },
    draft: true,
    ...overrides,
  };

  return issue as unknown as IssueListForRepoItem;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('getAllIssues', () => {
  it('タイムラインイベントを取得して整形する', async () => {
    const issue = createIssue();

    const timelineEvents = [
      {
        id: 100,
        event: 'assigned',
        created_at: '2024-01-03T00:00:00Z',
        actor: { login: 'carol', id: 3 },
        assignee: { login: 'bob', id: 2 },
        label: {
          name: 'enhancement',
          color: '00ff00',
          description: 'Enhancement label',
        },
        requested_team: {
          id: 99,
          slug: 'team-slug',
          name: 'Team Name',
        },
        dismissed_review: {
          state: 'dismissed',
          review_id: 77,
          dismissal_message: 'Need more info',
          dismissal_commit_id: 'abc123',
        },
        milestone: { title: 'v1.0' },
        rename: { from: 'old', to: 'new' },
        lock_reason: 'resolved',
        project_card: {
          id: 555,
          url: 'https://example.com/project/card/555',
          project_url: 'https://example.com/project',
          project_id: 123,
          column_name: 'In Progress',
          previous_column_name: 'Backlog',
        },
      },
    ] as unknown as Awaited<
      ReturnType<OctokitLike['rest']['issues']['listEventsForTimeline']>
    >['data'];

    const listForRepo = vi.fn().mockResolvedValue({ data: [issue] } as unknown as IssueListForRepoResponse);
    const listEventsForTimeline = vi
      .fn()
      .mockImplementation(({ page }) =>
        page === 1
          ? Promise.resolve({ data: timelineEvents } as unknown as Awaited<
              ReturnType<OctokitLike['rest']['issues']['listEventsForTimeline']>
            >)
          : Promise.resolve({ data: [] } as unknown as Awaited<
              ReturnType<OctokitLike['rest']['issues']['listEventsForTimeline']>
            >),
      );
    const listEvents = vi.fn().mockResolvedValue({ data: [] } as unknown as Awaited<
      ReturnType<OctokitLike['rest']['issues']['listEvents']>
    >);

    const octokit: OctokitLike = {
      rest: {
        issues: {
          listForRepo: listForRepo as unknown as OctokitLike['rest']['issues']['listForRepo'],
          listEventsForTimeline: listEventsForTimeline as unknown as OctokitLike['rest']['issues']['listEventsForTimeline'],
          listEvents: listEvents as unknown as OctokitLike['rest']['issues']['listEvents'],
        },
      },
    };

    const logger = createLogger();

    const result = await getAllIssues({
      octokit,
      repo: baseRepo,
      logger,
      debugJson: false,
    });

    expect(result).toHaveLength(1);
    const [record] = result;
    expect(record.number).toBe(issue.number);
    expect(record.pull_request).toBe(true);
    expect(record.draft).toBe(true);
    expect(record.user).toEqual({ login: 'alice', id: 1 });
    expect(record.assignees).toEqual([{ login: 'bob', id: 2 }]);
    expect(record.labels).toEqual([
      {
        name: 'bug',
        color: 'ff0000',
        description: 'Bug label',
      },
    ]);
    expect(record.milestone).toEqual({
      title: 'v1.0',
      state: 'open',
      description: 'First milestone',
      due_on: '2024-02-01T00:00:00Z',
    });
    expect(record.projects).toEqual([]);
    expect(record.events).toHaveLength(1);
    expect(record.events[0]).toMatchObject({
      id: 100,
      event: 'assigned',
      actor: { login: 'carol', id: 3 },
      assignee: { login: 'bob', id: 2 },
      label: {
        name: 'enhancement',
        color: '00ff00',
        description: 'Enhancement label',
      },
      requested_team: {
        id: 99,
        slug: 'team-slug',
        name: 'Team Name',
      },
      dismissed_review: {
        state: 'dismissed',
        review_id: 77,
        dismissal_message: 'Need more info',
        dismissal_commit_id: 'abc123',
      },
      milestone: { title: 'v1.0' },
      rename: { from: 'old', to: 'new' },
      lock_reason: 'resolved',
      project_card: {
        id: 555,
        url: 'https://example.com/project/card/555',
        project_url: 'https://example.com/project',
        project_id: 123,
        column_name: 'In Progress',
        previous_column_name: 'Backlog',
      },
    });

    expect(listEvents).not.toHaveBeenCalled();
  });

  it('タイムライン取得に失敗した場合に listEvents へフォールバックする', async () => {
    const issue = createIssue({ number: 7, pull_request: undefined, draft: false });
    const timelineError = new Error('timeline failed');
    const fallbackEvents = [
      {
        id: 200,
        event: 'closed',
        created_at: '2024-01-04T00:00:00Z',
      },
    ] as unknown as Awaited<ReturnType<OctokitLike['rest']['issues']['listEvents']>>['data'];

    const listForRepo = vi.fn().mockResolvedValue({ data: [issue] } as unknown as IssueListForRepoResponse);
    const listEventsForTimeline = vi.fn().mockRejectedValue(timelineError);
    const listEvents = vi
      .fn()
      .mockImplementation(({ page }) =>
        page === 1
          ? Promise.resolve({ data: fallbackEvents } as unknown as Awaited<
              ReturnType<OctokitLike['rest']['issues']['listEvents']>
            >)
          : Promise.resolve({ data: [] } as unknown as Awaited<
              ReturnType<OctokitLike['rest']['issues']['listEvents']>
            >),
      );

    const octokit: OctokitLike = {
      rest: {
        issues: {
          listForRepo: listForRepo as unknown as OctokitLike['rest']['issues']['listForRepo'],
          listEventsForTimeline: listEventsForTimeline as unknown as OctokitLike['rest']['issues']['listEventsForTimeline'],
          listEvents: listEvents as unknown as OctokitLike['rest']['issues']['listEvents'],
        },
      },
    };

    const logger = createLogger();

    const result = await getAllIssues({
      octokit,
      repo: baseRepo,
      logger,
      debugJson: false,
    });

    expect(result).toHaveLength(1);
    const [record] = result;
    expect(record.events).toHaveLength(1);
    expect(record.events[0]).toMatchObject({ id: 200, event: 'closed' });
    expect(listEventsForTimeline).toHaveBeenCalled();
    expect(listEvents).toHaveBeenCalled();
    expect(logger.warning).toHaveBeenCalledWith(
      expect.stringContaining('timeline failed'),
    );
  });

  it('octokit が指定されていない場合にエラーを返す', async () => {
    const logger = createLogger();

    await expect(
      getAllIssues({
        repo: baseRepo,
        logger,
      }),
    ).rejects.toThrow(
      'GitHub トークンが指定されていません。options.token もしくは options.octokit を設定してください。',
    );

    expect(logger.error).toHaveBeenCalledWith(
      'GitHub トークンが指定されていません。options.token もしくは options.octokit を設定してください。',
    );
  });
});

describe('integration: GitHub API', () => {
  const token =
    process.env.GHPM_TEST_GITHUB_TOKEN ??
    process.env.GITHUB_TOKEN ??
    process.env.GITHUB_PERSONAL_ACCESS_TOKEN ??
    null;

  if (!token) {
    it.skip('環境変数に GitHub トークンが設定されている場合のみ実行', () => {
      // トークンがない場合はスキップ
    });
    return;
  }

  const logger = createLogger();
  const targetRepo = { owner: 'YUKIKEDA', repo: 'github-project-metrics' };

  it('実際のリポジトリから Issue を取得できる', async () => {
    const issues = await getAllIssues({
      repo: targetRepo,
      token,
      logger,
      debugJson: false,
    });

    expect(Array.isArray(issues)).toBe(true);
    expect(issues.every((issue) => typeof issue.number === 'number')).toBe(true);

    const firstIssue = issues[0];
    if (firstIssue) {
      expect(typeof firstIssue.title).toBe('string');
      expect(firstIssue.projects).toBeDefined();
      expect(Array.isArray(firstIssue.events)).toBe(true);
    }

    const outputDir = resolve(projectRoot, 'tmp', 'integration');
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }
    const outputPath = resolve(outputDir, 'issues.json');
    writeFileSync(outputPath, JSON.stringify(issues, null, 2), 'utf8');

    expect(logger.error).not.toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalled();
  });
});

function loadEnvFiles(paths: string[]): void {
  for (const filePath of paths) {
    if (!filePath || !existsSync(filePath)) {
      continue;
    }
    const content = readFileSync(filePath, 'utf8');
    const lines = content.split(/\r?\n/);
    for (const line of lines) {
      if (!line || line.trim().startsWith('#')) {
        continue;
      }
      const index = line.indexOf('=');
      if (index === -1) {
        continue;
      }
      const key = line.slice(0, index).trim();
      const value = line.slice(index + 1).trim();
      if (key && !(key in process.env)) {
        process.env[key] = value;
      }
    }
  }
}
