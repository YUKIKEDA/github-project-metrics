import { describe, expect, it } from "vitest";
import type { ComplexityMetric } from "@github-project-metrics/ghpm-metrics";
import { calculateComplexityMin } from "./index.js";

describe("calculateComplexityMin", () => {
  it("複数のメトリクスから estimated の最小値を計算する", () => {
    const metrics: ComplexityMetric[] = [
      { estimated: 1 },
      { estimated: 3 },
      { estimated: 5 },
    ];

    const result = calculateComplexityMin(metrics);

    expect(result).toEqual({
      estimated: 1,
    });
  });

  it("estimated が undefined のメトリクスは除外される", () => {
    const metrics: ComplexityMetric[] = [
      { estimated: 1 },
      { estimated: undefined },
      { estimated: 5 },
    ];

    const result = calculateComplexityMin(metrics);

    expect(result).toEqual({
      estimated: 1,
    });
  });

  it("単一のメトリクスの場合はその値が最小値になる", () => {
    const metrics: ComplexityMetric[] = [{ estimated: 3 }];

    const result = calculateComplexityMin(metrics);

    expect(result).toEqual({
      estimated: 3,
    });
  });

  it("空配列の場合は undefined を返す", () => {
    const metrics: ComplexityMetric[] = [];

    const result = calculateComplexityMin(metrics);

    expect(result).toBeUndefined();
  });

  it("すべてのメトリクスの estimated が undefined の場合は undefined を返す", () => {
    const metrics: ComplexityMetric[] = [
      { estimated: undefined },
      { estimated: undefined },
    ];

    const result = calculateComplexityMin(metrics);

    expect(result).toBeUndefined();
  });
});

