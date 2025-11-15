import { describe, expect, it } from "vitest";
import type { LeadTimeMetric } from "@github-project-metrics/ghpm-metrics";
import { calculateLeadTimeMean } from "./index.js";

describe("calculateLeadTimeMean", () => {
  it("複数のメトリクスから durationMs の平均値を計算する", () => {
    const metrics: LeadTimeMetric[] = [
      {
        durationMs: 86400000, // 1日
        startedAt: "2024-01-01T00:00:00Z",
        completedAt: "2024-01-02T00:00:00Z",
      },
      {
        durationMs: 172800000, // 2日
        startedAt: "2024-01-01T00:00:00Z",
        completedAt: "2024-01-03T00:00:00Z",
      },
      {
        durationMs: 43200000, // 0.5日
        startedAt: "2024-01-01T00:00:00Z",
        completedAt: "2024-01-01T12:00:00Z",
      },
    ];

    const result = calculateLeadTimeMean(metrics);

    expect(result).toEqual({
      durationMs: (86400000 + 172800000 + 43200000) / 3,
    });
  });

  it("単一のメトリクスの場合はその値が平均値になる", () => {
    const metrics: LeadTimeMetric[] = [
      {
        durationMs: 86400000,
        startedAt: "2024-01-01T00:00:00Z",
        completedAt: "2024-01-02T00:00:00Z",
      },
    ];

    const result = calculateLeadTimeMean(metrics);

    expect(result).toEqual({
      durationMs: 86400000,
    });
  });

  it("空配列の場合は undefined を返す", () => {
    const metrics: LeadTimeMetric[] = [];

    const result = calculateLeadTimeMean(metrics);

    expect(result).toBeUndefined();
  });
});

