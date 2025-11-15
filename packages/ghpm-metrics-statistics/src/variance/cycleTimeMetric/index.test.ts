import { describe, expect, it } from "vitest";
import type { CycleTimeMetric } from "@github-project-metrics/ghpm-metrics";
import { calculateCycleTimeVariance } from "./index.js";

describe("calculateCycleTimeVariance", () => {
  it("複数のメトリクスから durationMs の分散を計算する", () => {
    const metrics: CycleTimeMetric[] = [
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

    const result = calculateCycleTimeVariance(metrics);

    expect(result).toBeDefined();
    expect(result?.durationMs).toBeTypeOf("number");
  });

  it("要素数が2未満の場合は undefined を返す", () => {
    const metrics: CycleTimeMetric[] = [
      {
        durationMs: 86400000,
        startedAt: "2024-01-01T00:00:00Z",
        completedAt: "2024-01-02T00:00:00Z",
      },
    ];

    const result = calculateCycleTimeVariance(metrics);

    expect(result).toBeUndefined();
  });

  it("空配列の場合は undefined を返す", () => {
    const metrics: CycleTimeMetric[] = [];

    const result = calculateCycleTimeVariance(metrics);

    expect(result).toBeUndefined();
  });
});

