import { describe, expect, it } from "vitest";

import { min } from "./index.js";

describe("min", () => {
  it("配列全体の最小値を返す", () => {
    expect(min([1, 5, 3, 4])).toBe(1);
  });

  it("fromIndex/toIndex オプションを考慮する", () => {
    expect(min([1, 9, 3, 10], { fromIndex: 1, toIndex: 3 })).toBe(3);
  });

  it("空配列の場合は TypeError を投げる", () => {
    expect(() => min([])).toThrowError(TypeError);
  });
});
