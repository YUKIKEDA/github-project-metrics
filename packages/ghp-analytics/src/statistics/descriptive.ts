import {
  mean as ssMean,
  median as ssMedian,
  modeFast as ssModeFast,
  sampleVariance as ssSampleVariance,
  sampleStandardDeviation as ssSampleStandardDeviation,
  sampleSkewness as ssSampleSkewness,
  sampleKurtosis as ssSampleKurtosis,
  quantileSorted as ssQuantileSorted,
  zScore as ssZScore,
} from 'simple-statistics';
import type { IssueMetricsRecord, MetricResult } from '../metrics/type';
import type { IssueMetricsStatistics, MetricKey, MetricStatisticsResult, OutlierMethodResult } from './type';


export interface DescriptiveStatisticsOptions {
  zScoreThreshold?: number;
  iqrMultiplier?: number;
}

const METRIC_KEYS: MetricKey[] = [
  'leadTime',
  'cycleTime',
  'reviewTime',
  'commentCount',
  'complexity',
  'planVsActual',
];

const DEFAULT_OPTIONS: Required<DescriptiveStatisticsOptions> = {
  zScoreThreshold: 3,
  iqrMultiplier: 1.5,
};

/**
 * Issue メトリクス集合から記述統計量一式を算出する。
 *
 * @param records Issue メトリクスレコード配列または辞書
 * @param options 外れ値検出を含む統計計算オプション
 * @returns 各メトリクスに対する統計結果
 * @returns 成功値配列と欠損数
 */
export function computeDescriptiveStatistics(
  records: IssueMetricsRecord[] | Record<number, IssueMetricsRecord>,
  options?: DescriptiveStatisticsOptions,
): IssueMetricsStatistics {
  const normalizedRecords = Array.isArray(records)
    ? records
    : Object.values(records);
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };

  const statistics = {} as IssueMetricsStatistics;

  for (const key of METRIC_KEYS) {
    const { values, missingCount } = collectMetricValues(normalizedRecords, key);
    statistics[key] = computeMetricStatistics(values, missingCount, mergedOptions);
  }

  return statistics;
}

/**
 * 指定メトリクスの成功値のみを収集し、欠損数とともに返す。
 *
 * @param records Issue メトリクスレコード配列
 * @param key 対象メトリクスキー
 * @returns `MetricStatisticsResult`
 */
function collectMetricValues(
  records: IssueMetricsRecord[],
  key: MetricKey,
): { values: number[]; missingCount: number } {
  const values: number[] = [];
  let missingCount = 0;

  for (const record of records) {
    const result = record.metrics[key] as MetricResult<number>;
    if (result?.status === 'success') {
      values.push(result.value);
    } else {
      missingCount += 1;
    }
  }

  return { values, missingCount };
}

/**
 * 値配列から summary/distribution/outliers/samples を構築する。
 *
 * @param values 計算対象の数値配列
 * @param missingCount 欠損値件数
 * @param options 外れ値検出に利用するオプション
 * @returns 平均値。計算不可の場合は null
 */
