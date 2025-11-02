//@ts-check
/// <reference path="./types.d.ts" />
import * as core from "@actions/core";
import * as github from "@actions/github";
import { getAllIssues } from "./issues.js";
import {
  initializeSummary,
  appendCompletionMessage,
  appendErrorMessage,
  appendToSummary,
  generateIssuesSummaryMarkdown,
  saveJsonFile
} from "./io.js";
import {
  performStatisticalAnalysis,
  generateAnalysisSummary
} from "./statistics.js";

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
    
    // Issueを取得（Project情報も統合される）
    core.info("=== GitHub Project Metrics 実行開始 ===");
    
    // Issueを取得（内部でProject情報も取得・統合される）
    const issuesData = await getAllIssues();
    
    core.info("=== GitHub Project Metrics 実行完了 ===");
    
    // 統計分析を実行
    let analysisResults = null;
    try {
      core.info("=== 統計分析を実行中 ===");
      analysisResults = performStatisticalAnalysis(issuesData);
      core.info("=== 統計分析完了 ===");
    } catch (analysisError) {
      core.warning(`統計分析でエラーが発生しました: ${analysisError.message}`);
      core.warning("統計分析なしで処理を継続します");
    }
    
    // GitHub Actions Summaryに書き込む（統合されたSummary）
    if (summaryPath) {
      const { owner, repo } = github.context.repo;
      const summaryMarkdown = generateIssuesSummaryMarkdown(issuesData, owner, repo);
      appendToSummary(summaryPath, summaryMarkdown);
      
      // 統計分析結果を追加
      if (analysisResults) {
        const analysisSummary = generateAnalysisSummary(analysisResults);
        appendToSummary(summaryPath, analysisSummary);
      }
    }
    
    // JSONファイルを保存（IssueデータにProject情報が統合されているため、Issueデータのみ保存）
    try {
      const outputPath = core.getInput("output-path");
      saveJsonFile(outputPath, 'issues.json', issuesData);
      
      // 統計分析結果もJSONで保存
      if (analysisResults) {
        saveJsonFile(outputPath, 'statistics.json', analysisResults);
      }
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
