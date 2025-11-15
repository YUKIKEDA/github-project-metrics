import { describe, expect, it } from "vitest";
import type { PlanVsActualMetric } from "@github-project-metrics/ghpm-metrics";
import { calculatePlanVsActualStandardDeviation } from "./index.js";

describe("calculatePlanVsActualStandardDeviation", () => {
  it("複数のメトリクスから各フィールドの標準偏差を計算する", () => {
    const metrics: PlanVsActualMetric[] = [
      { planned: 5, actual: 6, variance: 1, varianceRatio: 0.2 },
      { planned: 10, actual: 12, variance: 2, varianceRatio: 0.2 },
      { planned: 8, actual: 7, variance: -1, varianceRatio: -0.125 },
      { planned: 6, actual: 8, variance: 2, varianceRatio: 0.333 },
    ];

    const result = calculatePlanVsActualStandardDeviation(metrics);

    expect(result).toBeDefined();
    expect(result?.planned).toBeTypeOf("number");
    expect(result?.actual).toBeTypeOf("number");
    expect(result?.variance).toBeTypeOf("number");
    expect(result?.varianceRatio).toBeTypeOf("number");
  });

  it("varianceRatio が undefined のメトリクスがある場合は varianceRatio を除外する", () => {
    const metrics: PlanVsActualMetric[] = [
      { planned: 5, actual: 6, variance: 1 },
      { planned: 10, actual: 12, variance: 2, varianceRatio: 0.2 },
      { planned: 8, actual: 7, variance: -1, varianceRatio: 0.2 },
    ];

    const result = calculatePlanVsActualStandardDeviation(metrics);

    expect(result).toBeDefined();
    expect(result?.planned).toBeTypeOf("number");
    expect(result?.actual).toBeTypeOf("number");
    expect(result?.variance).toBeTypeOf("number");
    expect(result?.varianceRatio).toBeTypeOf("number");
  });

  it("すべてのメトリクスで varianceRatio が undefined の場合は varianceRatio を含めない", () => {
    const metrics: PlanVsActualMetric[] = [
      { planned: 5, actual: 6, variance: 1 },
      { planned: 10, actual: 12, variance: 2 },
    ];

    const result = calculatePlanVsActualStandardDeviation(metrics);

    expect(result).toBeDefined();
    expect(result?.planned).toBeTypeOf("number");
    expect(result?.actual).toBeTypeOf("number");
    expect(result?.variance).toBeTypeOf("number");
    expect(result?.varianceRatio).toBeUndefined();
  });

  it("要素数が2未満の場合は undefined を返す", () => {
    const metrics: PlanVsActualMetric[] = [
      { planned: 5, actual: 6, variance: 1, varianceRatio: 0.2 },
    ];

    const result = calculatePlanVsActualStandardDeviation(metrics);

    expect(result).toBeUndefined();
  });

  it("空配列の場合は undefined を返す", () => {
    const metrics: PlanVsActualMetric[] = [];

    const result = calculatePlanVsActualStandardDeviation(metrics);

    expect(result).toBeUndefined();
  });
});

