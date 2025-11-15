import { describe, expect, it } from "vitest";
import type { ReviewTimeMetric } from "@github-project-metrics/ghpm-metrics";
import { calculateReviewTimePercentile } from "./index.js";

describe("calculateReviewTimePercentile", () => {
  it("複数のメトリクスから duration のパーセンタイルを計算する", () => {
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

    const result = calculateReviewTimePercentile(metrics, 50);

    expect(result).toBeDefined();
    expect(result?.duration).toBeTypeOf("number");
  });

  it("0パーセンタイルは最小値を返す", () => {
    const metrics: ReviewTimeMetric[] = [
      {
        duration: 1800000, // 0.5時間
        reviewRequestedAt: "2024-01-01T00:00:00Z",
        reviewMergedAt: "2024-01-01T00:30:00Z",
      },
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
    ];

    const result = calculateReviewTimePercentile(metrics, 0);

    expect(result).toEqual({
      duration: 1800000,
    });
  });

  it("100パーセンタイルは最大値を返す", () => {
    const metrics: ReviewTimeMetric[] = [
      {
        duration: 1800000, // 0.5時間
        reviewRequestedAt: "2024-01-01T00:00:00Z",
        reviewMergedAt: "2024-01-01T00:30:00Z",
      },
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
    ];

    const result = calculateReviewTimePercentile(metrics, 100);

    expect(result).toEqual({
      duration: 7200000,
    });
  });

  it("単一のメトリクスの場合はその値がパーセンタイルになる", () => {
    const metrics: ReviewTimeMetric[] = [
      {
        duration: 3600000,
        reviewRequestedAt: "2024-01-01T00:00:00Z",
        reviewMergedAt: "2024-01-01T01:00:00Z",
      },
    ];

    const result = calculateReviewTimePercentile(metrics, 50);

    expect(result).toEqual({
      duration: 3600000,
    });
  });

  it("空配列の場合は undefined を返す", () => {
    const metrics: ReviewTimeMetric[] = [];

    const result = calculateReviewTimePercentile(metrics, 50);

    expect(result).toBeUndefined();
  });
});

