//@ts-check
/// <reference path="./types.d.ts" />
import * as core from "@actions/core";
import * as fs from "fs";
import { getAllIssues } from "./issues.js";
import { getAllProjects } from "./projects.js";

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
    if (summaryPath) {
      // Summaryファイルを初期化（既存の内容をクリア）
      fs.writeFileSync(summaryPath, '# 📈 GitHub Project Metrics\n\n', 'utf8');
    }
    
    // IssueとProjectの両方を取得
    core.info("=== GitHub Project Metrics 実行開始 ===");
    
    // Issueを取得
    const issuesData = await getAllIssues();
    
    // Projectを取得（issuesDataを渡す）
    await getAllProjects(issuesData);
    
    core.info("=== GitHub Project Metrics 実行完了 ===");
    
    // Summaryに完了メッセージを追加
    if (summaryPath) {
      fs.appendFileSync(summaryPath, `---\n\n✅ **実行完了**: ${new Date().toLocaleString('ja-JP')}\n`, 'utf8');
    }
    
  } catch (error) {
    core.setFailed(error.message);
    
    // エラー時もSummaryに記載
    const summaryPath = process.env.GITHUB_STEP_SUMMARY;
    if (summaryPath) {
      fs.appendFileSync(summaryPath, `\n---\n\n❌ **エラー**: ${error.message}\n`, 'utf8');
    }
  }
}

try {
  await main();
} catch (error) {
  core.setFailed(error.message);
}
