import { describe, expect, it } from "vitest";

import { kurtosis } from "./index.js";

describe("kurtosis", () => {
  const symmetric = [1, 2, 3, 4, 5];
  const skewed = [2, 4, 4, 4, 5, 5, 7, 9];

  it("対称な分布の過剰尖度を返す", () => {
    expect(kurtosis(symmetric)).toBeCloseTo(-1.2, 6);
  });

  it("不偏推定量は標本データの過剰尖度を返す", () => {
    expect(kurtosis(skewed)).toBeCloseTo(0.940625, 6);
  });

  it("excess を false にすると通常の尖度を返す", () => {
    expect(kurtosis(symmetric, { excess: false })).toBeCloseTo(1.8, 6);
  });

  it("unbiased を false にすると母集団の過剰尖度を返す", () => {
    expect(kurtosis(skewed, { unbiased: false })).toBeCloseTo(-0.21875, 6);
  });

  it("mean オプションを指定して計算できる", () => {
    expect(kurtosis(skewed, { mean: 5 })).toBeCloseTo(0.940625, 6);
  });

  it("要素数が 2 未満の場合は TypeError を投げる", () => {
    expect(() => kurtosis([1])).toThrow(TypeError);
  });

  it("不偏推定量で要素数が 4 未満の場合は TypeError を投げる", () => {
    expect(() => kurtosis([1, 2, 3])).toThrow(TypeError);
  });
});
