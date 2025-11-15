import { describe, expect, it } from "vitest";
import type { PlanVsActualMetric } from "@github-project-metrics/ghpm-metrics";
import { calculatePlanVsActualOutliersZScore } from "./index.js";

describe("calculatePlanVsActualOutliersZScore", () => {
  it("複数のメトリクスから各フィールドの外れ値を検出する", () => {
    const metrics: PlanVsActualMetric[] = [
      { planned: 5, actual: 6, variance: 1, varianceRatio: 0.2 },
      { planned: 10, actual: 12, variance: 2, varianceRatio: 0.2 },
      { planned: 8, actual: 7, variance: -1, varianceRatio: -0.125 },
      { planned: 6, actual: 8, variance: 2, varianceRatio: 0.333 },
      { planned: 100, actual: 120, variance: 20, varianceRatio: 0.2 }, // 外れ値
    ];

    const result = calculatePlanVsActualOutliersZScore(metrics);

    expect(result).toBeDefined();
    expect(result?.planned).toBeInstanceOf(Array);
    expect(result?.actual).toBeInstanceOf(Array);
    expect(result?.variance).toBeInstanceOf(Array);
    expect(result?.varianceRatio).toBeInstanceOf(Array);
  });

  it("varianceRatio が undefined のメトリクスがある場合は varianceRatio を除外する", () => {
    const metrics: PlanVsActualMetric[] = [
      { planned: 5, actual: 6, variance: 1 },
      { planned: 10, actual: 12, variance: 2, varianceRatio: 0.2 },
      { planned: 8, actual: 7, variance: -1, varianceRatio: 0.2 },
      { planned: 100, actual: 120, variance: 20, varianceRatio: 0.2 }, // 外れ値
    ];

    const result = calculatePlanVsActualOutliersZScore(metrics);

    expect(result).toBeDefined();
    expect(result?.planned).toBeInstanceOf(Array);
    expect(result?.actual).toBeInstanceOf(Array);
    expect(result?.variance).toBeInstanceOf(Array);
    expect(result?.varianceRatio).toBeInstanceOf(Array);
  });

  it("すべてのメトリクスで varianceRatio が undefined の場合は varianceRatio を含めない", () => {
    const metrics: PlanVsActualMetric[] = [
      { planned: 5, actual: 6, variance: 1 },
      { planned: 10, actual: 12, variance: 2 },
      { planned: 8, actual: 7, variance: -1 },
    ];

    const result = calculatePlanVsActualOutliersZScore(metrics);

    expect(result).toBeDefined();
    expect(result?.planned).toBeInstanceOf(Array);
    expect(result?.actual).toBeInstanceOf(Array);
    expect(result?.variance).toBeInstanceOf(Array);
    expect(result?.varianceRatio).toBeUndefined();
  });

  it("外れ値がない場合は空配列を返す", () => {
    const metrics: PlanVsActualMetric[] = [
      { planned: 5, actual: 6, variance: 1, varianceRatio: 0.2 },
      { planned: 10, actual: 12, variance: 2, varianceRatio: 0.2 },
      { planned: 8, actual: 7, variance: -1, varianceRatio: -0.125 },
    ];

    const result = calculatePlanVsActualOutliersZScore(metrics);

    expect(result).toBeDefined();
    expect(result?.planned).toEqual([]);
    expect(result?.actual).toEqual([]);
    expect(result?.variance).toEqual([]);
  });

  it("単一のメトリクスの場合は空配列を返す", () => {
    const metrics: PlanVsActualMetric[] = [
      { planned: 5, actual: 6, variance: 1, varianceRatio: 0.2 },
    ];

    const result = calculatePlanVsActualOutliersZScore(metrics);

    expect(result).toBeDefined();
    expect(result?.planned).toEqual([]);
    expect(result?.actual).toEqual([]);
    expect(result?.variance).toEqual([]);
  });

  it("空配列の場合は undefined を返す", () => {
    const metrics: PlanVsActualMetric[] = [];

    const result = calculatePlanVsActualOutliersZScore(metrics);

    expect(result).toBeUndefined();
  });
});

