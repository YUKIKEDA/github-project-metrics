import { mean as meanFn } from "../mean/index.js";
import { standardDeviation as standardDeviationFn } from "../standard-deviation/index.js";

export interface ZScoreOutlier {
  index: number;
  value: number;
  zScore: number;
}

export interface OutliersZScoreOptions {
  /**
   * 閾値（既定値: 3）。絶対値が閾値を超える Z スコアを外れ値とみなします。
   */
  threshold?: number;
  /**
   * 既知の平均値を利用する場合に指定します。
   */
  mean?: number;
  /**
   * 既知の標準偏差を利用する場合に指定します。
   * 指定しない場合は母標準偏差（unbiased: false）を自動計算します。
   */
  standardDeviation?: number;
}

export function outliersZScore(
  values: ReadonlyArray<number>,
  options: OutliersZScoreOptions = {},
): ZScoreOutlier[] {
  if (values.length === 0) {
    return [];
  }

  const { threshold = 3, mean = meanFn(values), standardDeviation } = options;

  if (!Number.isFinite(threshold) || threshold <= 0) {
    throw new RangeError("threshold must be a finite number greater than 0");
  }

  const sigma =
    standardDeviation ??
    standardDeviationFn(values, {
      mean,
      unbiased: false,
    });

  if (sigma === 0) {
    return [];
  }

  const results: ZScoreOutlier[] = [];
  values.forEach((value, index) => {
    const zScore = (value - mean) / sigma;
    if (Math.abs(zScore) > threshold) {
      results.push({ index, value, zScore });
    }
  });

  return results;
}

export default outliersZScore;
