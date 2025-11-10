import { describe, expect, it } from "vitest";

import { correlationPearson } from "./index.js";

describe("correlationPearson", () => {
  it("完全に正の相関を返す", () => {
    expect(correlationPearson([1, 2, 3], [2, 4, 6])).toBeCloseTo(1, 6);
  });

  it("完全に負の相関を返す", () => {
    expect(correlationPearson([1, 2, 3], [6, 4, 2])).toBeCloseTo(-1, 6);
  });

  it("相関がない場合は 0 に近い値を返す", () => {
    expect(correlationPearson([1, 2, 3], [1, 0, 1])).toBeCloseTo(0, 6);
  });

  it("配列の長さが異なる場合は TypeError を投げる", () => {
    expect(() => correlationPearson([1, 2], [1])).toThrow(TypeError);
  });

  it("配列が空の場合は TypeError を投げる", () => {
    expect(() => correlationPearson([], [])).toThrow(TypeError);
  });
});
