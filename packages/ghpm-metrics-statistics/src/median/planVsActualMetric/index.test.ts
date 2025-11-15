import { describe, expect, it } from "vitest";
import type { PlanVsActualMetric } from "@github-project-metrics/ghpm-metrics";
import { calculatePlanVsActualMedian } from "./index.js";

describe("calculatePlanVsActualMedian", () => {
  it("複数のメトリクスから各フィールドの中央値を計算する", () => {
    const metrics: PlanVsActualMetric[] = [
      { planned: 5, actual: 6, variance: 1, varianceRatio: 0.2 },
      { planned: 10, actual: 12, variance: 2, varianceRatio: 0.2 },
      { planned: 8, actual: 7, variance: -1, varianceRatio: -0.125 },
    ];

    const result = calculatePlanVsActualMedian(metrics);

    expect(result).toEqual({
      planned: 8,
      actual: 7,
      variance: 1,
      varianceRatio: 0.2,
    });
  });

  it("偶数個のメトリクスの場合は平均値が中央値になる", () => {
    const metrics: PlanVsActualMetric[] = [
      { planned: 5, actual: 6, variance: 1, varianceRatio: 0.1 },
      { planned: 8, actual: 7, variance: -1, varianceRatio: -0.125 },
      { planned: 10, actual: 12, variance: 2, varianceRatio: 0.2 },
      { planned: 15, actual: 14, variance: -1, varianceRatio: -0.067 },
    ];

    const result = calculatePlanVsActualMedian(metrics);

    // planned: [5, 8, 10, 15] → 中央値は (8 + 10) / 2 = 9
    // actual: [6, 7, 12, 14] → 中央値は (7 + 12) / 2 = 9.5
    // variance: [-1, -1, 1, 2] → 中央値は (-1 + 1) / 2 = 0
    // varianceRatio: [-0.125, -0.067, 0.1, 0.2] → 中央値は (-0.067 + 0.1) / 2 = 0.0165
    expect(result).toEqual({
      planned: (8 + 10) / 2,
      actual: (7 + 12) / 2,
      variance: (-1 + 1) / 2,
      varianceRatio: (-0.067 + 0.1) / 2,
    });
  });

  it("varianceRatio が undefined のメトリクスがある場合は varianceRatio を除外する", () => {
    const metrics: PlanVsActualMetric[] = [
      { planned: 5, actual: 6, variance: 1 },
      { planned: 10, actual: 12, variance: 2, varianceRatio: 0.2 },
    ];

    const result = calculatePlanVsActualMedian(metrics);

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

    const result = calculatePlanVsActualMedian(metrics);

    expect(result).toEqual({
      planned: (5 + 10) / 2,
      actual: (6 + 12) / 2,
      variance: (1 + 2) / 2,
    });
    expect(result?.varianceRatio).toBeUndefined();
  });

  it("単一のメトリクスの場合はその値が中央値になる", () => {
    const metrics: PlanVsActualMetric[] = [
      { planned: 5, actual: 6, variance: 1, varianceRatio: 0.2 },
    ];

    const result = calculatePlanVsActualMedian(metrics);

    expect(result).toEqual({
      planned: 5,
      actual: 6,
      variance: 1,
      varianceRatio: 0.2,
    });
  });

  it("空配列の場合は undefined を返す", () => {
    const metrics: PlanVsActualMetric[] = [];

    const result = calculatePlanVsActualMedian(metrics);

    expect(result).toBeUndefined();
  });
});

