import { describe, expect, it } from "vitest";
import type { CommentCountMetric } from "@github-project-metrics/ghpm-metrics";
import { calculateCommentCountKurtosis } from "./index.js";

describe("calculateCommentCountKurtosis", () => {
  it("複数のメトリクスから各フィールドの尖度を計算する", () => {
    const metrics: CommentCountMetric[] = [
      { total: 5, participantCount: 2 },
      { total: 10, participantCount: 3 },
      { total: 7, participantCount: 1 },
      { total: 8, participantCount: 4 },
      { total: 6, participantCount: 2 },
    ];

    const result = calculateCommentCountKurtosis(metrics);

    expect(result).toBeDefined();
    expect(result?.total).toBeTypeOf("number");
    expect(result?.participantCount).toBeTypeOf("number");
  });

  it("要素数が4未満の場合は undefined を返す", () => {
    const metrics: CommentCountMetric[] = [
      { total: 5, participantCount: 2 },
      { total: 10, participantCount: 3 },
      { total: 7, participantCount: 1 },
    ];

    const result = calculateCommentCountKurtosis(metrics);

    expect(result).toBeUndefined();
  });

  it("空配列の場合は undefined を返す", () => {
    const metrics: CommentCountMetric[] = [];

    const result = calculateCommentCountKurtosis(metrics);

    expect(result).toBeUndefined();
  });
});

