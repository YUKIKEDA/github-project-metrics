import { describe, expect, it } from "vitest";

import { mean } from "./index.js";

describe("mean", () => {
  it("配列全体の平均値を返す", () => {
    expect(mean([1, 2, 3, 4])).toBe(2.5);
  });

  it("小数を含む配列の平均値を返す", () => {
    expect(mean([1.2, 3.8, 5])).toBeCloseTo(3.3333333, 6);
  });
});
