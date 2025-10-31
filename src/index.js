//@ts-check
/// <reference path="./types.d.ts" />
import * as core from "@actions/core";
import * as github from "@actions/github";
import { getAllIssues } from "./issues.js";
import { getAllProjects } from "./projects.js";
import {
  initializeSummary,
  appendCompletionMessage,
  appendErrorMessage,
  appendToSummary,
  generateIssuesSummaryMarkdown,
  generateProjectsSummaryMarkdown,
  saveJsonFiles
} from "./io.js";

/**
 * メイン実行関数
 * IssueとProjectの両方を取得して処理する
 * @returns {Promise<void>}
 * @throws {Error} エラーが発生した場合
 */
async function main() {
  try {
    // GitHub Actions Summaryの初期化
    const summaryPath = process.env.GITHUB_STEP_SUMMARY;
    initializeSummary(summaryPath);
    
    // IssueとProjectの両方を取得
    core.info("=== GitHub Project Metrics 実行開始 ===");
    
    // Issueを取得
    const issuesData = await getAllIssues();
    
    // Projectを取得
    const projectsData = await getAllProjects();
    
    core.info("=== GitHub Project Metrics 実行完了 ===");
    
    // GitHub Actions Summaryに書き込む
    if (summaryPath) {
      // IssuesのSummaryを追加
      const { owner, repo } = github.context.repo;
      const issuesSummaryMarkdown = generateIssuesSummaryMarkdown(issuesData, owner, repo);
      appendToSummary(summaryPath, issuesSummaryMarkdown);
      
      // ProjectsのSummaryを追加
      const projectsSummaryMarkdown = generateProjectsSummaryMarkdown(projectsData);
      appendToSummary(summaryPath, projectsSummaryMarkdown);
    }
    
    // JSONファイルを保存
    try {
      const outputPath = core.getInput("output-path");
      saveJsonFiles(outputPath, issuesData, projectsData);
    } catch (writeError) {
      core.warning(`Failed to save JSON files: ${writeError.message}`);
    }
    
    // Summaryに完了メッセージを追加
    appendCompletionMessage(summaryPath);
    
  } catch (error) {
    core.setFailed(error.message);
    
    // エラー時もSummaryに記載
    const summaryPath = process.env.GITHUB_STEP_SUMMARY;
    appendErrorMessage(summaryPath, error.message);
  }
}

try {
  await main();
} catch (error) {
  core.setFailed(error.message);
}
