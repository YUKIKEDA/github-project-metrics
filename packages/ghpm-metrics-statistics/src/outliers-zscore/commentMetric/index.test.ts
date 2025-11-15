import { describe, expect, it } from "vitest";
import type { CommentCountMetric } from "@github-project-metrics/ghpm-metrics";
import { calculateCommentCountOutliersZScore } from "./index.js";

describe("calculateCommentCountOutliersZScore", () => {
  it("複数のメトリクスから各フィールドの外れ値を検出する", () => {
    const metrics: CommentCountMetric[] = [
      { total: 5, participantCount: 2 },
      { total: 10, participantCount: 3 },
      { total: 7, participantCount: 1 },
      { total: 8, participantCount: 4 },
      { total: 100, participantCount: 20 }, // 外れ値
    ];

    const result = calculateCommentCountOutliersZScore(metrics);

    expect(result).toBeDefined();
    expect(result?.total).toBeInstanceOf(Array);
    expect(result?.participantCount).toBeInstanceOf(Array);
  });

  it("外れ値がない場合は空配列を返す", () => {
    const metrics: CommentCountMetric[] = [
      { total: 5, participantCount: 2 },
      { total: 10, participantCount: 3 },
      { total: 7, participantCount: 1 },
      { total: 8, participantCount: 4 },
    ];

    const result = calculateCommentCountOutliersZScore(metrics);

    expect(result).toBeDefined();
    expect(result?.total).toEqual([]);
    expect(result?.participantCount).toEqual([]);
  });

  it("単一のメトリクスの場合は空配列を返す", () => {
    const metrics: CommentCountMetric[] = [
      { total: 5, participantCount: 2 },
    ];

    const result = calculateCommentCountOutliersZScore(metrics);

    expect(result).toBeDefined();
    expect(result?.total).toEqual([]);
    expect(result?.participantCount).toEqual([]);
  });

  it("空配列の場合は undefined を返す", () => {
    const metrics: CommentCountMetric[] = [];

    const result = calculateCommentCountOutliersZScore(metrics);

    expect(result).toBeUndefined();
  });
});

