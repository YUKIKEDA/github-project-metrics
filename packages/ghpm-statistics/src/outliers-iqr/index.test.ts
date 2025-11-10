import { describe, expect, it } from "vitest";

import { outliersIQR } from "./index.js";

describe("outliersIQR", () => {
  const unsorted = [10, 12, 14, 16, 18, 120];

  it("IQR に基づいて外れ値を検出する", () => {
    const outliers = outliersIQR(unsorted);
    expect(outliers).toHaveLength(1);
    expect(outliers[0]).toEqual({ index: 5, value: 120 });
  });

  it("multiplier を変更できる", () => {
    const outliers = outliersIQR(unsorted, { multiplier: 1 });
    expect(outliers[0]).toEqual({ index: 5, value: 120 });
  });

  it("sorted オプションを利用すると元配列を変更しない", () => {
    const sorted = [1, 3, 5, 7, 9, 11, 30];
    const outliers = outliersIQR(sorted, { sorted: true });
    expect(outliers).toEqual([{ index: 6, value: 30 }]);
    expect(sorted).toEqual([1, 3, 5, 7, 9, 11, 30]);
  });

  it("四分位数を事前に渡すことができる", () => {
    const quartiles = { q1: 12, q3: 18 };
    const outliers = outliersIQR(unsorted, { quartiles });
    expect(outliers).toEqual([{ index: 5, value: 120 }]);
  });

  it("データが空の場合は空配列を返す", () => {
    expect(outliersIQR([])).toEqual([]);
  });

  it("IQR が 0 の場合は multiplier が 0 以上なら空配列を返す", () => {
    expect(outliersIQR([5, 5, 5])).toEqual([]);
  });

  it("multiplier が負の場合は RangeError を投げる", () => {
    expect(() => outliersIQR([1, 2, 3], { multiplier: -1 })).toThrow(RangeError);
  });
});
