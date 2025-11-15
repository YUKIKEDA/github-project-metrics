import { describe, expect, it } from "vitest";
import type { LeadTimeMetric, ReviewTimeMetric } from "@github-project-metrics/ghpm-metrics";
import { calculateLeadTimeVsReviewTimeCorrelationSpearman } from "./index.js";

describe("calculateLeadTimeVsReviewTimeCorrelationSpearman", () => {
  it("複数のメトリクスから相関係数を計算する", () => {
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

    const result = calculateLeadTimeVsReviewTimeCorrelationSpearman(leadTimes, reviewTimes);

    expect(result).toBeTypeOf("number");
    expect(result).toBeGreaterThanOrEqual(-1);
    expect(result).toBeLessThanOrEqual(1);
  });

  it("有効なペアが2未満の場合は undefined を返す", () => {
    const leadTimes: LeadTimeMetric[] = [
      {
        durationMs: 86400000,
        startedAt: "2024-01-01T00:00:00Z",
        completedAt: "2024-01-02T00:00:00Z",
      },
    ];

    const reviewTimes: ReviewTimeMetric[] = [
      {
        duration: 3600000,
        reviewRequestedAt: "2024-01-01T00:00:00Z",
        reviewMergedAt: "2024-01-01T01:00:00Z",
      },
    ];

    const result = calculateLeadTimeVsReviewTimeCorrelationSpearman(leadTimes, reviewTimes);

    expect(result).toBeUndefined();
  });

  it("空配列の場合は undefined を返す", () => {
    const leadTimes: LeadTimeMetric[] = [];
    const reviewTimes: ReviewTimeMetric[] = [];

    const result = calculateLeadTimeVsReviewTimeCorrelationSpearman(leadTimes, reviewTimes);

    expect(result).toBeUndefined();
  });
});

