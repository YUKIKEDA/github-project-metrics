// Statistics.json types
export interface DescriptiveStatsResult {
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

export interface OutlierInfo {
  index: number;
  value: number;
  isOutlier: boolean;
  zScore: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

export interface PatternAnomaly {
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

export interface Anomalies {
  iqrOutliers: OutlierInfo[];
  zScoreOutliers: OutlierInfo[];
  patterns: PatternAnomaly[];
}

export interface TopFactor {
  factor: string;
  correlation: number;
  absCorrelation: number;
  pValue: number;
  strength: 'weak' | 'moderate' | 'strong';
  rSquared: number;
}

export interface Correlations {
  topFactors: {
    leadTime: TopFactor[];
    cycleTime: TopFactor[];
    reviewTime: TopFactor[];
    complexity: TopFactor[];
    comments: TopFactor[];
    assignees: TopFactor[];
  };
}

export interface StatisticsData {
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

// Issues.json types
export interface User {
  login: string;
  id: number;
}

export interface Label {
  name: string;
  color: string | null;
}

export interface Milestone {
  title: string;
  state: 'open' | 'closed';
}

export interface IssueEvent {
  id: number;
  event: string;
  created_at: string;
  actor: User | null;
  [key: string]: unknown;
}

export interface ProjectFieldValue {
  field: {
    id: string;
    name: string;
  } | null;
  fieldName: string;
  value: string | number | null;
  iteration?: {
    iterationId: string;
    title: string;
    startDate: string;
    duration: number;
  } | null;
  milestone?: {
    id: string;
    title: string;
    description: string | null;
    dueOn: string | null;
  } | null;
  users?: User[] | null;
}

export interface IssueProject {
  projectId: string;
  projectTitle: string;
  projectNumber: number;
  projectUrl: string;
  fieldValues: ProjectFieldValue[];
}

export interface Issue {
  number: number;
  title: string;
  state: 'open' | 'closed';
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  user: User | null;
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

// Metric types
export type MetricKey = 'leadTime' | 'cycleTime' | 'reviewTime' | 'complexity' | 'comments' | 'assignees';

export interface MetricInfo {
  key: MetricKey;
  label: string;
  unit: string;
  description: string;
  interpretation: 'lower_better' | 'higher_better' | 'neutral';
}

// KPI Card types
export interface KPIData {
  metric: MetricKey;
  currentValue: number;
  previousValue: number;
  change: number;
  changePercent: number;
  currentPeriod: string;
  previousPeriod: string;
  stats: DescriptiveStatsResult | null;
  anomalies: PatternAnomaly[];
}

// Period types
export type PeriodOption = '14d' | '30d' | '90d' | 'all';

export interface PeriodInfo {
  value: PeriodOption;
  label: string;
  days: number | null;
}

// Tab types
export type TabKey = 'trend' | 'distribution' | 'correlation' | 'segment' | 'regression';

// Chart types for distribution analysis
export type DistributionChartType = 'histogram' | 'boxplot';

// Chart types for correlation analysis
export type CorrelationChartType = 'scatter' | 'heatmap';

// Segment types
export type SegmentType = 'label' | 'assignee';

// Processed data for charts
export interface TimeSeriesDataPoint {
  date: string;
  value: number;
  issueNumber?: number;
}

export interface SegmentData {
  segment: string;
  count: number;
  mean: number;
  median: number;
  p90: number;
}
