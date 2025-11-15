import { describe, expect, it } from "vitest";
import type { ComplexityMetric, LeadTimeMetric } from "@github-project-metrics/ghpm-metrics";
import { calculateComplexityVsLeadTimeCorrelationPearson } from "./index.js";

describe("calculateComplexityVsLeadTimeCorrelationPearson", () => {
  it("複数のメトリクスから相関係数を計算する", () => {
    const complexities: ComplexityMetric[] = [
      { estimated: 1 },
      { estimated: 3 },
      { estimated: 5 },
    ];

    const leadTimes: LeadTimeMetric[] = [
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

    const result = calculateComplexityVsLeadTimeCorrelationPearson(complexities, leadTimes);

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

    const leadTimes: LeadTimeMetric[] = [
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

    const result = calculateComplexityVsLeadTimeCorrelationPearson(complexities, leadTimes);

    expect(result).toBeTypeOf("number");
  });

  it("有効なペアが2未満の場合は undefined を返す", () => {
    const complexities: ComplexityMetric[] = [
      { estimated: 1 },
    ];

    const leadTimes: LeadTimeMetric[] = [
      {
        durationMs: 86400000,
        startedAt: "2024-01-01T00:00:00Z",
        completedAt: "2024-01-02T00:00:00Z",
      },
    ];

    const result = calculateComplexityVsLeadTimeCorrelationPearson(complexities, leadTimes);

    expect(result).toBeUndefined();
  });

  it("空配列の場合は undefined を返す", () => {
    const complexities: ComplexityMetric[] = [];
    const leadTimes: LeadTimeMetric[] = [];

    const result = calculateComplexityVsLeadTimeCorrelationPearson(complexities, leadTimes);

    expect(result).toBeUndefined();
  });
});

