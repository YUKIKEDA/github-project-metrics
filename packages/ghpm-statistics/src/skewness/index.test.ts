import { describe, expect, it } from "vitest";

import { skewness } from "./index.js";

describe("skewness", () => {
  const symmetric = [1, 2, 3, 4, 5];
  const skewed = [2, 4, 4, 4, 5, 5, 7, 9];

  it("対称な分布の偏り度は 0 を返す", () => {
    expect(skewness(symmetric)).toBeCloseTo(0, 12);
  });

  it("不偏推定量は標本データの歪度を返す", () => {
    expect(skewness(skewed)).toBeCloseTo(0.8184876, 6);
  });

  it("mean オプションを指定して計算できる", () => {
    expect(skewness(skewed, { mean: 5 })).toBeCloseTo(0.8184876, 6);
  });

  it("unbiased を false にすると母集団の歪度を返す", () => {
    expect(skewness(skewed, { unbiased: false })).toBeCloseTo(0.65625, 6);
  });

  it("要素数が 2 未満の場合は TypeError を投げる", () => {
    expect(() => skewness([1])).toThrow(TypeError);
  });

  it("不偏推定量で要素数が 3 未満の場合は TypeError を投げる", () => {
    expect(() => skewness([1, 2])).toThrow(TypeError);
  });
});
