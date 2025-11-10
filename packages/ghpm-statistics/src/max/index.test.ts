import { describe, expect, it } from "vitest";

import { max } from "./index.js";

describe("max", () => {
  it("配列全体の最大値を返す", () => {
    expect(max([1, 5, 3, 4])).toBe(5);
  });

  it("fromIndex/toIndex オプションを考慮する", () => {
    expect(max([1, 9, 3, 10], { fromIndex: 1, toIndex: 3 })).toBe(9);
  });

  it("空配列の場合は TypeError を投げる", () => {
    expect(() => max([])).toThrowError(TypeError);
  });
});
