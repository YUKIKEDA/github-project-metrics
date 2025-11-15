import { describe, expect, it } from "vitest";
import type { ComplexityMetric } from "@github-project-metrics/ghpm-metrics";
import { calculateComplexityInterquartileRange } from "./index.js";

describe("calculateComplexityInterquartileRange", () => {
  it("複数のメトリクスから estimated の四分位範囲を計算する", () => {
    const metrics: ComplexityMetric[] = [
      { estimated: 1 },
      { estimated: 3 },
      { estimated: 5 },
      { estimated: 7 },
      { estimated: 9 },
    ];

    const result = calculateComplexityInterquartileRange(metrics);

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

    const result = calculateComplexityInterquartileRange(metrics);

    expect(result).toBeDefined();
    expect(result?.estimated).toBeTypeOf("number");
  });

  it("単一のメトリクスの場合は 0 を返す", () => {
    const metrics: ComplexityMetric[] = [{ estimated: 3 }];

    const result = calculateComplexityInterquartileRange(metrics);

    expect(result).toEqual({
      estimated: 0,
    });
  });

  it("空配列の場合は undefined を返す", () => {
    const metrics: ComplexityMetric[] = [];

    const result = calculateComplexityInterquartileRange(metrics);

    expect(result).toBeUndefined();
  });

  it("すべてのメトリクスの estimated が undefined の場合は undefined を返す", () => {
    const metrics: ComplexityMetric[] = [
      { estimated: undefined },
      { estimated: undefined },
    ];

    const result = calculateComplexityInterquartileRange(metrics);

    expect(result).toBeUndefined();
  });
});

