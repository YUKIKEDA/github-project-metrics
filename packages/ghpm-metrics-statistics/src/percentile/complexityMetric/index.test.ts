import { describe, expect, it } from "vitest";
import type { ComplexityMetric } from "@github-project-metrics/ghpm-metrics";
import { calculateComplexityPercentile } from "./index.js";

describe("calculateComplexityPercentile", () => {
  it("複数のメトリクスから estimated のパーセンタイルを計算する", () => {
    const metrics: ComplexityMetric[] = [
      { estimated: 1 },
      { estimated: 3 },
      { estimated: 5 },
      { estimated: 7 },
    ];

    const result = calculateComplexityPercentile(metrics, 50);

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

    const result = calculateComplexityPercentile(metrics, 50);

    expect(result).toBeDefined();
    expect(result?.estimated).toBeTypeOf("number");
  });

  it("0パーセンタイルは最小値を返す", () => {
    const metrics: ComplexityMetric[] = [
      { estimated: 1 },
      { estimated: 3 },
      { estimated: 5 },
    ];

    const result = calculateComplexityPercentile(metrics, 0);

    expect(result).toEqual({
      estimated: 1,
    });
  });

  it("100パーセンタイルは最大値を返す", () => {
    const metrics: ComplexityMetric[] = [
      { estimated: 1 },
      { estimated: 3 },
      { estimated: 5 },
    ];

    const result = calculateComplexityPercentile(metrics, 100);

    expect(result).toEqual({
      estimated: 5,
    });
  });

  it("単一のメトリクスの場合はその値がパーセンタイルになる", () => {
    const metrics: ComplexityMetric[] = [{ estimated: 3 }];

    const result = calculateComplexityPercentile(metrics, 50);

    expect(result).toEqual({
      estimated: 3,
    });
  });

  it("空配列の場合は undefined を返す", () => {
    const metrics: ComplexityMetric[] = [];

    const result = calculateComplexityPercentile(metrics, 50);

    expect(result).toBeUndefined();
  });

  it("すべてのメトリクスの estimated が undefined の場合は undefined を返す", () => {
    const metrics: ComplexityMetric[] = [
      { estimated: undefined },
      { estimated: undefined },
    ];

    const result = calculateComplexityPercentile(metrics, 50);

    expect(result).toBeUndefined();
  });
});

