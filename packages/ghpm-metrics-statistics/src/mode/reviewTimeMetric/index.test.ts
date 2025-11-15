import { describe, expect, it } from "vitest";
import type { ReviewTimeMetric } from "@github-project-metrics/ghpm-metrics";
import { calculateReviewTimeMode } from "./index.js";

describe("calculateReviewTimeMode", () => {
  it("複数のメトリクスから duration の最頻値を計算する", () => {
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
        duration: 3600000, // 1時間
        reviewRequestedAt: "2024-01-01T00:00:00Z",
        reviewMergedAt: "2024-01-01T01:00:00Z",
      },
      {
        duration: 1800000, // 0.5時間
        reviewRequestedAt: "2024-01-01T00:00:00Z",
        reviewMergedAt: "2024-01-01T00:30:00Z",
      },
    ];

    const result = calculateReviewTimeMode(metrics);

    expect(result).toEqual({
      duration: 3600000,
    });
  });

  it("単一のメトリクスの場合はその値が最頻値になる", () => {
    const metrics: ReviewTimeMetric[] = [
      {
        duration: 3600000,
        reviewRequestedAt: "2024-01-01T00:00:00Z",
        reviewMergedAt: "2024-01-01T01:00:00Z",
      },
    ];

    const result = calculateReviewTimeMode(metrics);

    expect(result).toEqual({
      duration: 3600000,
    });
  });

  it("空配列の場合は undefined を返す", () => {
    const metrics: ReviewTimeMetric[] = [];

    const result = calculateReviewTimeMode(metrics);

    expect(result).toBeUndefined();
  });
});

