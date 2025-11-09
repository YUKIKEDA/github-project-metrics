import type { IssueMetrics } from '../metrics/type';

/**
 * Issue メトリクスに対する記述統計結果の集合。
 */
export interface IssueMetricsStatistics {
  leadTime: MetricStatisticsResult;
  cycleTime: MetricStatisticsResult;
  reviewTime: MetricStatisticsResult;
  commentCount: MetricStatisticsResult;
  complexity: MetricStatisticsResult;
  planVsActual: MetricStatisticsResult;
}

/**
 * 単一メトリクスの記述統計結果。
 */
export interface MetricStatisticsResult {
  summary: DescriptiveSummary;
  distribution: DistributionDetails;
  outliers: OutlierDetails;
  samples: SampleDetails;
}

/**
 * 代表値・散布度に関する要約統計量。
 */
export interface DescriptiveSummary {
  count: number;
  mean: number | null;
  median: number | null;
  mode?: number | null;
  variance?: number | null;
  standardDeviation?: number | null;
  coefficientOfVariation?: number | null;
}

/**
 * 分布特性に関する詳細情報。
 */
export interface DistributionDetails {
  minimum: number | null;
  maximum: number | null;
  percentile10?: number | null;
  percentile25?: number | null;
  percentile75?: number | null;
  percentile90?: number | null;
  range?: number | null;
  interquartileRange?: number | null;
  skewness?: number | null;
  kurtosis?: number | null;
}

/**
 * 外れ値判定に関する情報。
 */
export interface OutlierDetails {
  iqr?: OutlierMethodResult;
  zscore?: OutlierMethodResult;
}

export interface OutlierMethodResult {
  detectedCount: number;
  threshold?: {
    lower?: number;
    upper?: number;
    zScore?: number;
  };
  indices?: number[];
}

/**
 * 元データに関する補足情報。
 */
export interface SampleDetails {
  values: number[];
  missingCount: number;
  minIndex?: number;
  maxIndex?: number;
}

/** Issue メトリクスのキー一覧。 */
export type MetricKey = keyof IssueMetrics;

/** 期間を表す開始・終了日時。 */
export interface TimeRange {
  start: string;
  end: string;
}

/** 単一メトリクスに対する異常検知の結果。 */
export interface MetricAnomalySummary {
  metric: MetricKey;
  isAnomaly: boolean;
  direction: 'increase' | 'decrease' | 'stable';
  reasons: string[];
  absoluteChange: number | null;
  relativeChange: number | null;
  zScore: number | null;
  baselineMean: number | null;
  recentMean: number | null;
  baselineMedian: number | null;
  recentMedian: number | null;
  baselineCount: number;
  recentCount: number;
  baselinePercentile25: number | null;
  recentPercentile25: number | null;
  baselinePercentile75: number | null;
  recentPercentile75: number | null;
  baselineIqr: number | null;
  recentIqr: number | null;
  baselineSkewness: number | null;
  recentSkewness: number | null;
  baselineKurtosis: number | null;
  recentKurtosis: number | null;
  baselineOutlierCount: number;
  recentOutlierCount: number;
}

/** 異常検知の集計結果。 */
export interface IssueMetricsAnomalyResult {
  recentRange: TimeRange;
  baselineRange: TimeRange;
  recentStatistics: IssueMetricsStatistics;
  baselineStatistics: IssueMetricsStatistics;
  metrics: Record<MetricKey, MetricAnomalySummary>;
}

/** 相関分析に関する型定義。 */
export interface MetricCorrelationCell {
  metrics: [MetricKey, MetricKey];
  method: 'pearson' | 'spearman';
  coefficient: number | null;
  sampleSize: number;
  covariance: number | null;
  significance?: {
    pValue?: number | null;
  };
}

export interface MetricCorrelationMatrix {
  method: 'pearson' | 'spearman';
  summary: MetricCorrelationCell[];
  matrix: Record<MetricKey, Record<MetricKey, MetricCorrelationCell>>;
}

export interface MetricCorrelationAnalysis {
  pearson: MetricCorrelationMatrix;
  spearman: MetricCorrelationMatrix;
}
