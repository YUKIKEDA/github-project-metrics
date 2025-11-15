import { describe, expect, it } from "vitest";
import type { ComplexityMetric } from "@github-project-metrics/ghpm-metrics";
import { calculateComplexityVariance } from "./index.js";

describe("calculateComplexityVariance", () => {
  it("複数のメトリクスから estimated の分散を計算する", () => {
    const metrics: ComplexityMetric[] = [
      { estimated: 1 },
      { estimated: 3 },
      { estimated: 5 },
      { estimated: 7 },
    ];

    const result = calculateComplexityVariance(metrics);

    expect(result).toBeDefined();
    expect(result?.estimated).toBeTypeOf("number");
  });

  it("estimated が undefined のメトリクスは除外される", () => {
    const metrics: ComplexityMetric[] = [
      { estimated: 1 },
      { estimated: undefined },
      { estimated: 3 },
      { estimated: 5 },
    ];

    const result = calculateComplexityVariance(metrics);

    expect(result).toBeDefined();
    expect(result?.estimated).toBeTypeOf("number");
  });

  it("要素数が2未満の場合は undefined を返す", () => {
    const metrics: ComplexityMetric[] = [{ estimated: 1 }];

    const result = calculateComplexityVariance(metrics);

    expect(result).toBeUndefined();
  });

  it("空配列の場合は undefined を返す", () => {
    const metrics: ComplexityMetric[] = [];

    const result = calculateComplexityVariance(metrics);

    expect(result).toBeUndefined();
  });

  it("すべてのメトリクスの estimated が undefined の場合は undefined を返す", () => {
    const metrics: ComplexityMetric[] = [
      { estimated: undefined },
      { estimated: undefined },
    ];

    const result = calculateComplexityVariance(metrics);

    expect(result).toBeUndefined();
  });
});

