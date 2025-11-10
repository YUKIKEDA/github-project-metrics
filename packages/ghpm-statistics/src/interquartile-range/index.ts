import { percentile } from "../percentile/index.js";

export interface InterquartileRangeOptions {
  /**
   * 配列が既に昇順ソート済みなら true を指定してください。
   * デフォルトでは内部でコピーを作成してソートします。
   */
  sorted?: boolean;
}

export function interquartileRange(
  values: ReadonlyArray<number>,
  options: InterquartileRangeOptions = {},
): number {
  const q1 = percentile(values, 25, options);
  const q3 = percentile(values, 75, options);
  return q3 - q1;
}

export default interquartileRange;
