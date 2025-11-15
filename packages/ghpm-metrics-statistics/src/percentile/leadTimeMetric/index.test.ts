import { describe, expect, it } from "vitest";
import type { LeadTimeMetric } from "@github-project-metrics/ghpm-metrics";
import { calculateLeadTimePercentile } from "./index.js";

describe("calculateLeadTimePercentile", () => {
  it("複数のメトリクスから durationMs のパーセンタイルを計算する", () => {
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
      {
        durationMs: 259200000, // 3日
        startedAt: "2024-01-01T00:00:00Z",
        completedAt: "2024-01-04T00:00:00Z",
      },
    ];

    const result = calculateLeadTimePercentile(metrics, 50);

    expect(result).toBeDefined();
    expect(result?.durationMs).toBeTypeOf("number");
  });

  it("0パーセンタイルは最小値を返す", () => {
    const metrics: LeadTimeMetric[] = [
      {
        durationMs: 43200000, // 0.5日
        startedAt: "2024-01-01T00:00:00Z",
        completedAt: "2024-01-01T12:00:00Z",
      },
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
    ];

    const result = calculateLeadTimePercentile(metrics, 0);

    expect(result).toEqual({
      durationMs: 43200000,
    });
  });

  it("100パーセンタイルは最大値を返す", () => {
    const metrics: LeadTimeMetric[] = [
      {
        durationMs: 43200000, // 0.5日
        startedAt: "2024-01-01T00:00:00Z",
        completedAt: "2024-01-01T12:00:00Z",
      },
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
    ];

    const result = calculateLeadTimePercentile(metrics, 100);

    expect(result).toEqual({
      durationMs: 172800000,
    });
  });

  it("単一のメトリクスの場合はその値がパーセンタイルになる", () => {
    const metrics: LeadTimeMetric[] = [
      {
        durationMs: 86400000,
        startedAt: "2024-01-01T00:00:00Z",
        completedAt: "2024-01-02T00:00:00Z",
      },
    ];

    const result = calculateLeadTimePercentile(metrics, 50);

    expect(result).toEqual({
      durationMs: 86400000,
    });
  });

  it("空配列の場合は undefined を返す", () => {
    const metrics: LeadTimeMetric[] = [];

    const result = calculateLeadTimePercentile(metrics, 50);

    expect(result).toBeUndefined();
  });
});

