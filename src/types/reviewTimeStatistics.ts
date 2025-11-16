/**
 * レビュー時間の統計値。
 */
export interface ReviewTimeStatistics {
  /** 平均値。 */
  mean?: { duration: number };
  /** 中央値。 */
  median?: { duration: number };
  /** 最頻値。 */
  mode?: { duration: number };
  /** 最大値。 */
  max?: { duration: number };
  /** 最小値。 */
  min?: { duration: number };
  /** 分散。 */
  variance?: { duration: number };
  /** 標準偏差。 */
  standardDeviation?: { duration: number };
  /** 四分位範囲。 */
  interquartileRange?: { duration: number };
  /** 尖度。 */
  kurtosis?: { duration: number };
  /** 歪度。 */
  skewness?: { duration: number };
  /** パーセンタイル。 */
  percentile?: {
    [key: number]: { duration: number };
  };
  /** 外れ値（IQR法）。 */
  outliersIqr?: { duration: number[] };
  /** 外れ値（Zスコア法）。 */
  outliersZscore?: { duration: number[] };
}

