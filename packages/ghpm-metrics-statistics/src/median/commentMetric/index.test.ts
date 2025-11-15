import { describe, expect, it } from "vitest";
import type { CommentCountMetric } from "@github-project-metrics/ghpm-metrics";
import { calculateCommentCountMedian } from "./index.js";

describe("calculateCommentCountMedian", () => {
  it("複数のメトリクスから各フィールドの中央値を計算する", () => {
    const metrics: CommentCountMetric[] = [
      { total: 5, participantCount: 2 },
      { total: 10, participantCount: 3 },
      { total: 7, participantCount: 1 },
    ];

    const result = calculateCommentCountMedian(metrics);

    expect(result).toEqual({
      total: 7,
      participantCount: 2,
    });
  });

  it("偶数個のメトリクスの場合は平均値が中央値になる", () => {
    const metrics: CommentCountMetric[] = [
      { total: 5, participantCount: 2 },
      { total: 10, participantCount: 3 },
      { total: 7, participantCount: 1 },
      { total: 8, participantCount: 4 },
    ];

    const result = calculateCommentCountMedian(metrics);

    expect(result).toEqual({
      total: (7 + 8) / 2,
      participantCount: (2 + 3) / 2,
    });
  });

  it("単一のメトリクスの場合はその値が中央値になる", () => {
    const metrics: CommentCountMetric[] = [
      { total: 5, participantCount: 2 },
    ];

    const result = calculateCommentCountMedian(metrics);

    expect(result).toEqual({
      total: 5,
      participantCount: 2,
    });
  });

  it("空配列の場合は undefined を返す", () => {
    const metrics: CommentCountMetric[] = [];

    const result = calculateCommentCountMedian(metrics);

    expect(result).toBeUndefined();
  });
});