function computeMetricStatistics(
  values: number[],
  missingCount: number,
  options: Required<DescriptiveStatisticsOptions>,
): MetricStatisticsResult {
  const count = values.length;
  if (count === 0) {
    const outliers: MetricStatisticsResult['outliers'] = {
      iqr: createEmptyOutlierResult(),
      zscore: createEmptyOutlierResult({ zScore: options.zScoreThreshold }),
    };

    return {
      summary: {
        count: 0,
        mean: null,
        median: null,
      },
      distribution: {
        minimum: null,
        maximum: null,
        percentile10: null,
        percentile25: null,
        percentile75: null,
        percentile90: null,
      },
      outliers,
      samples: {
        values: [],
        missingCount,
      },
    };
  }

  const sortedValues = [...values].sort((a, b) => a - b);
  const mean = computeMean(values);
  const variance = computeSampleVariance(values, mean);
  const standardDeviation = computeStandardDeviation(values);
  const median = computeMedian(sortedValues);
  const mode = computeMode(values);

  const percentile10 = computePercentile(sortedValues, 10);
  const percentile25 = computePercentile(sortedValues, 25);
  const percentile75 = computePercentile(sortedValues, 75);
  const percentile90 = computePercentile(sortedValues, 90);

  const minimum = sortedValues[0];
  const maximum = sortedValues[sortedValues.length - 1];
  const range = maximum - minimum;
  const interquartileRange =
    percentile75 !== null && percentile25 !== null ? percentile75 - percentile25 : null;

  const skewness =
    standardDeviation !== null
      ? computeSkewness(values, mean, standardDeviation)
      : null;
  const kurtosis =
    standardDeviation !== null
      ? computeKurtosis(values, mean, standardDeviation)
      : null;
  const coefficientOfVariation =
    mean !== null && mean !== 0 && standardDeviation !== null
      ? standardDeviation / mean
      : null;

  const outliers = detectOutliers(values, {
    ...options,
    percentile25,
    percentile75,
    standardDeviation,
    mean,
  });

  const minIndex = values.reduce(
    (candidate, value, index) =>
      value < values[candidate] ? index : candidate,
    0,
  );
  const maxIndex = values.reduce(
    (candidate, value, index) =>
      value > values[candidate] ? index : candidate,
    0,
  );

  return {
    summary: {
      count,
      mean,
      median,
      mode,
      variance,
      standardDeviation,
      coefficientOfVariation,
    },
    distribution: {
      minimum,
      maximum,
      percentile10,
      percentile25,
      percentile75,
      percentile90,
      range,
      interquartileRange,
      skewness,
      kurtosis,
    },
    outliers,
    samples: {
      values,
      missingCount,
      minIndex,
      maxIndex,
    },
  };
}

/**
 * simple-statistics を用いて平均を算出する。
 *
 * @param values 対象値
 * @returns 平均値。計算不可の場合は null
 */
export function computeMean(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }

  return ssMean(values);
}

/**
 * simple-statistics を用いて標本分散を算出する。
 *
 * @param values 対象値
 * @param mean 既算出の平均値（長さチェックのために使用）
 * @returns 標本分散。計算不可の場合は null
 */
export function computeSampleVariance(values: number[], mean: number | null): number | null {
  if (values.length < 2 || mean === null) {
    return null;
  }

  return ssSampleVariance(values);
}

/**
 * simple-statistics を用いて標本標準偏差を算出する。
 *
 * @param values 対象値
 * @returns 標本標準偏差。計算不可の場合は null
 */
export function computeStandardDeviation(values: number[]): number | null {
  if (values.length < 2) {
    return null;
  }

  return ssSampleStandardDeviation(values);
}

/**
 * simple-statistics を用いて中央値を算出する。
 *
 * @param sortedValues 昇順ソート済みの値
 * @returns 中央値。計算不可の場合は null
 */
function computeMedian(sortedValues: number[]): number | null {
  if (sortedValues.length === 0) {
    return null;
  }

  return ssMedian(sortedValues);
}

/**
 * simple-statistics の modeFast を用いて最頻値を算出する。
 *
 * @param values 対象値
 * @returns 最頻値。計算不可の場合は null
 */
function computeMode(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }

  try {
    return ssModeFast(values);
  } catch {
    return null;
  }
}

/**
 * simple-statistics の quantileSorted を用いてパーセンタイル値を算出する。
 *
 * @param sortedValues 昇順ソート済みの値
 * @param percentile 0-100 のパーセンタイル
 * @returns 指定したパーセンタイル値。計算不可の場合は null
 */
function computePercentile(sortedValues: number[], percentile: number): number | null {
  if (sortedValues.length === 0) {
    return null;
  }

  if (percentile <= 0) {
    return sortedValues[0];
  }
  if (percentile >= 100) {
    return sortedValues[sortedValues.length - 1];
  }

  return ssQuantileSorted(sortedValues, percentile / 100);
}

function createEmptyOutlierResult(
  threshold?: OutlierMethodResult['threshold'],
): OutlierMethodResult {
  return {
    detectedCount: 0,
    ...(threshold ? { threshold } : {}),
  };
}

/**
 * simple-statistics を用いて標本歪度を算出する。
 *
 * @param values 対象値
 * @param mean 平均
 * @param standardDeviation 標準偏差
 * @returns 標本歪度。計算不可の場合は null
 */
