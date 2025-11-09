import {
  sampleCorrelation as ssSampleCorrelation,
  sampleRankCorrelation as ssSampleRankCorrelation,
  sampleCovariance as ssSampleCovariance,
} from 'simple-statistics';
import type { IssueMetricsRecord } from '../metrics/type';
import type {
  MetricKey,
  MetricCorrelationAnalysis,
  MetricCorrelationCell,
  MetricCorrelationMatrix,
} from './type';

const METRIC_KEYS: MetricKey[] = ['leadTime', 'cycleTime', 'reviewTime', 'commentCount', 'complexity', 'planVsActual'];

export interface CorrelationAnalysisOptions {
  /** 数値が欠落している指標は除外するかどうか。true の場合、片方が欠けているサンプルは無視する。 */
  omitMissing?: boolean;
}

const DEFAULT_OPTIONS: Required<CorrelationAnalysisOptions> = {
  omitMissing: true,
};

/**
 * Issue メトリクス集合から指標間の相関を算出する。
 *
 * @param metrics 相関分析の対象となる Issue メトリクス集合
 * @param options 欠損値の扱いなどオプション
 * @returns ピアソン・スピアマン両方の相関行列
 */
export function computeMetricCorrelation(
  metrics: Record<number, IssueMetricsRecord> | IssueMetricsRecord[],
  options?: CorrelationAnalysisOptions,
): MetricCorrelationAnalysis {
  const collection = Array.isArray(metrics) ? metrics : Object.values(metrics);
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };

  const metricValues = extractMetricVectors(collection, mergedOptions);

  const pearson = buildCorrelationMatrix(metricValues, 'pearson');
  const spearman = buildCorrelationMatrix(metricValues, 'spearman');

  return {
    pearson,
    spearman,
  };
}

/**
 * Issue メトリクスレコードから各指標の値ベクトルを抽出する。
 *
 * @param records メトリクスレコード配列
 * @param options 欠損値の扱い設定
 * @returns 指標キーごとの値ベクトル辞書
 */
function extractMetricVectors(
  records: IssueMetricsRecord[],
  options: Required<CorrelationAnalysisOptions>,
): Record<MetricKey, number[]> {
  const vectors: Record<MetricKey, number[]> = {
    leadTime: [],
    cycleTime: [],
    reviewTime: [],
    commentCount: [],
    complexity: [],
    planVsActual: [],
  };

  for (const record of records) {
    const snapshot: Partial<Record<MetricKey, number | null>> = {};

    for (const key of METRIC_KEYS) {
      const result = record.metrics[key];
      snapshot[key] = result?.status === 'success' ? result.value : null;
    }

    if (options.omitMissing && Object.values(snapshot).some((value) => value === null)) {
      continue;
    }

    for (const key of METRIC_KEYS) {
      const value = snapshot[key];
      if (value !== null && value !== undefined) {
        vectors[key].push(value);
      } else if (!options.omitMissing) {
        // 欠損を残す場合は NaN を入れて後で処理
        vectors[key].push(Number.NaN);
      }
    }
  }

  return vectors;
}

/**
 * 指標ベクトルから相関行列を組み立てる。
 *
 * @param vectors 指標ごとの値ベクトル
 * @param method 相関係数の種類（ピアソン or スピアマン）
 * @returns 行列およびサマリーを含む相関結果
 */
function buildCorrelationMatrix(
  vectors: Record<MetricKey, number[]>,
  method: 'pearson' | 'spearman',
): MetricCorrelationMatrix {
  const matrix: Record<MetricKey, Record<MetricKey, MetricCorrelationCell>> = {
    leadTime: {} as Record<MetricKey, MetricCorrelationCell>,
    cycleTime: {} as Record<MetricKey, MetricCorrelationCell>,
    reviewTime: {} as Record<MetricKey, MetricCorrelationCell>,
    commentCount: {} as Record<MetricKey, MetricCorrelationCell>,
    complexity: {} as Record<MetricKey, MetricCorrelationCell>,
    planVsActual: {} as Record<MetricKey, MetricCorrelationCell>,
  };
  const summary: MetricCorrelationCell[] = [];

  for (const keyA of METRIC_KEYS) {
    for (const keyB of METRIC_KEYS) {
      const cell = computeCorrelationCell(vectors[keyA], vectors[keyB], keyA, keyB, method);
      matrix[keyA][keyB] = cell;
      if (keyA !== keyB) {
        summary.push(cell);
      }
    }
  }

  return {
    method,
    summary,
    matrix,
  };
}

