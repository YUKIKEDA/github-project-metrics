export interface MedianOptions {
  /**
   * 配列が既に昇順ソート済みなら true を指定してください。
   * デフォルトでは内部でコピーを作成してソートします。
   */
  sorted?: boolean;
}

export function median(values: ReadonlyArray<number>, options: MedianOptions = {}): number {
  if (values.length === 0) {
    throw new TypeError("values must contain at least one element");
  }

  const { sorted = false } = options;
  const data = sorted ? Array.from(values) : Array.from(values).sort((a, b) => a - b);

  const mid = Math.floor(data.length / 2);
  if (data.length % 2 === 0) {
    return (data[mid - 1] + data[mid]) / 2;
  }

  return data[mid];
}

export default median;
