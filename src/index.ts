import * as core from "@actions/core";
import * as github from "@actions/github";
import type { GitHubApiContext } from "@github-project-metrics/ghpm-issues";
import type { GitHubGraphQLContext } from "@github-project-metrics/ghpm-issues";
import { fetchCombinedIssues } from "./fetchCombinedIssues.js";
import { createIssueMetrics } from "@github-project-metrics/ghpm-metrics";
import { calculatePeriodStatistics } from "./calculatePeriodStatistics.js";
import { saveStatisticsToJson } from "./saveStatisticsToJson.js";
import type { PeriodType } from "./types/periodType.js";
import type { CalculatePeriodStatisticsInput } from "./types/calculatePeriodStatisticsInput.js";
import type { SaveStatisticsConfig } from "./types/saveStatisticsConfig.js";

/**
 * メイン実行関数
 * CombinedIssueを取得して、各メトリクスの計算、統計量の計算、JSON出力を行う
 *
 * @returns {Promise<void>}
 * @throws {Error} エラーが発生した場合
 */
async function main(): Promise<void> {
  try {
    core.info("=== GitHub Project Metrics 実行開始 ===");

    // GitHub APIトークンを取得
    const githubToken = core.getInput("github-token", { required: true });

    // リポジトリ情報を取得
    const { owner, repo } = github.context.repo;

    // Octokitクライアントを取得
    const octokit = github.getOctokit(githubToken);

    // GitHub REST APIコンテキストを作成
    const apiContext: GitHubApiContext = {
      client: octokit as unknown as GitHubApiContext["client"],
      options: {
        repository: {
          owner,
          repo,
        },
      },
    };

    // GitHub GraphQL APIコンテキストを作成（オプション）
    // プロジェクトデータが必要な場合は設定
    const graphqlContext: GitHubGraphQLContext | undefined = undefined;

    // CombinedIssueを取得
    core.info("CombinedIssueを取得中...");
    const combinedIssues = await fetchCombinedIssues(apiContext, graphqlContext);
    core.info(`取得したIssue数: ${combinedIssues.length}`);

    // メトリクスを計算
    core.info("メトリクスを計算中...");
    const issueMetrics = createIssueMetrics(combinedIssues);
    core.info(`計算したメトリクス数: ${issueMetrics.length}`);

    // 期間ごとの統計を計算
    core.info("期間ごとの統計を計算中...");
    const periodType: PeriodType = "1week"; // デフォルトは1週間
    const statisticsInput: CalculatePeriodStatisticsInput = {
      combinedIssues,
      periodType,
    };
    const statisticsOutput = calculatePeriodStatistics(statisticsInput);
    core.info(`計算した期間数: ${statisticsOutput.periodStatistics.length}`);

    // JSONファイルに保存
    core.info("JSONファイルに保存中...");
    const outputDir = core.getInput("output-path") || "./output";
    const saveConfig: SaveStatisticsConfig = {
      outputDir,
      filename: "statistics.json",
    };
    saveStatisticsToJson(saveConfig, statisticsOutput);
    core.info(`JSONファイルを保存しました: ${outputDir}/statistics.json`);

    core.info("=== GitHub Project Metrics 実行完了 ===");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    core.error(errorMessage);
  }
}

// メイン関数を実行
await main();
