import { describe, expect, it } from "vitest";
import type { CommentCountMetric, ReviewTimeMetric } from "@github-project-metrics/ghpm-metrics";
import { calculateCommentVsReviewTimeCorrelationSpearman } from "./index.js";

describe("calculateCommentVsReviewTimeCorrelationSpearman", () => {
  it("複数のメトリクスから相関係数を計算する", () => {
    const comments: CommentCountMetric[] = [
      { total: 5, participantCount: 2 },
      { total: 10, participantCount: 3 },
      { total: 7, participantCount: 1 },
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

    const result = calculateCommentVsReviewTimeCorrelationSpearman(comments, reviewTimes);

    expect(result).toBeTypeOf("number");
    expect(result).toBeGreaterThanOrEqual(-1);
    expect(result).toBeLessThanOrEqual(1);
  });

  it("有効なペアが2未満の場合は undefined を返す", () => {
    const comments: CommentCountMetric[] = [
      { total: 5, participantCount: 2 },
    ];

    const reviewTimes: ReviewTimeMetric[] = [
      {
        duration: 3600000,
        reviewRequestedAt: "2024-01-01T00:00:00Z",
        reviewMergedAt: "2024-01-01T01:00:00Z",
      },
    ];

    const result = calculateCommentVsReviewTimeCorrelationSpearman(comments, reviewTimes);

    expect(result).toBeUndefined();
  });

  it("空配列の場合は undefined を返す", () => {
    const comments: CommentCountMetric[] = [];
    const reviewTimes: ReviewTimeMetric[] = [];

    const result = calculateCommentVsReviewTimeCorrelationSpearman(comments, reviewTimes);

    expect(result).toBeUndefined();
  });
});

