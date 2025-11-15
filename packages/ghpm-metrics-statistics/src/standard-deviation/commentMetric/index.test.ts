import { describe, expect, it } from "vitest";
import type { CommentCountMetric } from "@github-project-metrics/ghpm-metrics";
import { calculateCommentCountStandardDeviation } from "./index.js";

describe("calculateCommentCountStandardDeviation", () => {
  it("複数のメトリクスから各フィールドの標準偏差を計算する", () => {
    const metrics: CommentCountMetric[] = [
      { total: 5, participantCount: 2 },
      { total: 10, participantCount: 3 },
      { total: 7, participantCount: 1 },
      { total: 8, participantCount: 4 },
    ];

    const result = calculateCommentCountStandardDeviation(metrics);

    expect(result).toBeDefined();
    expect(result?.total).toBeTypeOf("number");
    expect(result?.participantCount).toBeTypeOf("number");
  });

  it("要素数が2未満の場合は undefined を返す", () => {
    const metrics: CommentCountMetric[] = [
      { total: 5, participantCount: 2 },
    ];

    const result = calculateCommentCountStandardDeviation(metrics);

    expect(result).toBeUndefined();
  });

  it("空配列の場合は undefined を返す", () => {
    const metrics: CommentCountMetric[] = [];

    const result = calculateCommentCountStandardDeviation(metrics);

    expect(result).toBeUndefined();
  });
});

