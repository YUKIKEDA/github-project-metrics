/**
 * 指定期間でメトリクス統計を比較し、異常を検知するユーティリティ群。
 */
import type { IssueMetricsRecord } from '../metrics/type';
import { filterMetricsByDateRange } from '../metrics/metric';
import { computeDescriptiveStatistics, DescriptiveStatisticsOptions } from './descriptive';
import type {
  IssueMetricsAnomalyResult,
  IssueMetricsStatistics,
  MetricAnomalySummary,
  MetricKey,
  MetricStatisticsResult,
} from './type';

const METRIC_KEYS: MetricKey[] = ['leadTime', 'cycleTime', 'reviewTime', 'commentCount', 'complexity', 'planVsActual'];

const DEFAULT_Z_SCORE_THRESHOLD = 2;
const DEFAULT_RELATIVE_CHANGE_THRESHOLD = 0.3;
const DEFAULT_BASELINE_MIN_COUNT = 5;
const DEFAULT_RECENT_MIN_COUNT = 3;

export interface AnomalyDetectionOptions {
  /** 直近期間の日数（例: 7 日間） */
  recentDays: number;
  /** 比較（ベースライン）期間の日数（例: 30 日間） */
  baselineDays: number;
  /** ベースライン期間と直近期間の間に挟むバッファ日数。デフォルト 0 日。 */
  baselineGapDays?: number;
  /** 異常判定の基準日。指定がなければ現在日時を利用。 */
  referenceDate?: string | Date;
  /** 相対変化率で異常判定を行う際のしきい値。 */
  relativeChangeThreshold?: number;
  /** Z スコアで異常判定を行う際のしきい値。 */
  zScoreThreshold?: number;
  /** ベースライン期間で必要とする最小サンプル数。 */
  minBaselineSampleSize?: number;
  /** 直近期間で必要とする最小サンプル数。 */
  minRecentSampleSize?: number;
  /** 記述統計量算出時のオプション。 */
  descriptiveOptions?: DescriptiveStatisticsOptions;
}

/**
 * Issue メトリクス群に対して直近期間とベースライン期間の統計を比較し、異常を検知する。
 *
 * @param metrics 対象となる Issue メトリクス集合（配列もしくは辞書）
 * @param options 直近・比較期間などの検知パラメータ
 * @returns 異常検知結果（期間情報・統計・指標別サマリーを含む）
 */
export function detectMetricAnomalies(
  metrics: Record<number, IssueMetricsRecord> | IssueMetricsRecord[],
  options: AnomalyDetectionOptions,
): IssueMetricsAnomalyResult {
  validateOptions(options);

  const referenceDate = normalizeReferenceDate(options.referenceDate);
  const recentRange = computeRecentRange(referenceDate, options.recentDays);
  const baselineRange = computeBaselineRange(recentRange.start, options.baselineDays, options.baselineGapDays ?? 0);

  const recentMetrics = filterMetricsByDateRange(metrics, recentRange.start, recentRange.end);
  const baselineMetrics = filterMetricsByDateRange(metrics, baselineRange.start, baselineRange.end);

  const recentStatistics = computeDescriptiveStatistics(recentMetrics, options.descriptiveOptions);
  const baselineStatistics = computeDescriptiveStatistics(baselineMetrics, options.descriptiveOptions);

  const anomalySummaries = computeAnomalySummaries(recentStatistics, baselineStatistics, {
    zScoreThreshold: options.zScoreThreshold ?? DEFAULT_Z_SCORE_THRESHOLD,
    relativeChangeThreshold: options.relativeChangeThreshold ?? DEFAULT_RELATIVE_CHANGE_THRESHOLD,
    minBaselineSampleSize: options.minBaselineSampleSize ?? DEFAULT_BASELINE_MIN_COUNT,
    minRecentSampleSize: options.minRecentSampleSize ?? DEFAULT_RECENT_MIN_COUNT,
  });

  return {
    recentRange,
    baselineRange,
    recentStatistics,
    baselineStatistics,
    metrics: anomalySummaries,
  };
}

