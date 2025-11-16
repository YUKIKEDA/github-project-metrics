import type { IQROutlier, ZScoreOutlier } from "@github-project-metrics/ghpm-statistics";

/**
 * 複雑さの統計値。
 */
export interface ComplexityStatistics {
  /** 平均値。 */
  mean?: { estimated: number };
  /** 中央値。 */
  median?: { estimated: number };
  /** 最頻値。 */
  mode?: { estimated: number };
  /** 最大値。 */
  max?: { estimated: number };
  /** 最小値。 */
  min?: { estimated: number };
  /** 分散。 */
  variance?: { estimated: number };
  /** 標準偏差。 */
  standardDeviation?: { estimated: number };
  /** 四分位範囲。 */
  interquartileRange?: { estimated: number };
  /** 尖度。 */
  kurtosis?: { estimated: number };
  /** 歪度。 */
  skewness?: { estimated: number };
  /** パーセンタイル。 */
  percentile?: {
    [key: number]: { estimated: number };
  };
  /** 外れ値（IQR法）。 */
  outliersIqr?: { estimated: IQROutlier[] };
  /** 外れ値（Zスコア法）。 */
  outliersZscore?: { estimated: ZScoreOutlier[] };
}

