// 基本統計量
export { mean } from "./mean/index.js";

export { median } from "./median/index.js";
export type { MedianOptions } from "./median/index.js";

export { max } from "./max/index.js";
export type { MaxOptions } from "./max/index.js";

export { min } from "./min/index.js";
export type { MinOptions } from "./min/index.js";

export { mode } from "./mode/index.js";

// 分散と標準偏差
export { standardDeviation } from "./standard-deviation/index.js";
export type { StandardDeviationOptions } from "./standard-deviation/index.js";

export { variance } from "./variance/index.js";
export type { VarianceOptions } from "./variance/index.js";

// 分布の形状
export { kurtosis } from "./kurtosis/index.js";
export type { KurtosisOptions } from "./kurtosis/index.js";

export { skewness } from "./skewness/index.js";
export type { SkewnessOptions } from "./skewness/index.js";

// 分位数
export { percentile } from "./percentile/index.js";
export type { PercentileOptions } from "./percentile/index.js";

export { interquartileRange } from "./interquartile-range/index.js";
export type { InterquartileRangeOptions } from "./interquartile-range/index.js";

// 相関係数
export { correlationPearson } from "./correlation-pearson/index.js";

export { correlationSpearman } from "./correlation-spearman/index.js";

// 外れ値検出
export { outliersIQR } from "./outliers-iqr/index.js";
export type { IQROutlier, OutliersIQROptions } from "./outliers-iqr/index.js";

export { outliersZScore } from "./outliers-zscore/index.js";
export type {
	ZScoreOutlier,
	OutliersZScoreOptions,
} from "./outliers-zscore/index.js";