/**
 * 直近期間とベースライン期間の統計量セットを比較し、メトリクスごとの異常サマリーを生成する。
 *
 * @param recent 直近期間の統計量
 * @param baseline ベースライン期間の統計量
 * @param thresholds 異常判定で用いる各種しきい値
 * @returns メトリクスキーをキーとする異常サマリー辞書
 */
function computeAnomalySummaries(
  recent: IssueMetricsStatistics,
  baseline: IssueMetricsStatistics,
  thresholds: {
    zScoreThreshold: number;
    relativeChangeThreshold: number;
    minBaselineSampleSize: number;
    minRecentSampleSize: number;
  },
): Record<MetricKey, MetricAnomalySummary> {
  const result: Partial<Record<MetricKey, MetricAnomalySummary>> = {};

  for (const metric of METRIC_KEYS) {
    result[metric] = analyseMetric(metric, recent[metric], baseline[metric], thresholds);
  }

  return result as Record<MetricKey, MetricAnomalySummary>;
}

/**
 * 単一メトリクスについて直近とベースラインの統計を比較し、異常判定を行う。
 *
 * @param metric 対象メトリクスキー
 * @param recent 直近期間の統計量
 * @param baseline ベースライン期間の統計量
 * @param thresholds 異常判定のしきい値
 * @returns 異常サマリー（方向・理由・値の差分など）
 */
function analyseMetric(
  metric: MetricKey,
  recent: MetricStatisticsResult,
  baseline: MetricStatisticsResult,
  thresholds: {
    zScoreThreshold: number;
    relativeChangeThreshold: number;
    minBaselineSampleSize: number;
    minRecentSampleSize: number;
  },
): MetricAnomalySummary {
  const { zScoreThreshold, relativeChangeThreshold, minBaselineSampleSize, minRecentSampleSize } = thresholds;

  const baselineCount = baseline.summary.count;
  const recentCount = recent.summary.count;
  const recentMean = recent.summary.mean;
  const baselineMean = baseline.summary.mean;
  const recentMedian = recent.summary.median;
  const baselineMedian = baseline.summary.median;
  const baselineStd = baseline.summary.standardDeviation ?? null;

  const baselineValue = valueOrFallback(baselineMean, baselineMedian);
  const recentValue = valueOrFallback(recentMean, recentMedian);

  let absoluteChange: number | null = null;
  let relativeChange: number | null = null;
  let direction: MetricAnomalySummary['direction'] = 'stable';

  if (recentValue !== null && baselineValue !== null) {
    absoluteChange = recentValue - baselineValue;
    relativeChange = baselineValue !== 0 ? absoluteChange / baselineValue : null;
    if (absoluteChange > 0) {
      direction = 'increase';
    } else if (absoluteChange < 0) {
      direction = 'decrease';
    }
  }

  let zScore: number | null = null;
  if (baselineStd !== null && baselineStd > 0 && recentMean !== null && baselineMean !== null) {
    zScore = (recentMean - baselineMean) / baselineStd;
  }

  const reasons: string[] = [];
  const hasSufficientData = baselineCount >= minBaselineSampleSize && recentCount >= minRecentSampleSize;
  let isAnomaly = false;

  if (!hasSufficientData) {
    reasons.push(`insufficient data (baseline: ${baselineCount}, recent: ${recentCount})`);
  } else {
    if (zScore !== null && Math.abs(zScore) >= zScoreThreshold) {
      isAnomaly = true;
      reasons.push(`|zScore|=${Math.abs(zScore).toFixed(2)} (threshold ${zScoreThreshold})`);
    }

    if (relativeChange !== null && Math.abs(relativeChange) >= relativeChangeThreshold) {
      isAnomaly = true;
      reasons.push(`relative change=${formatPercent(relativeChange)} (threshold ${formatPercent(relativeChangeThreshold)})`);
    }

    if (!isAnomaly && absoluteChange !== null && baselineStd === 0 && absoluteChange !== 0) {
      isAnomaly = true;
      reasons.push('baseline variance is zero while change detected');
    }
  }

  if (reasons.length === 0) {
    reasons.push('within expected range');
  }

  return {
    metric,
    isAnomaly,
    direction,
    reasons,
    absoluteChange,
    relativeChange,
    zScore,
    baselineMean,
    recentMean,
    baselineMedian,
    recentMedian,
    baselineCount,
    recentCount,
  };
}

