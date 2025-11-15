import { describe, expect, it } from "vitest";
import type { CommentCountMetric, PlanVsActualMetric } from "@github-project-metrics/ghpm-metrics";
import { calculateCommentVsPlanVsActualCorrelationSpearman } from "./index.js";

describe("calculateCommentVsPlanVsActualCorrelationSpearman", () => {
  it("複数のメトリクスから相関係数を計算する", () => {
    const comments: CommentCountMetric[] = [
      { total: 5, participantCount: 2 },
      { total: 10, participantCount: 3 },
      { total: 7, participantCount: 1 },
    ];

    const planVsActuals: PlanVsActualMetric[] = [
      { planned: 5, actual: 6, variance: 1, varianceRatio: 0.2 },
      { planned: 10, actual: 12, variance: 2, varianceRatio: 0.2 },
      { planned: 8, actual: 7, variance: -1, varianceRatio: -0.125 },
    ];

    const result = calculateCommentVsPlanVsActualCorrelationSpearman(comments, planVsActuals);

    expect(result).toBeTypeOf("number");
    expect(result).toBeGreaterThanOrEqual(-1);
    expect(result).toBeLessThanOrEqual(1);
  });

  it("有効なペアが2未満の場合は undefined を返す", () => {
    const comments: CommentCountMetric[] = [
      { total: 5, participantCount: 2 },
    ];

    const planVsActuals: PlanVsActualMetric[] = [
      { planned: 5, actual: 6, variance: 1, varianceRatio: 0.2 },
    ];

    const result = calculateCommentVsPlanVsActualCorrelationSpearman(comments, planVsActuals);

    expect(result).toBeUndefined();
  });

  it("空配列の場合は undefined を返す", () => {
    const comments: CommentCountMetric[] = [];
    const planVsActuals: PlanVsActualMetric[] = [];

    const result = calculateCommentVsPlanVsActualCorrelationSpearman(comments, planVsActuals);

    expect(result).toBeUndefined();
  });
});

