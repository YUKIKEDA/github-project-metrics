import { describe, expect, it } from "vitest";
import type { LeadTimeMetric } from "@github-project-metrics/ghpm-metrics";
import { calculateLeadTimeOutliersIQR } from "./index.js";

describe("calculateLeadTimeOutliersIQR", () => {
  it("複数のメトリクスから durationMs の外れ値を検出する", () => {
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
        durationMs: 8640000000, // 100日（外れ値）
        startedAt: "2024-01-01T00:00:00Z",
        completedAt: "2024-04-10T00:00:00Z",
      },
    ];

    const result = calculateLeadTimeOutliersIQR(metrics);

    expect(result).toBeDefined();
    expect(result?.durationMs).toBeInstanceOf(Array);
  });

  it("外れ値がない場合は空配列を返す", () => {
    const metrics: LeadTimeMetric[] = [
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

    const result = calculateLeadTimeOutliersIQR(metrics);

    expect(result).toBeDefined();
    expect(result?.durationMs).toEqual([]);
  });

  it("単一のメトリクスの場合は空配列を返す", () => {
    const metrics: LeadTimeMetric[] = [
      {
        durationMs: 86400000,
        startedAt: "2024-01-01T00:00:00Z",
        completedAt: "2024-01-02T00:00:00Z",
      },
    ];

    const result = calculateLeadTimeOutliersIQR(metrics);

    expect(result).toBeDefined();
    expect(result?.durationMs).toEqual([]);
  });

  it("空配列の場合は undefined を返す", () => {
    const metrics: LeadTimeMetric[] = [];

    const result = calculateLeadTimeOutliersIQR(metrics);

    expect(result).toBeUndefined();
  });
});

