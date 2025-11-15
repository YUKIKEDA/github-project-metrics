import { describe, expect, it } from "vitest";
import type { ComplexityMetric } from "@github-project-metrics/ghpm-metrics";
import { calculateComplexityMax } from "./index.js";

describe("calculateComplexityMax", () => {
  it("複数のメトリクスから estimated の最大値を計算する", () => {
    const metrics: ComplexityMetric[] = [
      { estimated: 3, unit: "story_point" },
      { estimated: 8, unit: "story_point" },
      { estimated: 5, unit: "story_point" },
    ];

    const result = calculateComplexityMax(metrics);

    expect(result).toEqual({
      estimated: 8,
    });
  });

  it("estimated が undefined のメトリクスは除外される", () => {
    const metrics: ComplexityMetric[] = [
      { estimated: 3, unit: "story_point" },
      { unit: "story_point" },
      { estimated: 8, unit: "story_point" },
    ];

    const result = calculateComplexityMax(metrics);

    expect(result).toEqual({
      estimated: 8,
    });
  });

  it("単一のメトリクスの場合はその値が最大値になる", () => {
    const metrics: ComplexityMetric[] = [
      { estimated: 5, unit: "story_point" },
    ];

    const result = calculateComplexityMax(metrics);

    expect(result).toEqual({
      estimated: 5,
    });
  });

  it("estimated が存在しないメトリクスのみの場合は undefined を返す", () => {
    const metrics: ComplexityMetric[] = [
      { unit: "story_point" },
      { unit: "hour" },
    ];

    const result = calculateComplexityMax(metrics);

    expect(result).toBeUndefined();
  });

  it("空配列の場合は undefined を返す", () => {
    const metrics: ComplexityMetric[] = [];

    const result = calculateComplexityMax(metrics);

    expect(result).toBeUndefined();
  });
});

