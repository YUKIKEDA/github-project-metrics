import { describe, expect, it } from "vitest";
import type { ComplexityMetric } from "@github-project-metrics/ghpm-metrics";
import { calculateComplexityKurtosis } from "./index.js";

describe("calculateComplexityKurtosis", () => {
  it("複数のメトリクスから estimated の尖度を計算する", () => {
    const metrics: ComplexityMetric[] = [
      { estimated: 1 },
      { estimated: 3 },
      { estimated: 5 },
      { estimated: 7 },
      { estimated: 2 },
    ];

    const result = calculateComplexityKurtosis(metrics);

    expect(result).toBeDefined();
    expect(result?.estimated).toBeTypeOf("number");
  });

  it("estimated が undefined のメトリクスは除外される", () => {
    const metrics: ComplexityMetric[] = [
      { estimated: 1 },
      { estimated: undefined },
      { estimated: 3 },
      { estimated: 5 },
      { estimated: 7 },
    ];

    const result = calculateComplexityKurtosis(metrics);

    expect(result).toBeDefined();
    expect(result?.estimated).toBeTypeOf("number");
  });

  it("要素数が4未満の場合は undefined を返す", () => {
    const metrics: ComplexityMetric[] = [
      { estimated: 1 },
      { estimated: 3 },
      { estimated: 5 },
    ];

    const result = calculateComplexityKurtosis(metrics);

    expect(result).toBeUndefined();
  });

  it("空配列の場合は undefined を返す", () => {
    const metrics: ComplexityMetric[] = [];

    const result = calculateComplexityKurtosis(metrics);

    expect(result).toBeUndefined();
  });

  it("すべてのメトリクスの estimated が undefined の場合は undefined を返す", () => {
    const metrics: ComplexityMetric[] = [
      { estimated: undefined },
      { estimated: undefined },
    ];

    const result = calculateComplexityKurtosis(metrics);

    expect(result).toBeUndefined();
  });
});

