/**
 * サイクルタイムの統計値。
 */
export interface CycleTimeStatistics {
  /** 平均値。 */
  mean?: { durationMs: number };
  /** 中央値。 */
  median?: { durationMs: number };
  /** 最頻値。 */
  mode?: { durationMs: number };
  /** 最大値。 */
  max?: { durationMs: number };
  /** 最小値。 */
  min?: { durationMs: number };
  /** 分散。 */
  variance?: { durationMs: number };
  /** 標準偏差。 */
  standardDeviation?: { durationMs: number };
  /** 四分位範囲。 */
  interquartileRange?: { durationMs: number };
  /** 尖度。 */
  kurtosis?: { durationMs: number };
  /** 歪度。 */
  skewness?: { durationMs: number };
  /** パーセンタイル。 */
  percentile?: {
    [key: number]: { durationMs: number };
  };
  /** 外れ値（IQR法）。 */
  outliersIqr?: { durationMs: number[] };
  /** 外れ値（Zスコア法）。 */
  outliersZscore?: { durationMs: number[] };
}

