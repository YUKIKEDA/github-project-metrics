import { describe, expect, it } from "vitest";
import type { CommentCountMetric } from "@github-project-metrics/ghpm-metrics";
import { calculateCommentCountInterquartileRange } from "./index.js";

describe("calculateCommentCountInterquartileRange", () => {
  it("複数のメトリクスから各フィールドの四分位範囲を計算する", () => {
    const metrics: CommentCountMetric[] = [
      { total: 5, participantCount: 2 },
      { total: 10, participantCount: 3 },
      { total: 7, participantCount: 1 },
      { total: 8, participantCount: 4 },
      { total: 6, participantCount: 2 },
    ];

    const result = calculateCommentCountInterquartileRange(metrics);

    expect(result).toBeDefined();
    expect(result?.total).toBeTypeOf("number");
    expect(result?.participantCount).toBeTypeOf("number");
  });

  it("単一のメトリクスの場合は 0 を返す", () => {
    const metrics: CommentCountMetric[] = [
      { total: 5, participantCount: 2 },
    ];

    const result = calculateCommentCountInterquartileRange(metrics);

    expect(result).toEqual({
      total: 0,
      participantCount: 0,
    });
  });

  it("空配列の場合は undefined を返す", () => {
    const metrics: CommentCountMetric[] = [];

    const result = calculateCommentCountInterquartileRange(metrics);

    expect(result).toBeUndefined();
  });
});

