import { join } from "node:path";
import { Octokit } from "@octokit/rest";
import { config as loadEnv } from "dotenv";
import { describe, expect, it } from "vitest";
import { calculatePeriodStatistics } from "./calculatePeriodStatistics";
import type { CalculatePeriodStatisticsInput } from "./types/calculatePeriodStatisticsInput";
import type { PeriodType } from "./types/periodType";
import { fetchCombinedIssues } from "./fetchCombinedIssues";
import type { GitHubApiContext } from "@github-project-metrics/ghpm-issues";
import type { GitHubGraphQLContext } from "@github-project-metrics/ghpm-issues";
import { saveStatisticsToJson } from "./saveStatisticsToJson";
import type { SaveStatisticsConfig } from "./types/saveStatisticsConfig";

loadEnv();
describe("end-to-end integration", () => {
  it("実リポジトリからデータを取得して統計を計算し、JSONファイルに保存できる", async () => {
    const token = process.env.GITHUB_PERSONAL_ACCESS_TOKEN;

    if (!token) {
      throw new Error("GITHUB_PERSONAL_ACCESS_TOKEN が設定されていません。");
    }

    const client = new Octokit({
      auth: token,
    });

    const apiContext: GitHubApiContext = {
      client,
      options: {
        repository: {
          owner: "YUKIKEDA",
          repo: "github-project-metrics",
        },
      },
    };

    const graphqlContext: GitHubGraphQLContext | undefined = undefined;

    // 1. CombinedIssueを取得
    const combinedIssues = await fetchCombinedIssues(apiContext, graphqlContext);
    expect(combinedIssues.length).toBeGreaterThan(0);

    // 2. 期間ごとの統計を計算
    const periodType: PeriodType = "1week";
    const input: CalculatePeriodStatisticsInput = {
      combinedIssues,
      periodType,
    };
    const output = calculatePeriodStatistics(input);

    expect(output.periodStatistics.length).toBeGreaterThan(0);
    expect(output.issueMetrics.length).toBe(combinedIssues.length);

    // 3. JSONファイルに保存
    const outputDir = join(process.cwd(), "tmp");
    const config: SaveStatisticsConfig = {
      outputDir,
      filename: "statistics.e2e.json",
    };
    saveStatisticsToJson(config, output);

    const filepath = join(outputDir, config.filename ?? "statistics.json");
    const fs = await import("node:fs");
    expect(fs.existsSync(filepath)).toBe(true);

    // 4. 保存されたファイルの内容を検証
    const fileContent = fs.readFileSync(filepath, "utf-8");
    const parsed = JSON.parse(fileContent);
    expect(parsed.periodStatistics).toBeDefined();
    expect(parsed.issueMetrics).toBeDefined();
    expect(Array.isArray(parsed.periodStatistics)).toBe(true);
    expect(Array.isArray(parsed.issueMetrics)).toBe(true);
    expect(parsed.issueMetrics.length).toBe(combinedIssues.length);

    // 5. 統計データの構造を検証
    for (const periodStat of parsed.periodStatistics) {
      expect(periodStat.periodStart).toBeDefined();
      expect(periodStat.periodEnd).toBeDefined();
      expect(typeof periodStat.issueCount).toBe("number");
      expect(periodStat.issueCount).toBeGreaterThan(0);
      expect(periodStat.metrics).toBeDefined();
    }
  }, 60_000);
});

