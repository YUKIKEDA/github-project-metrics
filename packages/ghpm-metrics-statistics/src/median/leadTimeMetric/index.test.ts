import { describe, expect, it } from "vitest";
import type { LeadTimeMetric } from "@github-project-metrics/ghpm-metrics";
import { calculateLeadTimeMedian } from "./index.js";

describe("calculateLeadTimeMedian", () => {
  it("複数のメトリクスから durationMs の中央値を計算する", () => {
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

    const result = calculateLeadTimeMedian(metrics);

    expect(result).toEqual({
      durationMs: 86400000,
    });
  });

  it("偶数個のメトリクスの場合は平均値が中央値になる", () => {
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
      {
        durationMs: 259200000, // 3日
        startedAt: "2024-01-01T00:00:00Z",
        completedAt: "2024-01-04T00:00:00Z",
      },
    ];

    const result = calculateLeadTimeMedian(metrics);

    expect(result).toEqual({
      durationMs: (86400000 + 172800000) / 2,
    });
  });

  it("単一のメトリクスの場合はその値が中央値になる", () => {
    const metrics: LeadTimeMetric[] = [
      {
        durationMs: 86400000,
        startedAt: "2024-01-01T00:00:00Z",
        completedAt: "2024-01-02T00:00:00Z",
      },
    ];

    const result = calculateLeadTimeMedian(metrics);

    expect(result).toEqual({
      durationMs: 86400000,
    });
  });

  it("空配列の場合は undefined を返す", () => {
    const metrics: LeadTimeMetric[] = [];

    const result = calculateLeadTimeMedian(metrics);

    expect(result).toBeUndefined();
  });
});

