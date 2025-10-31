//@ts-check
/// <reference path="./types.d.ts" />
import * as core from "@actions/core";
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
    // IssueとProjectの両方を取得
    core.info("=== GitHub Project Metrics 実行開始 ===");
    
    // Issueを取得
    await getAllIssues();
    
    // Projectを取得
    await getAllProjects();
    
    core.info("=== GitHub Project Metrics 実行完了 ===");
    
  } catch (error) {
    core.setFailed(error.message);
  }
}

try {
  await main();
} catch (error) {
  core.setFailed(error.message);
}
