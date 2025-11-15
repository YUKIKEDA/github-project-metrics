import { describe, expect, it } from "vitest";
import type { ReviewTimeMetric } from "@github-project-metrics/ghpm-metrics";
import { calculateReviewTimeOutliersIQR } from "./index.js";

describe("calculateReviewTimeOutliersIQR", () => {
  it("複数のメトリクスから duration の外れ値を検出する", () => {
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
      {
        duration: 86400000000, // 1000時間（外れ値）
        reviewRequestedAt: "2024-01-01T00:00:00Z",
        reviewMergedAt: "2024-02-10T16:00:00Z",
      },
    ];

    const result = calculateReviewTimeOutliersIQR(metrics);

    expect(result).toBeDefined();
    expect(result?.duration).toBeInstanceOf(Array);
  });

  it("外れ値がない場合は空配列を返す", () => {
    const metrics: ReviewTimeMetric[] = [
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

    const result = calculateReviewTimeOutliersIQR(metrics);

    expect(result).toBeDefined();
    expect(result?.duration).toEqual([]);
  });

  it("単一のメトリクスの場合は空配列を返す", () => {
    const metrics: ReviewTimeMetric[] = [
      {
        duration: 3600000,
        reviewRequestedAt: "2024-01-01T00:00:00Z",
        reviewMergedAt: "2024-01-01T01:00:00Z",
      },
    ];

    const result = calculateReviewTimeOutliersIQR(metrics);

    expect(result).toBeDefined();
    expect(result?.duration).toEqual([]);
  });

  it("空配列の場合は undefined を返す", () => {
    const metrics: ReviewTimeMetric[] = [];

    const result = calculateReviewTimeOutliersIQR(metrics);

    expect(result).toBeUndefined();
  });
});