/**
 * 2 つの指標ベクトルから相関セルを算出する。
 *
 * @param vectorA 指標 A の値ベクトル
 * @param vectorB 指標 B の値ベクトル
 * @param keyA 指標 A のキー
 * @param keyB 指標 B のキー
 * @param method 相関係数種別
 * @returns 相関係数・サンプル数・共分散を含むセル情報
 */
function computeCorrelationCell(
  vectorA: number[],
  vectorB: number[],
  keyA: MetricKey,
  keyB: MetricKey,
  method: 'pearson' | 'spearman',
): MetricCorrelationCell {
  const samples = gatherPairedSamples(vectorA, vectorB);

  if (samples.length < 2) {
    return {
      metrics: [keyA, keyB],
      method,
      coefficient: null,
      sampleSize: samples.length,
      covariance: null,
    };
  }

  const valuesA = samples.map(([a]) => a);
  const valuesB = samples.map(([, b]) => b);

  const coefficient = method === 'pearson' ? pearsonCorrelation(valuesA, valuesB) : spearmanCorrelation(valuesA, valuesB);
  const covariance = sampleCovariance(valuesA, valuesB);

  return {
    metrics: [keyA, keyB],
    method,
    coefficient,
    sampleSize: samples.length,
    covariance,
  };
}

/**
 * 2 つのベクトルから NaN を除去したペアサンプルを作成する。
 *
 * @param vectorA 指標 A の値ベクトル
 * @param vectorB 指標 B の値ベクトル
 * @returns NaN を除外した (A, B) サンプルペアの配列
 */
function gatherPairedSamples(vectorA: number[], vectorB: number[]): Array<[number, number]> {
  const minLength = Math.min(vectorA.length, vectorB.length);
  const pairs: Array<[number, number]> = [];

  for (let i = 0; i < minLength; i += 1) {
    const a = vectorA[i];
    const b = vectorB[i];
    if (Number.isNaN(a) || Number.isNaN(b)) {
      continue;
    }
    pairs.push([a, b]);
  }

  return pairs;
}

/**
 * ピアソン相関係数を算出する。
 *
 * @param valuesA 指標 A の値ベクトル
 * @param valuesB 指標 B の値ベクトル
 * @returns 相関係数。標準偏差がゼロなど計算不能な場合は null
 */
function pearsonCorrelation(valuesA: number[], valuesB: number[]): number | null {
  const n = valuesA.length;
  if (n < 2) {
    return null;
  }

  const result = ssSampleCorrelation(valuesA, valuesB);
  return Number.isNaN(result) ? null : result;
}

/**
 * スピアマン順位相関係数を算出する。
 *
 * @param valuesA 指標 A の値ベクトル
 * @param valuesB 指標 B の値ベクトル
 * @returns 順位相関係数。標本数不足などで計算できなければ null
 */
function spearmanCorrelation(valuesA: number[], valuesB: number[]): number | null {
  const n = valuesA.length;
  if (n < 2) {
    return null;
  }

  const result = ssSampleRankCorrelation(valuesA, valuesB);
  return Number.isNaN(result) ? null : result;
}

/**
 * 標本共分散を算出する。
 *
 * @param valuesA 指標 A の値ベクトル
 * @param valuesB 指標 B の値ベクトル
 * @returns 標本共分散。標本数不足時は null
 */
function sampleCovariance(valuesA: number[], valuesB: number[]): number | null {
  const n = valuesA.length;
  if (n < 2) {
    return null;
  }

  const result = ssSampleCovariance(valuesA, valuesB);
  return Number.isNaN(result) ? null : result;
}
