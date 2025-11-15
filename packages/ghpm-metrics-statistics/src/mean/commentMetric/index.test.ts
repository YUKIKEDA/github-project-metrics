import { describe, expect, it } from "vitest";
import type { CommentCountMetric } from "@github-project-metrics/ghpm-metrics";
import { calculateCommentCountMean } from "./index.js";

describe("calculateCommentCountMean", () => {
  it("複数のメトリクスから各フィールドの平均値を計算する", () => {
    const metrics: CommentCountMetric[] = [
      { total: 5, participantCount: 2 },
      { total: 10, participantCount: 3 },
      { total: 7, participantCount: 1 },
    ];

    const result = calculateCommentCountMean(metrics);

    expect(result).toEqual({
      total: (5 + 10 + 7) / 3,
      participantCount: (2 + 3 + 1) / 3,
    });
  });

  it("単一のメトリクスの場合はその値が平均値になる", () => {
    const metrics: CommentCountMetric[] = [
      { total: 5, participantCount: 2 },
    ];

    const result = calculateCommentCountMean(metrics);

    expect(result).toEqual({
      total: 5,
      participantCount: 2,
    });
  });

  it("空配列の場合は undefined を返す", () => {
    const metrics: CommentCountMetric[] = [];

    const result = calculateCommentCountMean(metrics);

    expect(result).toBeUndefined();
  });
});

