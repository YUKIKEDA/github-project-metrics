import { describe, expect, it } from "vitest";

import { percentile } from "./index.js";

describe("percentile", () => {
  const values = [15, 20, 35, 40, 50];

  it("0 パーセンタイルは最小値を返す", () => {
    expect(percentile(values, 0)).toBe(15);
  });

  it("100 パーセンタイルは最大値を返す", () => {
    expect(percentile(values, 100)).toBe(50);
  });

  it("線形補間を利用してパーセンタイル値を返す", () => {
    expect(percentile(values, 40)).toBeCloseTo(29, 6);
  });

  it("sorted オプションが true の場合は配列を再ソートしない", () => {
    const sortedValues = [1, 3, 5, 7];
    expect(percentile(sortedValues, 75, { sorted: true })).toBe(5.5);
    expect(sortedValues).toEqual([1, 3, 5, 7]);
  });

  it("空配列の場合は TypeError を投げる", () => {
    expect(() => percentile([], 50)).toThrow(TypeError);
  });

  it("0 未満や 100 より大きいパーセンタイルは RangeError を投げる", () => {
    expect(() => percentile(values, -1)).toThrow(RangeError);
    expect(() => percentile(values, 101)).toThrow(RangeError);
  });

  it("有限でないパーセンタイルを指定すると TypeError を投げる", () => {
    expect(() => percentile(values, Number.NaN)).toThrow(TypeError);
    expect(() => percentile(values, Number.POSITIVE_INFINITY)).toThrow(TypeError);
  });
});