/**
 * 異常検知オプションの妥当性を検証する。
 *
 * @param options 異常検知パラメータ
 */
function validateOptions(options: AnomalyDetectionOptions): void {
  if (!Number.isFinite(options.recentDays) || options.recentDays <= 0) {
    throw new Error('recentDays must be a positive number');
  }
  if (!Number.isFinite(options.baselineDays) || options.baselineDays <= 0) {
    throw new Error('baselineDays must be a positive number');
  }
  if (options.baselineGapDays !== undefined && options.baselineGapDays < 0) {
    throw new Error('baselineGapDays cannot be negative');
  }
}

/**
 * 基準日をもとに直近期間（start/end ISO 文字列）を計算する。
 *
 * @param reference 比較の基準日
 * @param recentDays 直近期間の日数
 * @returns 直近期間の開始日・終了日（ISO 文字列）
 */
function computeRecentRange(reference: Date, recentDays: number): { start: string; end: string } {
  const endDate = endOfDay(reference);
  const startDate = startOfDay(shiftDays(endDate, -(recentDays - 1)));
  return {
    start: startDate.toISOString(),
    end: endDate.toISOString(),
  };
}

/**
 * 直近期間開始日をもとに、指定された比較期間とギャップからベースライン範囲を求める。
 *
 * @param recentStartISO 直近期間の開始日時（ISO）
 * @param baselineDays ベースライン日数
 * @param gapDays 直近とベースライン間のバッファ日数
 * @returns ベースライン期間の開始・終了日時（ISO）
 */
function computeBaselineRange(
  recentStartISO: string,
  baselineDays: number,
  gapDays: number,
): { start: string; end: string } {
  const recentStart = new Date(recentStartISO);
  const baselineEndDay = startOfDay(shiftDays(recentStart, -(gapDays + 1)));
  const baselineStartDay = startOfDay(shiftDays(baselineEndDay, -(baselineDays - 1)));
  return {
    start: baselineStartDay.toISOString(),
    end: endOfDay(baselineEndDay).toISOString(),
  };
}

/**
 * 参照日時入力を Date に正規化する。
 *
 * @param reference ISO 文字列または Date。未指定時は現在日時。
 * @returns 正規化済み Date インスタンス
 */
function normalizeReferenceDate(reference?: string | Date): Date {
  if (reference instanceof Date) {
    return new Date(reference.getTime());
  }
  if (typeof reference === 'string') {
    const parsed = new Date(reference);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  return new Date();
}

/**
 * 指定日数分だけ日付を前後にシフトする。
 *
 * @param date 基準日
 * @param days 移動させる日数（負数で過去）
 * @returns シフト後の日付
 */
function shiftDays(date: Date, days: number): Date {
  const shifted = new Date(date.getTime());
  shifted.setDate(shifted.getDate() + days);
  return shifted;
}

/**
 * 日時をその日の 00:00:00.000 に揃える。
 *
 * @param date 対象日時
 * @returns 日付の始端を表す Date
 */
function startOfDay(date: Date): Date {
  const result = new Date(date.getTime());
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * 日時をその日の 23:59:59.999 に揃える。
 *
 * @param date 対象日時
 * @returns 日付の終端を表す Date
 */
function endOfDay(date: Date): Date {
  const result = new Date(date.getTime());
  result.setHours(23, 59, 59, 999);
  return result;
}

/**
 * 主値が null の場合にフォールバック値を使用するヘルパー。
 *
 * @param primary 優先する数値
 * @param fallback フォールバック値
 * @returns いずれかの有効値。両方 null の場合は null
 */
function valueOrFallback(primary: number | null, fallback: number | null): number | null {
  if (primary !== null) {
    return primary;
  }
  return fallback;
}

/**
 * 小数値を百分率文字列へ変換する。
 *
 * @param value 対象値（例: 0.15 → 15.0%）
 * @returns フォーマット済み百分率文字列
 */
function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}
