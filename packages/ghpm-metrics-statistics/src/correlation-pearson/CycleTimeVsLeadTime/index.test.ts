import { describe, expect, it } from "vitest";
import type { CycleTimeMetric, LeadTimeMetric } from "@github-project-metrics/ghpm-metrics";
import { calculateCycleTimeVsLeadTimeCorrelationPearson } from "./index.js";

describe("calculateCycleTimeVsLeadTimeCorrelationPearson", () => {
  it("複数のメトリクスから相関係数を計算する", () => {
    const cycleTimes: CycleTimeMetric[] = [
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

    const result = calculateCycleTimeVsLeadTimeCorrelationPearson(cycleTimes, leadTimes);

    expect(result).toBeTypeOf("number");
    expect(result).toBeGreaterThanOrEqual(-1);
    expect(result).toBeLessThanOrEqual(1);
  });

  it("有効なペアが2未満の場合は undefined を返す", () => {
    const cycleTimes: CycleTimeMetric[] = [
      {
        durationMs: 86400000,
        startedAt: "2024-01-01T00:00:00Z",
        completedAt: "2024-01-02T00:00:00Z",
      },
    ];

    const leadTimes: LeadTimeMetric[] = [
      {
        durationMs: 86400000,
        startedAt: "2024-01-01T00:00:00Z",
        completedAt: "2024-01-02T00:00:00Z",
      },
    ];

    const result = calculateCycleTimeVsLeadTimeCorrelationPearson(cycleTimes, leadTimes);

    expect(result).toBeUndefined();
  });

  it("空配列の場合は undefined を返す", () => {
    const cycleTimes: CycleTimeMetric[] = [];
    const leadTimes: LeadTimeMetric[] = [];

    const result = calculateCycleTimeVsLeadTimeCorrelationPearson(cycleTimes, leadTimes);

    expect(result).toBeUndefined();
  });
});

