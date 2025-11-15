import { describe, expect, it } from "vitest";
import type { ComplexityMetric, ReviewTimeMetric } from "@github-project-metrics/ghpm-metrics";
import { calculateComplexityVsReviewTimeCorrelationPearson } from "./index.js";

describe("calculateComplexityVsReviewTimeCorrelationPearson", () => {
  it("複数のメトリクスから相関係数を計算する", () => {
    const complexities: ComplexityMetric[] = [
      { estimated: 1 },
      { estimated: 3 },
      { estimated: 5 },
    ];

    const reviewTimes: ReviewTimeMetric[] = [
      {
        duration: 3600000,
        reviewRequestedAt: "2024-01-01T00:00:00Z",
        reviewMergedAt: "2024-01-01T01:00:00Z",
      },
      {
        duration: 7200000,
        reviewRequestedAt: "2024-01-01T00:00:00Z",
        reviewMergedAt: "2024-01-01T02:00:00Z",
      },
      {
        duration: 1800000,
        reviewRequestedAt: "2024-01-01T00:00:00Z",
        reviewMergedAt: "2024-01-01T00:30:00Z",
      },
    ];

    const result = calculateComplexityVsReviewTimeCorrelationPearson(complexities, reviewTimes);

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

    const reviewTimes: ReviewTimeMetric[] = [
      {
        duration: 3600000,
        reviewRequestedAt: "2024-01-01T00:00:00Z",
        reviewMergedAt: "2024-01-01T01:00:00Z",
      },
      {
        duration: 7200000,
        reviewRequestedAt: "2024-01-01T00:00:00Z",
        reviewMergedAt: "2024-01-01T02:00:00Z",
      },
      {
        duration: 1800000,
        reviewRequestedAt: "2024-01-01T00:00:00Z",
        reviewMergedAt: "2024-01-01T00:30:00Z",
      },
    ];

    const result = calculateComplexityVsReviewTimeCorrelationPearson(complexities, reviewTimes);

    expect(result).toBeTypeOf("number");
  });

  it("有効なペアが2未満の場合は undefined を返す", () => {
    const complexities: ComplexityMetric[] = [
      { estimated: 1 },
    ];

    const reviewTimes: ReviewTimeMetric[] = [
      {
        duration: 3600000,
        reviewRequestedAt: "2024-01-01T00:00:00Z",
        reviewMergedAt: "2024-01-01T01:00:00Z",
      },
    ];

    const result = calculateComplexityVsReviewTimeCorrelationPearson(complexities, reviewTimes);

    expect(result).toBeUndefined();
  });

  it("空配列の場合は undefined を返す", () => {
    const complexities: ComplexityMetric[] = [];
    const reviewTimes: ReviewTimeMetric[] = [];

    const result = calculateComplexityVsReviewTimeCorrelationPearson(complexities, reviewTimes);

    expect(result).toBeUndefined();
  });
});

