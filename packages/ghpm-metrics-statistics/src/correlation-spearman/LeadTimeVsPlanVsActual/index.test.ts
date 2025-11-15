import { describe, expect, it } from "vitest";
import type { LeadTimeMetric, PlanVsActualMetric } from "@github-project-metrics/ghpm-metrics";
import { calculateLeadTimeVsPlanVsActualCorrelationSpearman } from "./index.js";

describe("calculateLeadTimeVsPlanVsActualCorrelationSpearman", () => {
  it("複数のメトリクスから相関係数を計算する", () => {
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

    const planVsActuals: PlanVsActualMetric[] = [
      { planned: 5, actual: 6, variance: 1, varianceRatio: 0.2 },
      { planned: 10, actual: 12, variance: 2, varianceRatio: 0.2 },
      { planned: 8, actual: 7, variance: -1, varianceRatio: -0.125 },
    ];

    const result = calculateLeadTimeVsPlanVsActualCorrelationSpearman(leadTimes, planVsActuals);

    expect(result).toBeTypeOf("number");
    expect(result).toBeGreaterThanOrEqual(-1);
    expect(result).toBeLessThanOrEqual(1);
  });

  it("有効なペアが2未満の場合は undefined を返す", () => {
    const leadTimes: LeadTimeMetric[] = [
      {
        durationMs: 86400000,
        startedAt: "2024-01-01T00:00:00Z",
        completedAt: "2024-01-02T00:00:00Z",
      },
    ];

    const planVsActuals: PlanVsActualMetric[] = [
      { planned: 5, actual: 6, variance: 1, varianceRatio: 0.2 },
    ];

    const result = calculateLeadTimeVsPlanVsActualCorrelationSpearman(leadTimes, planVsActuals);

    expect(result).toBeUndefined();
  });

  it("空配列の場合は undefined を返す", () => {
    const leadTimes: LeadTimeMetric[] = [];
    const planVsActuals: PlanVsActualMetric[] = [];

    const result = calculateLeadTimeVsPlanVsActualCorrelationSpearman(leadTimes, planVsActuals);

    expect(result).toBeUndefined();
  });
});

