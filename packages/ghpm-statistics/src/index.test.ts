import { describe, expect, it } from "vitest";
import { calculateStatistics } from "./index.js";

describe("calculateStatistics", () => {
  it("評価スコアとアクティビティレベルを計算できる", () => {
    const result = calculateStatistics({
      stars: 1500,
      forks: 200,
      openIssues: 50,
      watchers: 900,
    });

    expect(result.score).toBeGreaterThan(0);
    expect(["low", "medium", "high"]).toContain(result.activityLevel);
  });
});
