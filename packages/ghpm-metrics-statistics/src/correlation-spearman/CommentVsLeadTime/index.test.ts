import { describe, expect, it } from "vitest";
import type { CommentCountMetric, LeadTimeMetric } from "@github-project-metrics/ghpm-metrics";
import { calculateCommentVsLeadTimeCorrelationSpearman } from "./index.js";

describe("calculateCommentVsLeadTimeCorrelationSpearman", () => {
  it("複数のメトリクスから相関係数を計算する", () => {
    const comments: CommentCountMetric[] = [
      { total: 5, participantCount: 2 },
      { total: 10, participantCount: 3 },
      { total: 7, participantCount: 1 },
    ];

    const leadTimes: LeadTimeMetric[] = [
      {
        durationMs: 86400000,
        startedAt: "2024-01-01T00:00:00Z",
        completedAt: "2024-01-02T00:00:00Z",
      },
      {
        durationMs: 172800000,
        startedAt: "2024-01-01T00:00:00Z",
        completedAt: "2024-01-03T00:00:00Z",
      },
      {
        durationMs: 43200000,
        startedAt: "2024-01-01T00:00:00Z",
        completedAt: "2024-01-01T12:00:00Z",
      },
    ];

    const result = calculateCommentVsLeadTimeCorrelationSpearman(comments, leadTimes);

    expect(result).toBeTypeOf("number");
    expect(result).toBeGreaterThanOrEqual(-1);
    expect(result).toBeLessThanOrEqual(1);
  });

  it("有効なペアが2未満の場合は undefined を返す", () => {
    const comments: CommentCountMetric[] = [
      { total: 5, participantCount: 2 },
    ];

    const leadTimes: LeadTimeMetric[] = [
      {
        durationMs: 86400000,
        startedAt: "2024-01-01T00:00:00Z",
        completedAt: "2024-01-02T00:00:00Z",
      },
    ];

    const result = calculateCommentVsLeadTimeCorrelationSpearman(comments, leadTimes);

    expect(result).toBeUndefined();
  });

  it("空配列の場合は undefined を返す", () => {
    const comments: CommentCountMetric[] = [];
    const leadTimes: LeadTimeMetric[] = [];

    const result = calculateCommentVsLeadTimeCorrelationSpearman(comments, leadTimes);

    expect(result).toBeUndefined();
  });
});

