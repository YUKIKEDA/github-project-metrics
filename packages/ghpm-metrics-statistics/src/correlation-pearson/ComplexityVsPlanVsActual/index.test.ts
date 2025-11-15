import { describe, expect, it } from "vitest";
import type { ComplexityMetric, PlanVsActualMetric } from "@github-project-metrics/ghpm-metrics";
import { calculateComplexityVsPlanVsActualCorrelationPearson } from "./index.js";

describe("calculateComplexityVsPlanVsActualCorrelationPearson", () => {
  it("複数のメトリクスから相関係数を計算する", () => {
    const complexities: ComplexityMetric[] = [
      { estimated: 1 },
      { estimated: 3 },
      { estimated: 5 },
    ];

    const planVsActuals: PlanVsActualMetric[] = [
      { planned: 5, actual: 6, variance: 1, varianceRatio: 0.2 },
      { planned: 10, actual: 12, variance: 2, varianceRatio: 0.2 },
      { planned: 8, actual: 7, variance: -1, varianceRatio: -0.125 },
    ];

    const result = calculateComplexityVsPlanVsActualCorrelationPearson(complexities, planVsActuals);

    expect(result).toBeTypeOf("number");
    expect(result).toBeGreaterThanOrEqual(-1);
    expect(result).toBeLessThanOrEqual(1);
  });

  it("estimated が undefined のメトリクスは除外される", () => {
    const complexities: ComplexityMetric[] = [
      { estimated: 1 },
      { estimated: undefined },
      { estimated: 5 },
    ];

    const planVsActuals: PlanVsActualMetric[] = [
      { planned: 5, actual: 6, variance: 1, varianceRatio: 0.2 },
      { planned: 10, actual: 12, variance: 2, varianceRatio: 0.2 },
      { planned: 8, actual: 7, variance: -1, varianceRatio: -0.125 },
    ];

    const result = calculateComplexityVsPlanVsActualCorrelationPearson(complexities, planVsActuals);

    expect(result).toBeTypeOf("number");
  });

  it("有効なペアが2未満の場合は undefined を返す", () => {
    const complexities: ComplexityMetric[] = [
      { estimated: 1 },
    ];

    const planVsActuals: PlanVsActualMetric[] = [
      { planned: 5, actual: 6, variance: 1, varianceRatio: 0.2 },
    ];

    const result = calculateComplexityVsPlanVsActualCorrelationPearson(complexities, planVsActuals);

    expect(result).toBeUndefined();
  });

  it("空配列の場合は undefined を返す", () => {
    const complexities: ComplexityMetric[] = [];
    const planVsActuals: PlanVsActualMetric[] = [];

    const result = calculateComplexityVsPlanVsActualCorrelationPearson(complexities, planVsActuals);

    expect(result).toBeUndefined();
  });
});

