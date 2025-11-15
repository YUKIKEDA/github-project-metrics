import { describe, expect, it } from "vitest";
import type { CommentCountMetric } from "@github-project-metrics/ghpm-metrics";
import { calculateCommentCountMode } from "./index.js";

describe("calculateCommentCountMode", () => {
  it("複数のメトリクスから各フィールドの最頻値を計算する", () => {
    const metrics: CommentCountMetric[] = [
      { total: 5, participantCount: 2 },
      { total: 10, participantCount: 3 },
      { total: 5, participantCount: 2 },
      { total: 7, participantCount: 1 },
    ];

    const result = calculateCommentCountMode(metrics);

    expect(result).toEqual({
      total: 5,
      participantCount: 2,
    });
  });

  it("単一のメトリクスの場合はその値が最頻値になる", () => {
    const metrics: CommentCountMetric[] = [
      { total: 5, participantCount: 2 },
    ];

    const result = calculateCommentCountMode(metrics);

    expect(result).toEqual({
      total: 5,
      participantCount: 2,
    });
  });

  it("空配列の場合は undefined を返す", () => {
    const metrics: CommentCountMetric[] = [];

    const result = calculateCommentCountMode(metrics);

    expect(result).toBeUndefined();
  });
});

