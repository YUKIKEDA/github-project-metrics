import * as core from "@actions/core";
import * as github from "@actions/github";
import { fetchCombinedIssues } from "./fetchCombinedIssues.js";
import { createIssueMetrics } from "@github-project-metrics/ghpm-metrics";
import { calculatePeriodStatistics } from "./calculatePeriodStatistics.js";
import { saveStatisticsToJson } from "./saveStatisticsToJson.js";
/**
 * メイン実行関数
 * CombinedIssueを取得して、各メトリクスの計算、統計量の計算、JSON出力を行う
 *
 * @returns {Promise<void>}
 * @throws {Error} エラーが発生した場合
 */
async function main() {
    try {
        core.info("=== GitHub Project Metrics 実行開始 ===");
        // GitHub APIトークンを取得
        const githubToken = core.getInput("github-token", { required: true });
        // リポジトリ情報を取得
        const { owner, repo } = github.context.repo;
        // Octokitクライアントを取得
        const octokit = github.getOctokit(githubToken);
        // GitHub REST APIコンテキストを作成
        const apiContext = {
            client: octokit,
            options: {
                repository: {
                    owner,
                    repo,
                },
            },
        };
        // GitHub GraphQL APIコンテキストを作成
        // Project v2 のデータを利用してメトリクスを計算する
        const projectScope = core.getInput("project-scope", { required: true });
        const organizationName = core.getInput("organization-name");
        const projectIdInput = core.getInput("project-id", { required: true });
        const ownerType = projectScope === "organization" ? "Organization" : "User";
        const login = ownerType === "Organization"
            ? organizationName || owner
            : owner;
        const projectNumber = Number.parseInt(projectIdInput, 10);
        if (Number.isNaN(projectNumber)) {
            throw new Error(`project-id は数値で指定してください: ${projectIdInput}`);
        }
        const graphqlContext = {
            client: octokit,
            options: {
                ownerType,
                login,
                projectNumber,
            },
        };
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
        const periodType = "1week"; // デフォルトは1週間
        const statisticsInput = {
            combinedIssues,
            periodType,
        };
        const statisticsOutput = calculatePeriodStatistics(statisticsInput);
        core.info(`計算した期間数: ${statisticsOutput.periodStatistics.length}`);
        // JSONファイルに保存
        core.info("JSONファイルに保存中...");
        const outputDir = core.getInput("output-path") || "./output";
        const saveConfig = {
            outputDir,
            filename: "statistics.json",
        };
        saveStatisticsToJson(saveConfig, statisticsOutput);
        core.info(`JSONファイルを保存しました: ${outputDir}/statistics.json`);
        core.info("=== GitHub Project Metrics 実行完了 ===");
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        core.error(errorMessage);
    }
}
// メイン関数を実行
await main();
//# sourceMappingURL=index.js.map