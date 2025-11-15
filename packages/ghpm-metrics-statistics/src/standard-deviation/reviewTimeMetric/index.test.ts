import { describe, expect, it } from "vitest";
import type { ReviewTimeMetric } from "@github-project-metrics/ghpm-metrics";
import { calculateReviewTimeStandardDeviation } from "./index.js";

describe("calculateReviewTimeStandardDeviation", () => {
  it("複数のメトリクスから duration の標準偏差を計算する", () => {
    const metrics: ReviewTimeMetric[] = [
      {
        duration: 3600000, // 1時間
        reviewRequestedAt: "2024-01-01T00:00:00Z",
        reviewMergedAt: "2024-01-01T01:00:00Z",
      },
      {
        duration: 7200000, // 2時間
        reviewRequestedAt: "2024-01-01T00:00:00Z",
        reviewMergedAt: "2024-01-01T02:00:00Z",
      },
      {
        duration: 1800000, // 0.5時間
        reviewRequestedAt: "2024-01-01T00:00:00Z",
        reviewMergedAt: "2024-01-01T00:30:00Z",
      },
      {
        duration: 10800000, // 3時間
        reviewRequestedAt: "2024-01-01T00:00:00Z",
        reviewMergedAt: "2024-01-01T03:00:00Z",
      },
    ];

    const result = calculateReviewTimeStandardDeviation(metrics);

    expect(result).toBeDefined();
    expect(result?.duration).toBeTypeOf("number");
  });

  it("要素数が2未満の場合は undefined を返す", () => {
    const metrics: ReviewTimeMetric[] = [
      {
        duration: 3600000,
        reviewRequestedAt: "2024-01-01T00:00:00Z",
        reviewMergedAt: "2024-01-01T01:00:00Z",
      },
    ];

    const result = calculateReviewTimeStandardDeviation(metrics);

    expect(result).toBeUndefined();
  });

  it("空配列の場合は undefined を返す", () => {
    const metrics: ReviewTimeMetric[] = [];

    const result = calculateReviewTimeStandardDeviation(metrics);

    expect(result).toBeUndefined();
  });
});

