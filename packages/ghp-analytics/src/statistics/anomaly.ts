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
const DEFAULT_IQR_RELATIVE_CHANGE_THRESHOLD = 0.5;
const DEFAULT_QUARTILE_SHIFT_THRESHOLD = 0.5;
const DEFAULT_SKEWNESS_CHANGE_THRESHOLD = 1;
const DEFAULT_KURTOSIS_CHANGE_THRESHOLD = 2;
const DEFAULT_OUTLIER_COUNT_DIFF_THRESHOLD = 3;

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
  /** IQR に対する相対変化率のしきい値。 */
  iqrRelativeChangeThreshold?: number;
  /** 四分位点シフトを異常とみなす規模（ベースライン IQR に対する割合）。 */
  quartileShiftThreshold?: number;
  /** 歪度の変化量しきい値。 */
  skewnessChangeThreshold?: number;
  /** 尖度の変化量しきい値。 */
  kurtosisChangeThreshold?: number;
  /** 外れ値カウントの差分しきい値。 */
  outlierCountDiffThreshold?: number;
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
    iqrRelativeChangeThreshold: options.iqrRelativeChangeThreshold ?? DEFAULT_IQR_RELATIVE_CHANGE_THRESHOLD,
    quartileShiftThreshold: options.quartileShiftThreshold ?? DEFAULT_QUARTILE_SHIFT_THRESHOLD,
    skewnessChangeThreshold: options.skewnessChangeThreshold ?? DEFAULT_SKEWNESS_CHANGE_THRESHOLD,
    kurtosisChangeThreshold: options.kurtosisChangeThreshold ?? DEFAULT_KURTOSIS_CHANGE_THRESHOLD,
    outlierCountDiffThreshold: options.outlierCountDiffThreshold ?? DEFAULT_OUTLIER_COUNT_DIFF_THRESHOLD,
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
    iqrRelativeChangeThreshold: number;
    quartileShiftThreshold: number;
    skewnessChangeThreshold: number;
    kurtosisChangeThreshold: number;
    outlierCountDiffThreshold: number;
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
    iqrRelativeChangeThreshold: number;
    quartileShiftThreshold: number;
    skewnessChangeThreshold: number;
    kurtosisChangeThreshold: number;
    outlierCountDiffThreshold: number;
  },
): MetricAnomalySummary {
  const {
    zScoreThreshold,
    relativeChangeThreshold,
    minBaselineSampleSize,
    minRecentSampleSize,
    iqrRelativeChangeThreshold,
    quartileShiftThreshold,
    skewnessChangeThreshold,
    kurtosisChangeThreshold,
    outlierCountDiffThreshold,
  } = thresholds;

  const baselineCount = baseline.summary.count;
  const recentCount = recent.summary.count;
  const recentMean = recent.summary.mean;
  const baselineMean = baseline.summary.mean;
  const recentMedian = recent.summary.median;
  const baselineMedian = baseline.summary.median;
  const baselineStd = baseline.summary.standardDeviation ?? null;

  const baselinePercentile25 = normalizeStat(baseline.distribution.percentile25);
  const recentPercentile25 = normalizeStat(recent.distribution.percentile25);
  const baselinePercentile75 = normalizeStat(baseline.distribution.percentile75);
  const recentPercentile75 = normalizeStat(recent.distribution.percentile75);
  const baselineIqr = normalizeStat(baseline.distribution.interquartileRange);
  const recentIqr = normalizeStat(recent.distribution.interquartileRange);
  const baselineSkewness = normalizeStat(baseline.distribution.skewness);
  const recentSkewness = normalizeStat(recent.distribution.skewness);
  const baselineKurtosis = normalizeStat(baseline.distribution.kurtosis);
  const recentKurtosis = normalizeStat(recent.distribution.kurtosis);
  const baselineOutlierCount = computeOutlierCount(baseline.outliers);
  const recentOutlierCount = computeOutlierCount(recent.outliers);

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
      reasons.push('baseline standard deviation is zero while change detected');
    }

    if (baselineIqr !== null && recentIqr !== null) {
      if (baselineIqr === 0) {
        if (recentIqr !== 0) {
          isAnomaly = true;
          reasons.push(`IQR expanded from 0 to ${recentIqr.toFixed(2)}`);
        }
      } else {
        const iqrRelativeChange = (recentIqr - baselineIqr) / baselineIqr;
        if (Math.abs(iqrRelativeChange) >= iqrRelativeChangeThreshold) {
          isAnomaly = true;
          reasons.push(`IQR change=${formatPercent(iqrRelativeChange)} (threshold ${formatPercent(iqrRelativeChangeThreshold)})`);
        }
      }
    }

    const quartileScale = deriveQuartileScale(baselineIqr, baselinePercentile25, baselinePercentile75, baselineMedian, baselineMean);
    if (quartileScale !== null && quartileScale !== 0 && baselinePercentile25 !== null && recentPercentile25 !== null) {
      const normalizedShift = Math.abs(recentPercentile25 - baselinePercentile25) / quartileScale;
      if (normalizedShift >= quartileShiftThreshold) {
        isAnomaly = true;
        reasons.push(`Q1 shift=${formatPercent(normalizedShift)} of baseline spread (threshold ${formatPercent(quartileShiftThreshold)})`);
      }
    }
    if (quartileScale !== null && quartileScale !== 0 && baselinePercentile75 !== null && recentPercentile75 !== null) {
      const normalizedShift = Math.abs(recentPercentile75 - baselinePercentile75) / quartileScale;
      if (normalizedShift >= quartileShiftThreshold) {
        isAnomaly = true;
        reasons.push(`Q3 shift=${formatPercent(normalizedShift)} of baseline spread (threshold ${formatPercent(quartileShiftThreshold)})`);
      }
    }
    if (quartileScale === 0 && baselinePercentile25 !== null && recentPercentile25 !== null && baselinePercentile25 !== recentPercentile25) {
      isAnomaly = true;
      reasons.push(`quartile shift detected despite zero baseline spread (Q1 ${baselinePercentile25.toFixed(2)} → ${recentPercentile25.toFixed(2)})`);
    }
    if (quartileScale === 0 && baselinePercentile75 !== null && recentPercentile75 !== null && baselinePercentile75 !== recentPercentile75) {
      isAnomaly = true;
      reasons.push(`quartile shift detected despite zero baseline spread (Q3 ${baselinePercentile75.toFixed(2)} → ${recentPercentile75.toFixed(2)})`);
    }

    if (baselineSkewness !== null && recentSkewness !== null) {
      const skewnessDelta = Math.abs(recentSkewness - baselineSkewness);
      if (skewnessDelta >= skewnessChangeThreshold) {
        isAnomaly = true;
        reasons.push(`skewness Δ=${skewnessDelta.toFixed(2)} (threshold ${skewnessChangeThreshold.toFixed(2)})`);
      }
    }

    if (baselineKurtosis !== null && recentKurtosis !== null) {
      const kurtosisDelta = Math.abs(recentKurtosis - baselineKurtosis);
      if (kurtosisDelta >= kurtosisChangeThreshold) {
        isAnomaly = true;
        reasons.push(`kurtosis Δ=${kurtosisDelta.toFixed(2)} (threshold ${kurtosisChangeThreshold.toFixed(2)})`);
      }
    }

    const outlierDiff = recentOutlierCount - baselineOutlierCount;
    if (Math.abs(outlierDiff) >= outlierCountDiffThreshold) {
      isAnomaly = true;
      reasons.push(`outlier count change=${outlierDiff} (threshold ±${outlierCountDiffThreshold})`);
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
    baselinePercentile25,
    recentPercentile25,
    baselinePercentile75,
    recentPercentile75,
    baselineIqr,
    recentIqr,
    baselineSkewness,
    recentSkewness,
    baselineKurtosis,
    recentKurtosis,
    baselineOutlierCount,
    recentOutlierCount,
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
 * 統計量（四分位範囲など）のスケールを決定する。
 *
 * @param baselineIqr ベースライン IQR
 * @param baselineQ1 ベースライン第1四分位
 * @param baselineQ3 ベースライン第3四分位
 * @param baselineMedian ベースライン中央値
 * @param baselineMean ベースライン平均
 * @returns 変化量比較のためのスケール。算出不能時は null
 */
function deriveQuartileScale(
  baselineIqr: number | null,
  baselineQ1: number | null,
  baselineQ3: number | null,
  baselineMedian: number | null,
  baselineMean: number | null,
): number | null {
  if (baselineIqr !== null) {
    return baselineIqr;
  }
  if (baselineQ1 !== null && baselineQ3 !== null) {
    const span = Math.abs(baselineQ3 - baselineQ1);
    if (span !== 0) {
      return span;
    }
  }
  const central = valueOrFallback(baselineMedian, baselineMean);
  if (central !== null && central !== 0) {
    return Math.abs(central);
  }
  return null;
}

/**
 * 数値統計量を null/undefined の場合に null に正規化する。
 */
function normalizeStat(value?: number | null): number | null {
  return value ?? null;
}

/**
 * 外れ値情報から検出件数を集計する。
 */
function computeOutlierCount(outliers: MetricStatisticsResult['outliers']): number {
  return (outliers.iqr?.detectedCount ?? 0) + (outliers.zscore?.detectedCount ?? 0);
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
