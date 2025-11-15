import { describe, expect, it } from "vitest";
import type { PlanVsActualMetric, ReviewTimeMetric } from "@github-project-metrics/ghpm-metrics";
import { calculatePlanVsActualVsReviewTimeCorrelationPearson } from "./index.js";

describe("calculatePlanVsActualVsReviewTimeCorrelationPearson", () => {
  it("複数のメトリクスから相関係数を計算する", () => {
    const planVsActuals: PlanVsActualMetric[] = [
      { planned: 5, actual: 6, variance: 1, varianceRatio: 0.2 },
      { planned: 10, actual: 12, variance: 2, varianceRatio: 0.2 },
      { planned: 8, actual: 7, variance: -1, varianceRatio: -0.125 },
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

    const result = calculatePlanVsActualVsReviewTimeCorrelationPearson(planVsActuals, reviewTimes);

    expect(result).toBeTypeOf("number");
    expect(result).toBeGreaterThanOrEqual(-1);
    expect(result).toBeLessThanOrEqual(1);
  });

  it("有効なペアが2未満の場合は undefined を返す", () => {
    const planVsActuals: PlanVsActualMetric[] = [
      { planned: 5, actual: 6, variance: 1, varianceRatio: 0.2 },
    ];

    const reviewTimes: ReviewTimeMetric[] = [
      {
        duration: 3600000,
        reviewRequestedAt: "2024-01-01T00:00:00Z",
        reviewMergedAt: "2024-01-01T01:00:00Z",
      },
    ];

    const result = calculatePlanVsActualVsReviewTimeCorrelationPearson(planVsActuals, reviewTimes);

    expect(result).toBeUndefined();
  });

  it("空配列の場合は undefined を返す", () => {
    const planVsActuals: PlanVsActualMetric[] = [];
    const reviewTimes: ReviewTimeMetric[] = [];

    const result = calculatePlanVsActualVsReviewTimeCorrelationPearson(planVsActuals, reviewTimes);

    expect(result).toBeUndefined();
  });
});

