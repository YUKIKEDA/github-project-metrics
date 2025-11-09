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
import jStat from 'jstat';

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
 * ※簡易版：最初のassignedイベントからクローズまで
 */
export function calculateCycleTime(issue: Issue): number | null {
  if (!issue.closed_at) return null;

  const assignedEvent = issue.events.find(e => e.event === 'assigned');
  if (!assignedEvent) {
    // assignedイベントがない場合はcreated_atから計算
    return calculateLeadTime(issue);
  }

  const started = new Date(assignedEvent.created_at);
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

/**
 * 各issueから全指標の値を抽出
 */
export function extractMetricValues(issues: Issue[]): {
  data: { [key in MetricKey]: number }[];
  validIndices: number[];
} {
  const data: { [key in MetricKey]: number }[] = [];
  const validIndices: number[] = [];

  issues.forEach((issue, index) => {
    const leadTime = calculateLeadTime(issue);
    const cycleTime = calculateCycleTime(issue);
    const reviewTime = calculateReviewTime(issue);
    const complexity = calculateComplexity(issue);
    const comments = issue.comments;
    const assignees = issue.assignees.length;

    // leadTimeとcycleTimeが計算できる（完了済み）issueのみ含める
    // reviewTimeはPR特有なのでnullでも許容（0として扱う）
    if (leadTime !== null && cycleTime !== null) {
      data.push({
        leadTime,
        cycleTime,
        reviewTime: reviewTime ?? 0, // reviewTimeがnullの場合は0
        complexity,
        comments,
        assignees,
      });
      validIndices.push(index);
    }
  });

  return { data, validIndices };
}

/**
 * 重回帰分析の結果
 */
export interface MultipleRegressionResult {
  coefficients: { variable: MetricKey | 'intercept'; coefficient: number; standardError: number; tValue: number; pValue: number }[];
  rSquared: number;
  adjustedRSquared: number;
  fStatistic: number;
  fPValue: number;
  usedExplanatoryMetrics: MetricKey[]; // 実際に使用された説明変数
}

/**
 * 重回帰分析を実行（最小二乗法）
 */
export function performMultipleRegression(
  issues: Issue[],
  targetMetric: MetricKey,
  explanatoryMetrics: MetricKey[]
): MultipleRegressionResult | null {
  const { data } = extractMetricValues(issues);

  console.log('重回帰分析デバッグ:', {
    targetMetric,
    explanatoryMetrics,
    dataLength: data.length,
    requiredSamples: explanatoryMetrics.length + 2,
  });

  if (data.length < explanatoryMetrics.length + 2) {
    // サンプル数が少なすぎる
    console.log('サンプル数不足');
    return null;
  }

  // 分散が0または極めて小さい変数を除外
  const filteredExplanatoryMetrics = explanatoryMetrics.filter(metric => {
    const values = data.map(d => d[metric]);
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;

    if (variance < 1e-10) {
      console.warn(`変数 ${metric} は分散が0または極めて小さいため除外されました (分散: ${variance})`);
      return false;
    }
    return true;
  });

  if (filteredExplanatoryMetrics.length === 0) {
    console.error('使用可能な説明変数がありません（すべての変数の分散が0）');
    return null;
  }

  console.log('使用する説明変数:', filteredExplanatoryMetrics);

  // 目的変数ベクトル y
  const y = data.map(d => d[targetMetric]);

  // 説明変数行列 X (切片項を含む)
  const X: number[][] = data.map(d => [
    1, // 切片項
    ...filteredExplanatoryMetrics.map(metric => d[metric]),
  ]);

  // 転置行列 X^T
  const XT = transpose(X);

  // X^T * X
  const XTX = matrixMultiply(XT, X);

  // (X^T * X)^-1
  const XTXInv = matrixInverse(XTX);
  if (!XTXInv) {
    console.error('逆行列の計算に失敗しました（多重共線性の可能性）', {
      XTX,
      targetMetric,
      filteredExplanatoryMetrics,
    });
    return null;
  }

  // X^T * y
  const XTy = XT.map(row => row.reduce((sum, val, i) => sum + val * y[i], 0));

  // β = (X^T * X)^-1 * X^T * y
  const beta = XTXInv.map(row => row.reduce((sum, val, i) => sum + val * XTy[i], 0));

  // 予測値
  const yPred = X.map(row => row.reduce((sum, val, i) => sum + val * beta[i], 0));

  // 残差
  const residuals = y.map((val, i) => val - yPred[i]);

  // SSE (Sum of Squared Errors)
  const SSE = residuals.reduce((sum, r) => sum + r * r, 0);

  // SST (Total Sum of Squares)
  const yMean = y.reduce((sum, val) => sum + val, 0) / y.length;
  const SST = y.reduce((sum, val) => sum + (val - yMean) ** 2, 0);

  // R^2
  const rSquared = 1 - SSE / SST;

  // 調整済みR^2
  const n = data.length;
  const k = filteredExplanatoryMetrics.length;
  const adjustedRSquared = 1 - ((1 - rSquared) * (n - 1)) / (n - k - 1);

  // MSE (Mean Squared Error)
  const MSE = SSE / (n - k - 1);

  // 標準誤差
  const standardErrors = XTXInv.map((row, i) => Math.sqrt(MSE * row[i]));

  // t値とp値
  const coefficients = beta.map((coef, i) => {
    const tValue = coef / standardErrors[i];
    const pValue = 2 * (1 - tDistributionCDF(Math.abs(tValue), n - k - 1));

    return {
      variable: i === 0 ? ('intercept' as const) : filteredExplanatoryMetrics[i - 1],
      coefficient: coef,
      standardError: standardErrors[i],
      tValue,
      pValue,
    };
  });

  // F統計量
  const MSR = (SST - SSE) / k;
  const fStatistic = MSR / MSE;
  const fPValue = 1 - fDistributionCDF(fStatistic, k, n - k - 1);

  return {
    coefficients,
    rSquared,
    adjustedRSquared,
    fStatistic,
    fPValue,
    usedExplanatoryMetrics: filteredExplanatoryMetrics,
  };
}

/**
 * 行列の転置
 */
function transpose(matrix: number[][]): number[][] {
  return matrix[0].map((_, colIndex) => matrix.map(row => row[colIndex]));
}

/**
 * 行列の積
 */
function matrixMultiply(a: number[][], b: number[][]): number[][] {
  const result: number[][] = [];
  for (let i = 0; i < a.length; i++) {
    result[i] = [];
    for (let j = 0; j < b[0].length; j++) {
      let sum = 0;
      for (let k = 0; k < a[0].length; k++) {
        sum += a[i][k] * b[k][j];
      }
      result[i][j] = sum;
    }
  }
  return result;
}

/**
 * 行列の逆行列（ガウス・ジョルダン法）
 */
function matrixInverse(matrix: number[][]): number[][] | null {
  const n = matrix.length;
  const augmented = matrix.map((row, i) => [...row, ...Array(n).fill(0).map((_, j) => (i === j ? 1 : 0))]);

  for (let i = 0; i < n; i++) {
    // ピボット選択
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(augmented[k][i]) > Math.abs(augmented[maxRow][i])) {
        maxRow = k;
      }
    }
    [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]];

    if (Math.abs(augmented[i][i]) < 1e-10) {
      return null; // 逆行列が存在しない
    }

    // 行の正規化
    const pivot = augmented[i][i];
    for (let j = 0; j < 2 * n; j++) {
      augmented[i][j] /= pivot;
    }

    // 他の行から引く
    for (let k = 0; k < n; k++) {
      if (k !== i) {
        const factor = augmented[k][i];
        for (let j = 0; j < 2 * n; j++) {
          augmented[k][j] -= factor * augmented[i][j];
        }
      }
    }
  }

  return augmented.map(row => row.slice(n));
}

/**
 * t分布の累積分布関数（jStatを使用）
 */
function tDistributionCDF(t: number, df: number): number {
  return jStat.studentt.cdf(t, df);
}

/**
 * F分布の累積分布関数（jStatを使用）
 */
function fDistributionCDF(f: number, d1: number, d2: number): number {
  return jStat.centralF.cdf(f, d1, d2);
}

