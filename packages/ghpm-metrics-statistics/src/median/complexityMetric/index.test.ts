import { describe, expect, it } from "vitest";
import type { ComplexityMetric } from "@github-project-metrics/ghpm-metrics";
import { calculateComplexityMedian } from "./index.js";

describe("calculateComplexityMedian", () => {
  it("複数のメトリクスから estimated の中央値を計算する", () => {
    const metrics: ComplexityMetric[] = [
      { estimated: 1 },
      { estimated: 3 },
      { estimated: 5 },
    ];

    const result = calculateComplexityMedian(metrics);

    expect(result).toEqual({
      estimated: 3,
    });
  });

  it("偶数個のメトリクスの場合は平均値が中央値になる", () => {
    const metrics: ComplexityMetric[] = [
      { estimated: 1 },
      { estimated: 3 },
      { estimated: 5 },
      { estimated: 7 },
    ];

    const result = calculateComplexityMedian(metrics);

    expect(result).toEqual({
      estimated: (3 + 5) / 2,
    });
  });

  it("estimated が undefined のメトリクスは除外される", () => {
    const metrics: ComplexityMetric[] = [
      { estimated: 1 },
      { estimated: undefined },
      { estimated: 5 },
    ];

    const result = calculateComplexityMedian(metrics);

    expect(result).toEqual({
      estimated: (1 + 5) / 2,
    });
  });

  it("単一のメトリクスの場合はその値が中央値になる", () => {
    const metrics: ComplexityMetric[] = [{ estimated: 3 }];

    const result = calculateComplexityMedian(metrics);

    expect(result).toEqual({
      estimated: 3,
    });
  });

  it("空配列の場合は undefined を返す", () => {
    const metrics: ComplexityMetric[] = [];

    const result = calculateComplexityMedian(metrics);

    expect(result).toBeUndefined();
  });

  it("すべてのメトリクスの estimated が undefined の場合は undefined を返す", () => {
    const metrics: ComplexityMetric[] = [
      { estimated: undefined },
      { estimated: undefined },
    ];

    const result = calculateComplexityMedian(metrics);

    expect(result).toBeUndefined();
  });
});

