export interface PercentileOptions {
  /**
   * 配列が既に昇順ソート済みなら true を指定してください。
   * デフォルトでは内部でコピーを作成してソートします。
   */
  sorted?: boolean;
}

export function percentile(
  values: ReadonlyArray<number>,
  percentileValue: number,
  options: PercentileOptions = {},
): number {
  if (!Number.isFinite(percentileValue)) {
    throw new TypeError("percentile must be a finite number");
  }

  if (percentileValue < 0 || percentileValue > 100) {
    throw new RangeError("percentile must be between 0 and 100 (inclusive)");
  }

  if (values.length === 0) {
    throw new TypeError("values must contain at least one element");
  }

  const { sorted = false } = options;
  const data = sorted ? Array.from(values) : Array.from(values).sort((a, b) => a - b);

  if (data.length === 1 || percentileValue === 0) {
    return data[0];
  }

  if (percentileValue === 100) {
    return data[data.length - 1];
  }

  const index = (percentileValue / 100) * (data.length - 1);
  const lowerIndex = Math.floor(index);
  const upperIndex = Math.ceil(index);

  if (lowerIndex === upperIndex) {
    return data[lowerIndex];
  }

  const weight = index - lowerIndex;
  return data[lowerIndex] + (data[upperIndex] - data[lowerIndex]) * weight;
}

export default percentile;
