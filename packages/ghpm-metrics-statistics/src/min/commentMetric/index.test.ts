import { describe, expect, it } from "vitest";
import type { CommentCountMetric } from "@github-project-metrics/ghpm-metrics";
import { calculateCommentCountMin } from "./index.js";

describe("calculateCommentCountMin", () => {
  it("複数のメトリクスから各フィールドの最小値を計算する", () => {
    const metrics: CommentCountMetric[] = [
      { total: 5, participantCount: 2 },
      { total: 10, participantCount: 3 },
      { total: 7, participantCount: 1 },
    ];

    const result = calculateCommentCountMin(metrics);

    expect(result).toEqual({
      total: 5,
      participantCount: 1,
    });
  });

  it("単一のメトリクスの場合はその値が最小値になる", () => {
    const metrics: CommentCountMetric[] = [
      { total: 5, participantCount: 2 },
    ];

    const result = calculateCommentCountMin(metrics);

    expect(result).toEqual({
      total: 5,
      participantCount: 2,
    });
  });

  it("空配列の場合は undefined を返す", () => {
    const metrics: CommentCountMetric[] = [];

    const result = calculateCommentCountMin(metrics);

    expect(result).toBeUndefined();
  });
});

