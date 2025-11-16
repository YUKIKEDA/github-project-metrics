import type {
  Issue,
  StatisticsData,
  MetricKey,
  KPIData,
  TimeSeriesDataPoint,
  SegmentData,
  PeriodOption,
  MetricInfo,
} from './types';

// メトリクス情報の定義
export const METRICS: Record<MetricKey, MetricInfo> = {
  leadTime: {
    key: 'leadTime',
    label: 'リードタイム',
    unit: '日',
    description: 'Issue作成からクローズまでの時間',
    interpretation: 'lower_better',
  },
  cycleTime: {
    key: 'cycleTime',
    label: 'サイクルタイム',
    unit: '日',
    description: '作業開始からクローズまでの時間',
    interpretation: 'lower_better',
  },
  reviewTime: {
    key: 'reviewTime',
    label: 'レビュー時間',
    unit: '日',
    description: 'PR作成からマージまでの時間',
    interpretation: 'lower_better',
  },
  complexity: {
    key: 'complexity',
    label: '複雑度',
    unit: '',
    description: 'Issueの複雑度（変更行数等から算出）',
    interpretation: 'neutral',
  },
  comments: {
    key: 'comments',
    label: 'コメント数',
    unit: '件',
    description: 'Issue/PRに対するコメント数',
    interpretation: 'neutral',
  },
  assignees: {
    key: 'assignees',
    label: '担当者数',
    unit: '人',
    description: 'Issueに割り当てられた担当者数',
    interpretation: 'neutral',
  },
};

// 期間オプション
export const PERIOD_OPTIONS: Record<PeriodOption, { label: string; days: number | null }> = {
  '14d': { label: '14日', days: 14 },
  '30d': { label: '30日', days: 30 },
  '90d': { label: '90日', days: 90 },
  all: { label: '全期間', days: null },
};

/**
 * リードタイムを計算（日数）
 */
