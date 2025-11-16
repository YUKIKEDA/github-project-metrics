import type { IQROutlier, ZScoreOutlier } from "@github-project-metrics/ghpm-statistics";

/**
 * 計画と実績の差異の統計値。
 */
export interface PlanVsActualStatistics {
  /** 平均値。 */
  mean?: {
    planned: number;
    actual: number;
    variance: number;
    varianceRatio?: number;
  };
  /** 中央値。 */
  median?: {
    planned: number;
    actual: number;
    variance: number;
    varianceRatio?: number;
  };
  /** 最頻値。 */
  mode?: {
    planned: number;
    actual: number;
    variance: number;
    varianceRatio?: number;
  };
  /** 最大値。 */
  max?: {
    planned: number;
    actual: number;
    variance: number;
    varianceRatio?: number;
  };
  /** 最小値。 */
  min?: {
    planned: number;
    actual: number;
    variance: number;
    varianceRatio?: number;
  };
  /** 分散。 */
  variance?: {
    planned: number;
    actual: number;
    variance: number;
    varianceRatio?: number;
  };
  /** 標準偏差。 */
  standardDeviation?: {
    planned: number;
    actual: number;
    variance: number;
    varianceRatio?: number;
  };
  /** 四分位範囲。 */
  interquartileRange?: {
    planned: number;
    actual: number;
    variance: number;
    varianceRatio?: number;
  };
  /** 尖度。 */
  kurtosis?: {
    planned: number;
    actual: number;
    variance: number;
    varianceRatio?: number;
  };
  /** 歪度。 */
  skewness?: {
    planned: number;
    actual: number;
    variance: number;
    varianceRatio?: number;
  };
  /** パーセンタイル。 */
  percentile?: {
    [key: number]: {
      planned: number;
      actual: number;
      variance: number;
      varianceRatio?: number;
    };
  };
  /** 外れ値（IQR法）。 */
  outliersIqr?: {
    planned: IQROutlier[];
    actual: IQROutlier[];
    variance: IQROutlier[];
    varianceRatio?: IQROutlier[];
  };
  /** 外れ値（Zスコア法）。 */
  outliersZscore?: {
    planned: ZScoreOutlier[];
    actual: ZScoreOutlier[];
    variance: ZScoreOutlier[];
    varianceRatio?: ZScoreOutlier[];
  };
}

