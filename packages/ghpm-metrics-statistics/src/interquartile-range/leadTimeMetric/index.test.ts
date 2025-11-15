import { describe, expect, it } from "vitest";
import type { LeadTimeMetric } from "@github-project-metrics/ghpm-metrics";
import { calculateLeadTimeInterquartileRange } from "./index.js";

describe("calculateLeadTimeInterquartileRange", () => {
  it("複数のメトリクスから durationMs の四分位範囲を計算する", () => {
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
      {
        durationMs: 129600000, // 1.5日
        startedAt: "2024-01-01T00:00:00Z",
        completedAt: "2024-01-02T12:00:00Z",
      },
    ];

    const result = calculateLeadTimeInterquartileRange(metrics);

    expect(result).toBeDefined();
    expect(result?.durationMs).toBeTypeOf("number");
  });

  it("単一のメトリクスの場合は 0 を返す", () => {
    const metrics: LeadTimeMetric[] = [
      {
        durationMs: 86400000,
        startedAt: "2024-01-01T00:00:00Z",
        completedAt: "2024-01-02T00:00:00Z",
      },
    ];

    const result = calculateLeadTimeInterquartileRange(metrics);

    expect(result).toEqual({
      durationMs: 0,
    });
  });

  it("空配列の場合は undefined を返す", () => {
    const metrics: LeadTimeMetric[] = [];

    const result = calculateLeadTimeInterquartileRange(metrics);

    expect(result).toBeUndefined();
  });
});

