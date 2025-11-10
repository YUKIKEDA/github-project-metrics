import { describe, expect, it } from "vitest";

import { median } from "./index.js";

describe("median", () => {
  it("配列全体の中央値を返す", () => {
    expect(median([5, 1, 8, 3, 9])).toBe(5);
  });

  it("偶数個の配列では中央2要素の平均を返す", () => {
    expect(median([1, 2, 3, 4])).toBe(2.5);
  });

  it("sorted オプションが true の場合は配列を再ソートしない", () => {
    const values = [1, 3, 5, 7];
    expect(median(values, { sorted: true })).toBe(4);
    expect(values).toEqual([1, 3, 5, 7]);
  });

  it("空配列の場合は TypeError を投げる", () => {
    expect(() => median([])).toThrow(TypeError);
  });
});
