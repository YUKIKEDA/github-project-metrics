import { describe, expect, it } from "vitest";
import type { PlanVsActualMetric } from "@github-project-metrics/ghpm-metrics";
import { calculatePlanVsActualMode } from "./index.js";

describe("calculatePlanVsActualMode", () => {
  it("複数のメトリクスから各フィールドの最頻値を計算する", () => {
    const metrics: PlanVsActualMetric[] = [
      { planned: 5, actual: 6, variance: 1, varianceRatio: 0.2 },
      { planned: 10, actual: 12, variance: 2, varianceRatio: 0.2 },
      { planned: 5, actual: 6, variance: 1, varianceRatio: 0.2 },
      { planned: 8, actual: 7, variance: -1, varianceRatio: -0.125 },
    ];

    const result = calculatePlanVsActualMode(metrics);

    expect(result).toEqual({
      planned: 5,
      actual: 6,
      variance: 1,
      varianceRatio: 0.2,
    });
  });

  it("varianceRatio が undefined のメトリクスがある場合は varianceRatio を除外する", () => {
    const metrics: PlanVsActualMetric[] = [
      { planned: 5, actual: 6, variance: 1 },
      { planned: 10, actual: 12, variance: 2, varianceRatio: 0.2 },
      { planned: 5, actual: 6, variance: 1 },
    ];

    const result = calculatePlanVsActualMode(metrics);

    expect(result).toEqual({
      planned: 5,
      actual: 6,
      variance: 1,
      varianceRatio: 0.2,
    });
  });

  it("すべてのメトリクスで varianceRatio が undefined の場合は varianceRatio を含めない", () => {
    const metrics: PlanVsActualMetric[] = [
      { planned: 5, actual: 6, variance: 1 },
      { planned: 10, actual: 12, variance: 2 },
      { planned: 5, actual: 6, variance: 1 },
    ];

    const result = calculatePlanVsActualMode(metrics);

    expect(result).toEqual({
      planned: 5,
      actual: 6,
      variance: 1,
    });
    expect(result?.varianceRatio).toBeUndefined();
  });

  it("単一のメトリクスの場合はその値が最頻値になる", () => {
    const metrics: PlanVsActualMetric[] = [
      { planned: 5, actual: 6, variance: 1, varianceRatio: 0.2 },
    ];

    const result = calculatePlanVsActualMode(metrics);

    expect(result).toEqual({
      planned: 5,
      actual: 6,
      variance: 1,
      varianceRatio: 0.2,
    });
  });

  it("空配列の場合は undefined を返す", () => {
    const metrics: PlanVsActualMetric[] = [];

    const result = calculatePlanVsActualMode(metrics);

    expect(result).toBeUndefined();
  });
});