function computeSkewness(
  values: number[],
  mean: number | null,
  standardDeviation: number | null,
): number | null {
  const n = values.length;
  if (n < 3 || mean === null || standardDeviation === null || standardDeviation === 0) {
    return null;
  }

  const skewness = ssSampleSkewness(values);
  return Number.isNaN(skewness) ? null : skewness;
}

/**
 * simple-statistics を用いて標本尖度を算出する。
 *
 * @param values 対象値
 * @param mean 平均
 * @param standardDeviation 標準偏差
 * @returns 標本尖度。計算不可の場合は null
 */
function computeKurtosis(
  values: number[],
  mean: number | null,
  standardDeviation: number | null,
): number | null {
  const n = values.length;
  if (n < 4 || mean === null || standardDeviation === null || standardDeviation === 0) {
    return null;
  }

  const kurtosis = ssSampleKurtosis(values);
  return Number.isNaN(kurtosis) ? null : kurtosis;
}

/**
 * オプションに応じて IQR/Z スコア外れ値判定を実行する。
 *
 * @param values 対象値
 * @param context 外れ値検出に必要な統計情報とオプション
 * @returns IQR/Zスコアごとの外れ値情報
 */
function detectOutliers(
  values: number[],
  context: Required<DescriptiveStatisticsOptions> & {
    percentile25: number | null;
    percentile75: number | null;
    standardDeviation: number | null;
    mean: number | null;
  },
): MetricStatisticsResult['outliers'] {
  const { iqrMultiplier, zScoreThreshold, percentile25, percentile75, standardDeviation, mean } = context;

  const iqrResult =
    percentile25 !== null && percentile75 !== null
      ? detectIqrOutliers(values, percentile25, percentile75, iqrMultiplier)
      : createEmptyOutlierResult();

  const zscoreResult =
    mean !== null && standardDeviation !== null && standardDeviation !== 0
      ? detectZScoreOutliers(values, mean, standardDeviation, zScoreThreshold)
      : createEmptyOutlierResult({ zScore: zScoreThreshold });

  return {
    iqr: iqrResult,
    zscore: zscoreResult,
  };
}

/**
 * IQR 法に基づき外れ値を判定する。
 *
 * @param values 対象値
 * @param q1 第1四分位数
 * @param q3 第3四分位数
 * @param multiplier IQR 係数
 * @returns IQR 判定の結果
 */
function detectIqrOutliers(
  values: number[],
  q1: number,
  q3: number,
  multiplier: number,
): OutlierMethodResult {
  const iqr = q3 - q1;
  if (iqr === 0) {
    return {
      detectedCount: 0,
      threshold: {
        lower: q1,
        upper: q3,
      },
    };
  }

  const lowerBound = q1 - multiplier * iqr;
  const upperBound = q3 + multiplier * iqr;

  const indices = values.reduce<number[]>((acc, value, index) => {
    if (value < lowerBound || value > upperBound) {
      acc.push(index);
    }
    return acc;
  }, []);

  return {
    detectedCount: indices.length,
    threshold: {
      lower: lowerBound,
      upper: upperBound,
    },
    indices: indices.length > 0 ? indices : undefined,
  };
}

/**
 * Z スコアに基づき外れ値を判定する。
 *
 * @param values 対象値
 * @param mean 平均
 * @param standardDeviation 標準偏差
 * @param threshold 判定閾値
 * @returns Z スコア判定の結果
 */
function detectZScoreOutliers(
  values: number[],
  mean: number,
  standardDeviation: number,
  threshold: number,
): OutlierMethodResult {
  if (standardDeviation === 0) {
    return {
      detectedCount: 0,
      threshold: {
        zScore: threshold,
      },
    };
  }

  const indices = values.reduce<number[]>((acc, value, index) => {
    const z = Math.abs(ssZScore(value, mean, standardDeviation));
    if (z > threshold) {
      acc.push(index);
    }
    return acc;
  }, []);

  return {
    detectedCount: indices.length,
    threshold: {
      zScore: threshold,
    },
    indices: indices.length > 0 ? indices : undefined,
  };
}

