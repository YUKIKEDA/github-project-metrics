import { describe, expect, it } from "vitest";
import type { LeadTimeMetric } from "@github-project-metrics/ghpm-metrics";
import { calculateLeadTimeMax } from "./index.js";

describe("calculateLeadTimeMax", () => {
  it("複数のメトリクスから durationMs の最大値を計算する", () => {
    const metrics: LeadTimeMetric[] = [
      {
        durationMs: 259200000, // 3日
        startedAt: "2024-01-01T00:00:00Z",
        completedAt: "2024-01-04T00:00:00Z",
      },
      {
        durationMs: 518400000, // 6日
        startedAt: "2024-01-01T00:00:00Z",
        completedAt: "2024-01-07T00:00:00Z",
      },
      {
        durationMs: 172800000, // 2日
        startedAt: "2024-01-01T00:00:00Z",
        completedAt: "2024-01-03T00:00:00Z",
      },
    ];

    const result = calculateLeadTimeMax(metrics);

    expect(result).toEqual({
      durationMs: 518400000,
    });
  });

  it("単一のメトリクスの場合はその値が最大値になる", () => {
    const metrics: LeadTimeMetric[] = [
      {
        durationMs: 259200000,
        startedAt: "2024-01-01T00:00:00Z",
        completedAt: "2024-01-04T00:00:00Z",
      },
    ];

    const result = calculateLeadTimeMax(metrics);

    expect(result).toEqual({
      durationMs: 259200000,
    });
  });

  it("空配列の場合は undefined を返す", () => {
    const metrics: LeadTimeMetric[] = [];

    const result = calculateLeadTimeMax(metrics);

    expect(result).toBeUndefined();
  });
});

