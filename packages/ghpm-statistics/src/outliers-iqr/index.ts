import { percentile } from "../percentile/index.js";

export interface IQROutlier {
  index: number;
  value: number;
}

export interface OutliersIQROptions {
  /**
   * 外れ値判定に使用する IQR 倍数（既定値: 1.5）。
   */
  multiplier?: number;
  /**
   * 配列が既に昇順ソート済みなら true を指定してください。
   */
  sorted?: boolean;
  /**
   * 既知の四分位数を事前に渡す場合に指定します。
   */
  quartiles?: {
    q1: number;
    q3: number;
  };
}

export function outliersIQR(
  values: ReadonlyArray<number>,
  options: OutliersIQROptions = {},
): IQROutlier[] {
  if (values.length === 0) {
    return [];
  }

  const { multiplier = 1.5, sorted = false, quartiles } = options;

  if (!Number.isFinite(multiplier) || multiplier < 0) {
    throw new RangeError("multiplier must be a finite number greater than or equal to 0");
  }

  let q1: number;
  let q3: number;

  if (quartiles) {
    ({ q1, q3 } = quartiles);
  } else {
    q1 = percentile(values, 25, { sorted });
    q3 = percentile(values, 75, { sorted });
  }

  const iqr = q3 - q1;
  if (iqr === 0 && multiplier > 0) {
    return [];
  }

  const lowerBound = q1 - multiplier * iqr;
  const upperBound = q3 + multiplier * iqr;

  const results: IQROutlier[] = [];

  values.forEach((value, index) => {
    if (value < lowerBound || value > upperBound) {
      results.push({ index, value });
    }
  });

  return results;
}

export default outliersIQR;
