import { describe, expect, it } from "vitest";

import { correlationSpearman } from "./index.js";

describe("correlationSpearman", () => {
  it("完全に正の順位相関を返す", () => {
    expect(correlationSpearman([1, 2, 3], [3, 4, 5])).toBeCloseTo(1, 6);
  });

  it("完全に負の順位相関を返す", () => {
    expect(correlationSpearman([1, 2, 3], [5, 4, 3])).toBeCloseTo(-1, 6);
  });

  it("相関がない場合は 0 に近い値を返す", () => {
    expect(correlationSpearman([1, 2, 3, 4], [3, 1, 4, 2])).toBeCloseTo(0, 6);
  });

  it("同率順位を正しく処理する", () => {
    expect(correlationSpearman([1, 2, 2, 3], [4, 5, 5, 6])).toBeCloseTo(1, 6);
  });

  it("配列の長さが異なる場合は TypeError を投げる", () => {
    expect(() => correlationSpearman([1, 2], [1])).toThrow(TypeError);
  });

  it("配列が空の場合は TypeError を投げる", () => {
    expect(() => correlationSpearman([], [])).toThrow(TypeError);
  });
});
