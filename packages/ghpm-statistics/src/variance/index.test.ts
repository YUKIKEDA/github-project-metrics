import { describe, expect, it } from "vitest";

import { variance } from "./index.js";

describe("variance", () => {
  const values = [2, 4, 4, 4, 5, 5, 7, 9];

  it("標本分散を返す", () => {
    expect(variance(values)).toBeCloseTo(4.5714285714, 6);
  });

  it("unbiased オプションを false にすると母分散を返す", () => {
    expect(variance(values, { unbiased: false })).toBeCloseTo(4, 6);
  });

  it("平均値を事前計算している場合は mean オプションを利用できる", () => {
    expect(variance(values, { mean: 5, unbiased: false })).toBeCloseTo(4, 6);
  });
});
