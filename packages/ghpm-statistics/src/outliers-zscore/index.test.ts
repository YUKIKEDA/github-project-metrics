import { describe, expect, it } from "vitest";

import { outliersZScore } from "./index.js";

describe("outliersZScore", () => {
  it("Z スコアが閾値を超える要素を検出する", () => {
    const data = [...Array(10).fill(0), 10];
    const outliers = outliersZScore(data);
    expect(outliers).toHaveLength(1);
    expect(outliers[0]).toMatchObject({ index: 10, value: 10 });
    expect(Math.abs(outliers[0].zScore)).toBeGreaterThan(3);
  });

  it("閾値を変更できる", () => {
    const data = [...Array(10).fill(0), 10];
    const outliers = outliersZScore(data, { threshold: 1 });
    expect(outliers.map((outlier) => outlier.index)).toEqual([10]);
  });

  it("平均値と標準偏差を事前に渡せる", () => {
    const data = [...Array(10).fill(0), 10];
    const mean = 10 / 11;
    const standardDeviation = (10 * Math.sqrt(10)) / 11;
    const outliers = outliersZScore(data, { mean, standardDeviation });
    expect(outliers).toHaveLength(1);
    expect(outliers[0]).toMatchObject({ index: 10, value: 10 });
  });

  it("分散が 0 の場合は空配列を返す", () => {
    expect(outliersZScore([5, 5, 5])).toEqual([]);
  });

  it("閾値が不正な場合は RangeError を投げる", () => {
    expect(() => outliersZScore([1, 2, 3], { threshold: 0 })).toThrow(RangeError);
    expect(() => outliersZScore([1, 2, 3], { threshold: Number.NaN })).toThrow(RangeError);
  });
});
