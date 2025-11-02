//@ts-check
/// <reference path="./types.d.ts" />
import * as fs from "fs";
import * as path from "path";
import * as core from "@actions/core";

/**
 * GitHub Actions Summaryファイルへの書き込み処理を集約したIOモジュール
 */

/**
 * Summaryファイルを初期化する
 * @param {string|undefined} summaryPath - Summaryファイルのパス
 */
export function initializeSummary(summaryPath) {
  if (summaryPath) {
    fs.writeFileSync(summaryPath, '# 📈 GitHub Project Metrics\n\n', 'utf8');
  }
}

/**
 * Summaryファイルにテキストを追加する
 * @param {string|undefined} summaryPath - Summaryファイルのパス
 * @param {string} content - 追加するコンテンツ
 */
export function appendToSummary(summaryPath, content) {
  if (summaryPath) {
    fs.appendFileSync(summaryPath, content, 'utf8');
  }
}

/**
 * Summaryファイルに完了メッセージを追加する
 * @param {string|undefined} summaryPath - Summaryファイルのパス
 */
export function appendCompletionMessage(summaryPath) {
  if (summaryPath) {
    appendToSummary(summaryPath, `---\n\n✅ **実行完了**: ${new Date().toLocaleString('ja-JP')}\n`);
  }
}

/**
 * Summaryファイルにエラーメッセージを追加する
 * @param {string|undefined} summaryPath - Summaryファイルのパス
 * @param {string} errorMessage - エラーメッセージ
 */
export function appendErrorMessage(summaryPath, errorMessage) {
  if (summaryPath) {
    appendToSummary(summaryPath, `\n---\n\n❌ **エラー**: ${errorMessage}\n`);
  }
}

/**
 * Issuesデータ（Project情報統合済み）から統合されたSummary Markdownを生成する
 * @param {Issue[]} formattedIssues - 整形されたIssue配列（Project情報統合済み）
 * @param {string} owner - リポジトリのオーナー
 * @param {string} repo - リポジトリ名
 * @returns {string} Markdown文字列
 */
export function generateIssuesSummaryMarkdown(formattedIssues, owner, repo) {
  const openIssues = formattedIssues.filter(issue => issue.state === 'open').length;
  const closedIssues = formattedIssues.filter(issue => issue.state === 'closed').length;
  const pullRequests = formattedIssues.filter(issue => issue.pull_request).length;
  
  // IssueデータからProject情報を抽出
  /** @type {Map<string, { project: IssueProject, issueCount: number }>} */
  const projectMap = new Map();
  
  formattedIssues.forEach(issue => {
    issue.projects.forEach(project => {
      const existing = projectMap.get(project.projectId);
      if (!existing) {
        projectMap.set(project.projectId, {
          project: project,
          issueCount: 1
        });
      } else {
        existing.issueCount++;
      }
    });
  });
  
  const uniqueProjects = Array.from(projectMap.values());
  const totalProjects = uniqueProjects.length;
  const issuesWithProjects = formattedIssues.filter(issue => issue.projects.length > 0).length;
  
  let summaryMarkdown = `## 📋 Issues & Projects メトリクス\n\n`;
  summaryMarkdown += `**リポジトリ**: \`${owner}/${repo}\`\n\n`;
  
  // Issuesサマリー
  summaryMarkdown += `### Issues サマリー\n\n`;
  summaryMarkdown += `| 項目 | 数量 |\n`;
  summaryMarkdown += `|------|------|\n`;
  summaryMarkdown += `| **総数** | **${formattedIssues.length}** |\n`;
  summaryMarkdown += `| オープン | ${openIssues} |\n`;
  summaryMarkdown += `| クローズ | ${closedIssues} |\n`;
  summaryMarkdown += `| プルリクエスト | ${pullRequests} |\n`;
  summaryMarkdown += `| Projectに属しているIssue | ${issuesWithProjects} |\n\n`;
  
  // Projectsサマリー
  if (totalProjects > 0) {
    summaryMarkdown += `### Projects サマリー\n\n`;
    summaryMarkdown += `| 項目 | 数量 |\n`;
    summaryMarkdown += `|------|------|\n`;
    summaryMarkdown += `| **総プロジェクト数** | **${totalProjects}** |\n`;
    summaryMarkdown += `| **総タスク数（Project内のIssue数）** | **${issuesWithProjects}** |\n\n`;
    
    // プロジェクト詳細
    summaryMarkdown += `### プロジェクト一覧\n\n`;
    uniqueProjects.forEach(({ project, issueCount }, index) => {
      summaryMarkdown += `#### ${index + 1}. ${project.projectTitle}\n\n`;
      summaryMarkdown += `- **URL**: [${project.projectUrl}](${project.projectUrl})\n`;
      summaryMarkdown += `- **Issue数**: ${issueCount}件\n`;
      summaryMarkdown += `\n`;
    });
  }
  
  // 最新のIssue一覧（最大10件）
  if (formattedIssues.length > 0) {
    summaryMarkdown += `### 最新のIssue（最大10件）\n\n`;
    summaryMarkdown += `| # | タイトル | 状態 | Project数 | 作成日 |\n`;
    summaryMarkdown += `|---|---------|------|-----------|--------|\n`;
    const recentIssues = formattedIssues.slice(0, 10);
    recentIssues.forEach(issue => {
      const issueUrl = `https://github.com/${owner}/${repo}/issues/${issue.number}`;
      const stateIcon = issue.state === 'open' ? '🟢' : '🔴';
      const projectCount = issue.projects.length;
      summaryMarkdown += `| [#${issue.number}](${issueUrl}) | ${issue.title} | ${stateIcon} ${issue.state} | ${projectCount}個 | ${issue.created_at} |\n`;
    });
    summaryMarkdown += `\n`;
  }
  
  return summaryMarkdown;
}

/**
 * JSONファイルを保存する
 * @param {string} outputPath - 出力先のパス（相対パスの場合、GITHUB_WORKSPACE基準）
 * @param {string} filename - ファイル名
 * @param {any} data - 保存するデータ
 * @returns {string} 保存されたファイルの完全なパス
 * @throws {Error} ファイル保存に失敗した場合
 */
export function saveJsonFile(outputPath, filename, data) {
  try {
    const workspacePath = outputPath 
      ? (path.isAbsolute(outputPath) ? outputPath : path.join(process.env.GITHUB_WORKSPACE || '.', outputPath))
      : (process.env.GITHUB_WORKSPACE || '.');
    
    // 出力ディレクトリが存在しない場合は作成
    if (!fs.existsSync(workspacePath)) {
      fs.mkdirSync(workspacePath, { recursive: true });
      core.info(`Created output directory: ${workspacePath}`);
    }
    
    const filePath = path.join(workspacePath, filename);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    core.info(`${filename} data saved to ${filePath}`);
    
    return filePath;
  } catch (error) {
    core.warning(`Failed to save ${filename}: ${error.message}`);
    throw error;
  }
}
