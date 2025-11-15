import { describe, expect, it } from "vitest";
import type { CommentCountMetric } from "@github-project-metrics/ghpm-metrics";
import { calculateCommentCountPercentile } from "./index.js";

describe("calculateCommentCountPercentile", () => {
  it("複数のメトリクスから各フィールドのパーセンタイルを計算する", () => {
    const metrics: CommentCountMetric[] = [
      { total: 5, participantCount: 2 },
      { total: 10, participantCount: 3 },
      { total: 7, participantCount: 1 },
      { total: 8, participantCount: 4 },
    ];

    const result = calculateCommentCountPercentile(metrics, 50);

    expect(result).toBeDefined();
    expect(result?.total).toBeTypeOf("number");
    expect(result?.participantCount).toBeTypeOf("number");
  });

  it("0パーセンタイルは最小値を返す", () => {
    const metrics: CommentCountMetric[] = [
      { total: 5, participantCount: 2 },
      { total: 10, participantCount: 3 },
      { total: 7, participantCount: 1 },
    ];

    const result = calculateCommentCountPercentile(metrics, 0);

    expect(result).toEqual({
      total: 5,
      participantCount: 1,
    });
  });

  it("100パーセンタイルは最大値を返す", () => {
    const metrics: CommentCountMetric[] = [
      { total: 5, participantCount: 2 },
      { total: 10, participantCount: 3 },
      { total: 7, participantCount: 1 },
    ];

    const result = calculateCommentCountPercentile(metrics, 100);

    expect(result).toEqual({
      total: 10,
      participantCount: 3,
    });
  });

  it("単一のメトリクスの場合はその値がパーセンタイルになる", () => {
    const metrics: CommentCountMetric[] = [
      { total: 5, participantCount: 2 },
    ];

    const result = calculateCommentCountPercentile(metrics, 50);

    expect(result).toEqual({
      total: 5,
      participantCount: 2,
    });
  });

  it("空配列の場合は undefined を返す", () => {
    const metrics: CommentCountMetric[] = [];

    const result = calculateCommentCountPercentile(metrics, 50);

    expect(result).toBeUndefined();
  });
});

