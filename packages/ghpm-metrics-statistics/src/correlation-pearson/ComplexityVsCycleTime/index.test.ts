import { describe, expect, it } from "vitest";
import type { ComplexityMetric, CycleTimeMetric } from "@github-project-metrics/ghpm-metrics";
import { calculateComplexityVsCycleTimeCorrelationPearson } from "./index.js";

describe("calculateComplexityVsCycleTimeCorrelationPearson", () => {
  it("複数のメトリクスから相関係数を計算する", () => {
    const complexities: ComplexityMetric[] = [
      { estimated: 1 },
      { estimated: 3 },
      { estimated: 5 },
    ];

    const cycleTimes: CycleTimeMetric[] = [
      {
        durationMs: 86400000,
        startedAt: "2024-01-01T00:00:00Z",
        completedAt: "2024-01-02T00:00:00Z",
      },
      {
        durationMs: 172800000,
        startedAt: "2024-01-01T00:00:00Z",
        completedAt: "2024-01-03T00:00:00Z",
      },
      {
        durationMs: 43200000,
        startedAt: "2024-01-01T00:00:00Z",
        completedAt: "2024-01-01T12:00:00Z",
      },
    ];

    const result = calculateComplexityVsCycleTimeCorrelationPearson(complexities, cycleTimes);

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

    const cycleTimes: CycleTimeMetric[] = [
      {
        durationMs: 86400000,
        startedAt: "2024-01-01T00:00:00Z",
        completedAt: "2024-01-02T00:00:00Z",
      },
      {
        durationMs: 172800000,
        startedAt: "2024-01-01T00:00:00Z",
        completedAt: "2024-01-03T00:00:00Z",
      },
      {
        durationMs: 43200000,
        startedAt: "2024-01-01T00:00:00Z",
        completedAt: "2024-01-01T12:00:00Z",
      },
    ];

    const result = calculateComplexityVsCycleTimeCorrelationPearson(complexities, cycleTimes);

    expect(result).toBeTypeOf("number");
  });

  it("有効なペアが2未満の場合は undefined を返す", () => {
    const complexities: ComplexityMetric[] = [
      { estimated: 1 },
    ];

    const cycleTimes: CycleTimeMetric[] = [
      {
        durationMs: 86400000,
        startedAt: "2024-01-01T00:00:00Z",
        completedAt: "2024-01-02T00:00:00Z",
      },
    ];

    const result = calculateComplexityVsCycleTimeCorrelationPearson(complexities, cycleTimes);

    expect(result).toBeUndefined();
  });

  it("空配列の場合は undefined を返す", () => {
    const complexities: ComplexityMetric[] = [];
    const cycleTimes: CycleTimeMetric[] = [];

    const result = calculateComplexityVsCycleTimeCorrelationPearson(complexities, cycleTimes);

    expect(result).toBeUndefined();
  });
});

