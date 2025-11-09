import type { Issues, IssueRecord, IssueEvent, Label } from '../issues/type';
import type {
  IssueMetrics,
  MetricResult,
  LeadTimeDetails,
  CycleTimeDetails,
  ReviewTimeDetails,
  CommentCountDetails,
  ComplexityDetails,
  PlanVsActualDetails,
} from './type';


/** 作業中のステータスを示すキーワード群 */
const IN_PROGRESS_STATUS_KEYWORDS = ['in progress'];

/**
 * Issues 一覧から指標を算出し、Issue 番号をキーにしたマップとして返す。
 * @param issues issues.json から読み込んだ Issue 配列
 * @returns Issue 番号をキーとするメトリクスの辞書
 */
export function computeMetricsForIssues(issues: Issues): Record<number, IssueMetrics> {
  const result: Record<number, IssueMetrics> = {};
  for (const issue of issues) {
    result[issue.number] = computeIssueMetrics(issue);
  }
  return result;
}

/**
 * 単一 Issue の指標を算出する。
 * @param issue 対象の Issue レコード
 * @returns Issue の指標セット
 */
export function computeIssueMetrics(issue: IssueRecord): IssueMetrics {
  const leadTime = calculateLeadTime(issue);
  const cycleTime = calculateCycleTime(issue);
  const reviewTime = calculateReviewTime(issue);
  const commentCount = calculateCommentCount(issue);
  const complexity = calculateComplexity(issue);
  const planVsActual = calculatePlanVsActual(issue, leadTime);

  return {
    leadTime,
    cycleTime,
    reviewTime,
    commentCount,
    complexity,
    planVsActual,
  };
}

/**
 * Issue 作成～クローズまでのリードタイムを算出する。
 * @param issue 対象の Issue
 * @returns 成功時はリードタイム（時間）と詳細、失敗時は理由
 */
function calculateLeadTime(issue: IssueRecord): MetricResult<number, LeadTimeDetails> {
  const startedAt = parseDate(issue.created_at);
  const completedAt = parseDate(issue.closed_at ?? undefined);

  if (!startedAt) {
    return { status: 'failure', reason: 'created_at is missing or invalid' };
  }

  if (!completedAt) {
    return { status: 'failure', reason: 'closed_at is missing or invalid' };
  }

  const value = diffHours(startedAt, completedAt);

  return {
    status: 'success',
    value,
    details: {
      startedAt: issue.created_at,
      completedAt: issue.closed_at!,
    },
  };
}

/**
 * 作業開始イベント～クローズまでのサイクルタイムを算出する。
 * @param issue 対象の Issue
 * @returns 成功時はサイクルタイム（時間）と詳細、失敗時は理由
 */
function calculateCycleTime(issue: IssueRecord): MetricResult<number, CycleTimeDetails> {
  const startEvent = findWorkStartEvent(issue.events);

  const startDate = startEvent ? parseDate(startEvent.created_at) : parseDate(issue.created_at);
  const completedAt = parseDate(issue.closed_at ?? undefined);

  if (!startDate) {
    return { status: 'failure', reason: 'no start event found for cycle time' };
  }

  if (!completedAt) {
    return { status: 'failure', reason: 'closed_at is missing or invalid' };
  }

  const value = diffHours(startDate, completedAt);

  return {
    status: 'success',
    value,
    details: {
      startedAt: startEvent?.created_at ?? issue.created_at,
      completedAt: issue.closed_at!,
      startEvent: startEvent?.event ?? 'created',
      endEvent: 'closed',
    },
  };
}

/**
 * PR のレビュー開始からレビュー完了までの時間を算出する。
 * @param issue 対象の Issue（Pull Request）
 * @returns 成功時はレビュー時間（時間）と詳細、失敗時は理由
 */
function calculateReviewTime(issue: IssueRecord): MetricResult<number, ReviewTimeDetails> {
  if (!issue.pull_request) {
    return { status: 'failure', reason: 'issue is not a pull request' };
  }

  const startEvent = findEarliestEvent(issue.events, ['review_requested']);
  const endEvent = findLatestEvent(issue.events, ['review_request_removed', 'merged', 'closed']);

  const startDate = startEvent ? parseDate(startEvent.created_at) : undefined;
  const endDate = endEvent ? parseDate(endEvent.created_at) : parseDate(issue.closed_at ?? undefined);

  if (!startEvent || !startDate) {
    return { status: 'failure', reason: 'review_requested event not found' };
  }

  if (!endDate) {
    return { status: 'failure', reason: 'review completion date not found' };
  }

  const value = diffHours(startDate, endDate);

  return {
    status: 'success',
    value,
    details: {
      reviewRequestedAt: startEvent.created_at,
      reviewCompletedAt: endEvent?.created_at ?? issue.closed_at ?? undefined,
      pullRequestNumber: issue.number,
    },
  };
}

/**
 * コメント数を取得する。
 * @param issue 対象の Issue
 * @returns コメント件数と関連イベント情報
 */
function calculateCommentCount(issue: IssueRecord): MetricResult<number, CommentCountDetails> {
  return {
    status: 'success',
    value: issue.comments,
    details: {
      commentIds: undefined,
      includedEvents: issue.events
        ?.filter((event) => event.event === 'commented')
        .map((event) => event.event),
    },
  };
}

/**
 * 複雑度をラベル等から推定する。
 * @param issue 対象の Issue
 * @returns 成功時は複雑度の推定値、失敗時は理由
 */
