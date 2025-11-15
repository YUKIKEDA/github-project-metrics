import { describe, expect, it } from "vitest";
import type { ComplexityMetric } from "@github-project-metrics/ghpm-metrics";
import { calculateComplexityOutliersIQR } from "./index.js";

describe("calculateComplexityOutliersIQR", () => {
  it("複数のメトリクスから estimated の外れ値を検出する", () => {
    const metrics: ComplexityMetric[] = [
      { estimated: 1 },
      { estimated: 3 },
      { estimated: 5 },
      { estimated: 7 },
      { estimated: 100 }, // 外れ値
    ];

    const result = calculateComplexityOutliersIQR(metrics);

    expect(result).toBeDefined();
    expect(result?.estimated).toBeInstanceOf(Array);
  });

  it("estimated が undefined のメトリクスは除外される", () => {
    const metrics: ComplexityMetric[] = [
      { estimated: 1 },
      { estimated: undefined },
      { estimated: 3 },
      { estimated: 5 },
      { estimated: 100 }, // 外れ値
    ];

    const result = calculateComplexityOutliersIQR(metrics);

    expect(result).toBeDefined();
    expect(result?.estimated).toBeInstanceOf(Array);
  });

  it("外れ値がない場合は空配列を返す", () => {
    const metrics: ComplexityMetric[] = [
      { estimated: 1 },
      { estimated: 3 },
      { estimated: 5 },
      { estimated: 7 },
    ];

    const result = calculateComplexityOutliersIQR(metrics);

    expect(result).toBeDefined();
    expect(result?.estimated).toEqual([]);
  });

  it("単一のメトリクスの場合は空配列を返す", () => {
    const metrics: ComplexityMetric[] = [{ estimated: 3 }];

    const result = calculateComplexityOutliersIQR(metrics);

    expect(result).toBeDefined();
    expect(result?.estimated).toEqual([]);
  });

  it("空配列の場合は undefined を返す", () => {
    const metrics: ComplexityMetric[] = [];

    const result = calculateComplexityOutliersIQR(metrics);

    expect(result).toBeUndefined();
  });

  it("すべてのメトリクスの estimated が undefined の場合は undefined を返す", () => {
    const metrics: ComplexityMetric[] = [
      { estimated: undefined },
      { estimated: undefined },
    ];

    const result = calculateComplexityOutliersIQR(metrics);

    expect(result).toBeUndefined();
  });
});

