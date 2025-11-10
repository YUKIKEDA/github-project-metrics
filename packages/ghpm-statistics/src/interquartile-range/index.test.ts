import { describe, expect, it } from "vitest";

import { interquartileRange } from "./index.js";

describe("interquartileRange", () => {
  it("配列全体の四分位範囲を返す", () => {
    expect(interquartileRange([1, 2, 3, 4, 5])).toBe(2);
  });

  it("配列がソートされていなくても同じ結果になる", () => {
    expect(interquartileRange([5, 1, 4, 2, 3])).toBe(2);
  });

  it("sorted オプションが true の場合は配列を再ソートしない", () => {
    const sortedValues = [10, 20, 30, 40];
    expect(interquartileRange(sortedValues, { sorted: true })).toBe(15);
    expect(sortedValues).toEqual([10, 20, 30, 40]);
  });
});