function calculateComplexity(issue: IssueRecord): MetricResult<number, ComplexityDetails> {
  const complexityFromLabel = extractNumericFromLabels(issue.labels, ['complexity', 'complex']);
  if (complexityFromLabel) {
    return {
      status: 'success',
      value: complexityFromLabel.value,
      details: {
        basis: 'label',
        source: complexityFromLabel.label,
      },
    };
  }

  const estimateFromLabel = extractNumericFromLabels(issue.labels, ['estimate', 'estimation', 'story points', 'story-point', 'sp']);
  if (estimateFromLabel) {
    return {
      status: 'success',
      value: estimateFromLabel.value,
      details: {
        basis: 'estimate',
        source: estimateFromLabel.label,
      },
    };
  }

  return {
    status: 'failure',
    reason: 'no complexity-related label found',
    details: {
      basis: 'custom',
      source: undefined,
    },
  };
}

/**
 * 見積と実績（リードタイム）との差分を算出する。
 * @param issue 対象の Issue
 * @param leadTime 算出済みのリードタイム
 * @returns 成功時は予実差、失敗時は理由
 */
function calculatePlanVsActual(
  issue: IssueRecord,
  leadTime: MetricResult<number, LeadTimeDetails>,
): MetricResult<number, PlanVsActualDetails> {
  const estimate = extractNumericFromLabels(issue.labels, ['estimate', 'estimation', 'story points', 'story-point', 'sp']);

  if (!estimate) {
    return {
      status: 'failure',
      reason: 'no estimation label found',
    };
  }

  if (leadTime.status !== 'success') {
    return {
      status: 'failure',
      reason: 'lead time not available',
    };
  }

  const actual = leadTime.value;
  const estimated = estimate.value;
  const diff = actual - estimated;

  return {
    status: 'success',
    value: diff,
    details: {
      estimated,
      actual,
      unit: 'hours',
    },
  };
}

/**
 * 作業開始を示すイベントを特定する。
 * - Project V2 のステータス変更イベントで列名に In Progress 系キーワードが含まれるものを優先採用
 * - 該当しない場合は最も古い `assigned` イベントを採用
 * - 該当イベントが存在しない場合は undefined
 * @param events 対象イベント一覧
 * @returns 作業開始と見なせる最古のイベント
 */
function findWorkStartEvent(events: IssueEvent[] | undefined): IssueEvent | undefined {
  if (!events || events.length === 0) {
    return undefined;
  }

  const candidates = events.filter((event) => {
    if (event.event === 'project_v2_item_status_changed') {
      const column = event.project_card?.column_name ?? '';
      return IN_PROGRESS_STATUS_KEYWORDS.some((keyword) => column.toLowerCase().includes(keyword));
    }
    if (event.event === 'assigned') {
      return true;
    }
    return false;
  });

  if (candidates.length === 0) {
    return undefined;
  }

  return candidates.reduce((earliest, current) => {
    const earliestDate = parseDate(earliest.created_at ?? undefined);
    const currentDate = parseDate(current.created_at ?? undefined);
    if (!earliestDate) {
      return current;
    }
    if (!currentDate) {
      return earliest;
    }
    return currentDate < earliestDate ? current : earliest;
  });
}

/**
 * 指定した種類に一致するイベントのうち、最も早いものを取得する。
 * @param events 対象イベント一覧
 * @param kinds 対象とするイベント種別（大小区別なし）
 * @returns 条件に一致する最古のイベント
 */
function findEarliestEvent(events: IssueEvent[] | undefined, kinds: string[]): IssueEvent | undefined {
  if (!events || events.length === 0) {
    return undefined;
  }

  const lowerKinds = kinds.map((kind) => kind.toLowerCase());

  const matches = events.filter((event) => lowerKinds.includes(event.event.toLowerCase()));
  if (matches.length === 0) {
    return undefined;
  }

  return matches.reduce((earliest, current) => {
    const earliestDate = parseDate(earliest.created_at ?? undefined);
    const currentDate = parseDate(current.created_at ?? undefined);
    if (!earliestDate) {
      return current;
    }
    if (!currentDate) {
      return earliest;
    }
    return currentDate < earliestDate ? current : earliest;
  });
}

/**
 * 指定した種類に一致するイベントのうち、最も遅いものを取得する。
 * @param events 対象イベント一覧
 * @param kinds 対象とするイベント種別（大小区別なし）
 * @returns 条件に一致する最新のイベント
 */
function findLatestEvent(events: IssueEvent[] | undefined, kinds: string[]): IssueEvent | undefined {
  if (!events || events.length === 0) {
    return undefined;
  }

  const lowerKinds = kinds.map((kind) => kind.toLowerCase());

  const matches = events.filter((event) => lowerKinds.includes(event.event.toLowerCase()));
  if (matches.length === 0) {
    return undefined;
  }

  return matches.reduce((latest, current) => {
    const latestDate = parseDate(latest.created_at ?? undefined);
    const currentDate = parseDate(current.created_at ?? undefined);
    if (!latestDate) {
      return current;
    }
    if (!currentDate) {
      return latest;
    }
    return currentDate > latestDate ? current : latest;
  });
}

/**
 * ラベル名から数値を抽出する。
 * @param labels 解析対象のラベル一覧
 * @param keywords 数値抽出のためのキーワード群
 * @returns 抽出できた数値とラベル名、取得できなければ undefined
 */
function extractNumericFromLabels(labels: Label[] | undefined, keywords: string[]): {
  value: number;
  label: string;
} | undefined {
  if (!labels) {
    return undefined;
  }

  for (const label of labels) {
    const name = label.name;
    for (const keyword of keywords) {
      const pattern = new RegExp(`${keyword}[\s:=-]*([0-9]+(?:\.[0-9]+)?)`, 'i');
      const match = name.match(pattern);
      if (match) {
        const value = Number(match[1]);
        if (!Number.isNaN(value)) {
          return { value, label: name };
        }
      }
    }
  }

  return undefined;
}
