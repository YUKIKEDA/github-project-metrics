import { describe, expect, it } from "vitest";
import type { CommentCountMetric } from "@github-project-metrics/ghpm-metrics";
import { calculateCommentCountMax } from "./index.js";

describe("calculateCommentCountMax", () => {
  it("複数のメトリクスから各フィールドの最大値を計算する", () => {
    const metrics: CommentCountMetric[] = [
      { total: 5, participantCount: 2 },
      { total: 10, participantCount: 3 },
      { total: 7, participantCount: 1 },
    ];

    const result = calculateCommentCountMax(metrics);

    expect(result).toEqual({
      total: 10,
      participantCount: 3,
    });
  });

  it("単一のメトリクスの場合はその値が最大値になる", () => {
    const metrics: CommentCountMetric[] = [
      { total: 5, participantCount: 2 },
    ];

    const result = calculateCommentCountMax(metrics);

    expect(result).toEqual({
      total: 5,
      participantCount: 2,
    });
  });

  it("空配列の場合は undefined を返す", () => {
    const metrics: CommentCountMetric[] = [];

    const result = calculateCommentCountMax(metrics);

    expect(result).toBeUndefined();
  });
});

