import { describe, expect, it } from "vitest";
import type { PlanVsActualMetric } from "@github-project-metrics/ghpm-metrics";
import { calculatePlanVsActualMean } from "./index.js";

describe("calculatePlanVsActualMean", () => {
  it("複数のメトリクスから各フィールドの平均値を計算する", () => {
    const metrics: PlanVsActualMetric[] = [
      { planned: 5, actual: 6, variance: 1, varianceRatio: 0.2 },
      { planned: 10, actual: 12, variance: 2, varianceRatio: 0.2 },
      { planned: 8, actual: 7, variance: -1, varianceRatio: -0.125 },
    ];

    const result = calculatePlanVsActualMean(metrics);

    expect(result).toEqual({
      planned: (5 + 10 + 8) / 3,
      actual: (6 + 12 + 7) / 3,
      variance: (1 + 2 + -1) / 3,
      varianceRatio: (0.2 + 0.2 + -0.125) / 3,
    });
  });

  it("varianceRatio が undefined のメトリクスがある場合は varianceRatio を除外する", () => {
    const metrics: PlanVsActualMetric[] = [
      { planned: 5, actual: 6, variance: 1 },
      { planned: 10, actual: 12, variance: 2, varianceRatio: 0.2 },
    ];

    const result = calculatePlanVsActualMean(metrics);

    expect(result).toEqual({
      planned: (5 + 10) / 2,
      actual: (6 + 12) / 2,
      variance: (1 + 2) / 2,
      varianceRatio: 0.2,
    });
  });

  it("すべてのメトリクスで varianceRatio が undefined の場合は varianceRatio を含めない", () => {
    const metrics: PlanVsActualMetric[] = [
      { planned: 5, actual: 6, variance: 1 },
      { planned: 10, actual: 12, variance: 2 },
    ];

    const result = calculatePlanVsActualMean(metrics);

    expect(result).toEqual({
      planned: (5 + 10) / 2,
      actual: (6 + 12) / 2,
      variance: (1 + 2) / 2,
    });
    expect(result?.varianceRatio).toBeUndefined();
  });

  it("単一のメトリクスの場合はその値が平均値になる", () => {
    const metrics: PlanVsActualMetric[] = [
      { planned: 5, actual: 6, variance: 1, varianceRatio: 0.2 },
    ];

    const result = calculatePlanVsActualMean(metrics);

    expect(result).toEqual({
      planned: 5,
      actual: 6,
      variance: 1,
      varianceRatio: 0.2,
    });
  });

  it("空配列の場合は undefined を返す", () => {
    const metrics: PlanVsActualMetric[] = [];

    const result = calculatePlanVsActualMean(metrics);

    expect(result).toBeUndefined();
  });
});

