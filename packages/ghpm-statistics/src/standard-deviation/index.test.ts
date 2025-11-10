import { describe, expect, it } from "vitest";

import { standardDeviation } from "./index.js";

describe("standardDeviation", () => {
  const values = [2, 4, 4, 4, 5, 5, 7, 9];

  it("標本標準偏差を返す", () => {
    expect(standardDeviation(values)).toBeCloseTo(2.1380899353, 6);
  });

  it("unbiased オプションを false にすると母標準偏差を返す", () => {
    expect(standardDeviation(values, { unbiased: false })).toBeCloseTo(2, 6);
  });

  it("平均値を事前計算している場合は mean オプションを利用できる", () => {
    expect(standardDeviation(values, { mean: 5, unbiased: false })).toBeCloseTo(2, 6);
  });
});
