import { describe, expect, it } from "vitest";

import { mode } from "./index.js";

describe("mode", () => {
  it("配列全体の最頻値を返す", () => {
    expect(mode([1, 2, 2, 3, 4])).toBe(2);
  });

  it("空配列の場合は TypeError を投げる", () => {
    expect(() => mode([])).toThrowError(TypeError);
  });
});
