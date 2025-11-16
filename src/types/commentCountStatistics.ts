/**
 * コメント数の統計値。
 */
export interface CommentCountStatistics {
  /** 平均値。 */
  mean?: { total: number; participantCount: number };
  /** 中央値。 */
  median?: { total: number; participantCount: number };
  /** 最頻値。 */
  mode?: { total: number; participantCount: number };
  /** 最大値。 */
  max?: { total: number; participantCount: number };
  /** 最小値。 */
  min?: { total: number; participantCount: number };
  /** 分散。 */
  variance?: { total: number; participantCount: number };
  /** 標準偏差。 */
  standardDeviation?: { total: number; participantCount: number };
  /** 四分位範囲。 */
  interquartileRange?: { total: number; participantCount: number };
  /** 尖度。 */
  kurtosis?: { total: number; participantCount: number };
  /** 歪度。 */
  skewness?: { total: number; participantCount: number };
  /** パーセンタイル。 */
  percentile?: {
    [key: number]: { total: number; participantCount: number };
  };
  /** 外れ値（IQR法）。 */
  outliersIqr?: { total: number[]; participantCount: number[] };
  /** 外れ値（Zスコア法）。 */
  outliersZscore?: { total: number[]; participantCount: number[] };
}