export function calculateLeadTime(issue: Issue): number | null {
  if (!issue.closed_at) return null;
  const created = new Date(issue.created_at);
  const closed = new Date(issue.closed_at);
  return (closed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
}

/**
 * サイクルタイムを計算（日数）
 * ※簡易版：最初の「In Progress」ステータス遷移からクローズまで（なければassignedイベントを起点）
 */
export function calculateCycleTime(issue: Issue): number | null {
  if (!issue.closed_at) return null;

  const normalizeStatusName = (event: Issue['events'][number]): string | null => {
    const eventAny = event as any;
    const candidates: Array<string | null | undefined> = [
      eventAny.project_item?.status?.name,
      eventAny.project_item?.status?.title,
      eventAny.project_card?.column_name,
    ];

    if (eventAny.changes && typeof eventAny.changes === 'object') {
      const changesAny = eventAny.changes as Record<string, unknown>;
      const fieldValue = changesAny['field_value'] as any;
      const newStatus = changesAny['new_status'] as any;

      candidates.push(
        typeof newStatus?.name === 'string' ? newStatus.name : null,
        typeof newStatus?.title === 'string' ? newStatus.title : null,
        typeof fieldValue?.name === 'string' ? fieldValue.name : null,
        typeof fieldValue?.to === 'string' ? fieldValue.to : null,
        typeof fieldValue?.to?.name === 'string' ? fieldValue.to.name : null
      );
    }

    return candidates.find(name => typeof name === 'string' && name.trim().length > 0) ?? null;
  };

  const inProgressEvent = issue.events.find(event => {
    if (event.event !== 'project_v2_item_status_changed') return false;
    const statusName = normalizeStatusName(event);
    if (!statusName) return false;
    return statusName.trim().toLowerCase().includes('in progress');
  });

  if (!inProgressEvent) {
    const assignedEvent = issue.events.find(e => e.event === 'assigned');
    if (!assignedEvent) {
      // 該当イベントがない場合はリードタイムで代用
      return calculateLeadTime(issue);
    }
    const started = new Date(assignedEvent.created_at);
    const closed = new Date(issue.closed_at);
    return (closed.getTime() - started.getTime()) / (1000 * 60 * 60 * 24);
  }

  const started = new Date(inProgressEvent.created_at);
  const closed = new Date(issue.closed_at);
  return (closed.getTime() - started.getTime()) / (1000 * 60 * 60 * 24);
}

/**
 * レビュー時間を計算（PRの場合）
 * ※簡易版：PR作成からクローズまで
 */
export function calculateReviewTime(issue: Issue): number | null {
  if (!issue.pull_request || !issue.closed_at) return null;
  return calculateLeadTime(issue);
}

/**
 * 複雑度を計算（イベント数やコメント数から推定）
 */
export function calculateComplexity(issue: Issue): number {
  // 簡易版：ラベル数 + コメント数 + イベント数/10
  return issue.labels.length + issue.comments + Math.floor(issue.events.length / 10);
}

/**
 * 期間でフィルタリング
 */
export function filterIssuesByPeriod(issues: Issue[], period: PeriodOption, baseDate?: Date): Issue[] {
  if (period === 'all') return issues;

  const base = baseDate || new Date();
  const days = PERIOD_OPTIONS[period].days;
  if (!days) return issues;

  const cutoff = new Date(base);
  cutoff.setDate(cutoff.getDate() - days);

  return issues.filter(issue => {
    const date = issue.closed_at || issue.updated_at;
    return new Date(date) >= cutoff;
  });
}

/**
 * プロジェクトでフィルタリング
 */
export function filterIssuesByProject(issues: Issue[], projectId: string | null): Issue[] {
  if (!projectId || projectId === 'all') return issues;
  return issues.filter(issue =>
    issue.projects.some(p => p.projectId === projectId)
  );
}

/**
 * プロジェクトリストを抽出
 */
export function extractProjects(issues: Issue[]): Array<{ id: string; title: string }> {
  const projectMap = new Map<string, string>();

  issues.forEach(issue => {
    issue.projects.forEach(project => {
      if (!projectMap.has(project.projectId)) {
        projectMap.set(project.projectId, project.projectTitle);
      }
    });
  });

  return [
    { id: 'all', title: '全てのプロジェクト' },
    ...Array.from(projectMap.entries()).map(([id, title]) => ({ id, title })),
  ];
}

/**
 * KPIデータを計算
 */
export function calculateKPIData(
  issues: Issue[],
  statistics: StatisticsData | null,
  metric: MetricKey
): KPIData | null {
  if (!statistics || !statistics.descriptive[metric]) {
    return null;
  }

  const stats = statistics.descriptive[metric];
  if (!stats) return null;

  // 直近2週間と前2週間で比較
  const now = new Date();
  const twoWeeksAgo = new Date(now);
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
  const fourWeeksAgo = new Date(now);
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

  const currentPeriodIssues = issues.filter(issue => {
    const date = new Date(issue.closed_at || issue.updated_at);
    return date >= twoWeeksAgo && date <= now;
  });

  const previousPeriodIssues = issues.filter(issue => {
    const date = new Date(issue.closed_at || issue.updated_at);
    return date >= fourWeeksAgo && date < twoWeeksAgo;
  });

  // メトリック値を計算
  const getMetricValue = (issue: Issue): number | null => {
    switch (metric) {
      case 'leadTime':
        return calculateLeadTime(issue);
      case 'cycleTime':
        return calculateCycleTime(issue);
      case 'reviewTime':
        return calculateReviewTime(issue);
      case 'complexity':
        return calculateComplexity(issue);
      case 'comments':
        return issue.comments;
      case 'assignees':
        return issue.assignees.length;
      default:
        return null;
    }
  };

  const currentValues = currentPeriodIssues
    .map(getMetricValue)
    .filter((v): v is number => v !== null);
  const previousValues = previousPeriodIssues
    .map(getMetricValue)
    .filter((v): v is number => v !== null);

  const currentValue = currentValues.length > 0
    ? currentValues.reduce((a, b) => a + b, 0) / currentValues.length
    : stats.mean;

  const previousValue = previousValues.length > 0
    ? previousValues.reduce((a, b) => a + b, 0) / previousValues.length
    : stats.mean;

  const change = currentValue - previousValue;
  const changePercent = previousValue !== 0 ? (change / previousValue) * 100 : 0;

  // 異常パターンを抽出
  // camelCaseをsnake_caseに変換してマッチング (leadTime → lead_time)
  const metricSnakeCase = metric.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
  const anomalies = statistics.anomalies.patterns.filter(p =>
    p.metric.toLowerCase().includes(metricSnakeCase)
  );

  return {
    metric,
    currentValue,
    previousValue,
    change,
    changePercent,
    currentPeriod: `${twoWeeksAgo.toLocaleDateString('ja-JP')} 〜 ${now.toLocaleDateString('ja-JP')}`,
    previousPeriod: `${fourWeeksAgo.toLocaleDateString('ja-JP')} 〜 ${twoWeeksAgo.toLocaleDateString('ja-JP')}`,
    stats,
    anomalies,
  };
}

/**
 * スループットを計算（KPI用）
 */
export function calculateThroughput(issues: Issue[]): number {
  const now = new Date();
  const twoWeeksAgo = new Date(now);
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

  return issues.filter(issue => {
    if (!issue.closed_at) return false;
    const closedDate = new Date(issue.closed_at);
    return closedDate >= twoWeeksAgo && closedDate <= now;
  }).length;
}

/**
 * 時系列データを生成
 */
export function generateTimeSeriesData(
  issues: Issue[],
  metric: MetricKey,
  period: PeriodOption
): TimeSeriesDataPoint[] {
  const filteredIssues = filterIssuesByPeriod(issues, period);

  const dataPoints: TimeSeriesDataPoint[] = [];

  filteredIssues.forEach(issue => {
    const date = issue.closed_at || issue.updated_at;
    let value: number | null = null;

    switch (metric) {
      case 'leadTime':
        value = calculateLeadTime(issue);
        break;
      case 'cycleTime':
        value = calculateCycleTime(issue);
        break;
      case 'reviewTime':
        value = calculateReviewTime(issue);
        break;
      case 'complexity':
        value = calculateComplexity(issue);
        break;
      case 'comments':
        value = issue.comments;
        break;
      case 'assignees':
        value = issue.assignees.length;
        break;
    }

    if (value !== null) {
      dataPoints.push({
        date,
        value,
        issueNumber: issue.number,
      });
    }
  });

  // 日付順にソート
  return dataPoints.sort((a, b) =>
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
}

/**
 * セグメント別データを生成
 */
export function generateSegmentData(
  issues: Issue[],
  metric: MetricKey,
  segmentType: 'label' | 'assignee'
): SegmentData[] {
  const segmentMap = new Map<string, number[]>();

  issues.forEach(issue => {
    let segments: string[] = [];

    if (segmentType === 'label') {
      segments = issue.labels.map(l => l.name);
    } else if (segmentType === 'assignee') {
      segments = issue.assignees.map(a => a.login);
    }

    if (segments.length === 0) {
      segments = ['(未設定)'];
    }

    let value: number | null = null;
    switch (metric) {
      case 'leadTime':
        value = calculateLeadTime(issue);
        break;
      case 'cycleTime':
        value = calculateCycleTime(issue);
        break;
      case 'reviewTime':
        value = calculateReviewTime(issue);
        break;
      case 'complexity':
        value = calculateComplexity(issue);
        break;
      case 'comments':
        value = issue.comments;
        break;
      case 'assignees':
        value = issue.assignees.length;
        break;
    }

    if (value !== null) {
      segments.forEach(segment => {
        if (!segmentMap.has(segment)) {
          segmentMap.set(segment, []);
        }
        segmentMap.get(segment)!.push(value);
      });
    }
  });

  const result: SegmentData[] = [];

  segmentMap.forEach((values, segment) => {
    if (values.length === 0) return;

    const sorted = [...values].sort((a, b) => a - b);
    const sum = values.reduce((a, b) => a + b, 0);
    const mean = sum / values.length;
    const median = sorted[Math.floor(sorted.length / 2)];
    const p90Index = Math.floor(sorted.length * 0.9);
    const p90 = sorted[p90Index];

    result.push({
      segment,
      count: values.length,
      mean,
      median,
      p90,
    });
  });

  // 件数順にソート
  return result.sort((a, b) => b.count - a.count);
}

/**
 * 日付のフォーマット
 */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * 数値のフォーマット（小数点以下1桁）
 */
export function formatNumber(value: number): string {
  return value.toFixed(1);
}

/**
 * パーセンテージのフォーマット
 */
export function formatPercent(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}
