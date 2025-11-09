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
