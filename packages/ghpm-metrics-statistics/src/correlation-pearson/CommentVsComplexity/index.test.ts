import { describe, expect, it } from "vitest";
import type { CommentCountMetric, ComplexityMetric } from "@github-project-metrics/ghpm-metrics";
import { calculateCommentVsComplexityCorrelationPearson } from "./index.js";

describe("calculateCommentVsComplexityCorrelationPearson", () => {
  it("複数のメトリクスから相関係数を計算する", () => {
    const comments: CommentCountMetric[] = [
      { total: 5, participantCount: 2 },
      { total: 10, participantCount: 3 },
      { total: 7, participantCount: 1 },
    ];

    const complexities: ComplexityMetric[] = [
      { estimated: 1 },
      { estimated: 3 },
      { estimated: 5 },
    ];

    const result = calculateCommentVsComplexityCorrelationPearson(comments, complexities);

    expect(result).toBeTypeOf("number");
    expect(result).toBeGreaterThanOrEqual(-1);
    expect(result).toBeLessThanOrEqual(1);
  });

  it("estimated が undefined のメトリクスは除外される", () => {
    const comments: CommentCountMetric[] = [
      { total: 5, participantCount: 2 },
      { total: 10, participantCount: 3 },
      { total: 7, participantCount: 1 },
    ];

    const complexities: ComplexityMetric[] = [
      { estimated: 1 },
      { estimated: undefined },
      { estimated: 5 },
    ];

    const result = calculateCommentVsComplexityCorrelationPearson(comments, complexities);

    expect(result).toBeTypeOf("number");
  });

  it("有効なペアが2未満の場合は undefined を返す", () => {
    const comments: CommentCountMetric[] = [
      { total: 5, participantCount: 2 },
    ];

    const complexities: ComplexityMetric[] = [
      { estimated: 1 },
    ];

    const result = calculateCommentVsComplexityCorrelationPearson(comments, complexities);

    expect(result).toBeUndefined();
  });

  it("空配列の場合は undefined を返す", () => {
    const comments: CommentCountMetric[] = [];
    const complexities: ComplexityMetric[] = [];

    const result = calculateCommentVsComplexityCorrelationPearson(comments, complexities);

    expect(result).toBeUndefined();
  });
});

