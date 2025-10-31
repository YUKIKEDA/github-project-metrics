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
 * IssuesデータのSummary Markdownを生成する
 * @param {Issue[]} formattedIssues - 整形されたIssue配列
 * @param {string} owner - リポジトリのオーナー
 * @param {string} repo - リポジトリ名
 * @returns {string} Markdown文字列
 */
export function generateIssuesSummaryMarkdown(formattedIssues, owner, repo) {
  const openIssues = formattedIssues.filter(issue => issue.state === 'open').length;
  const closedIssues = formattedIssues.filter(issue => issue.state === 'closed').length;
  const pullRequests = formattedIssues.filter(issue => issue.pull_request).length;
  
  let summaryMarkdown = `## 📋 Issues メトリクス\n\n`;
  summaryMarkdown += `**リポジトリ**: \`${owner}/${repo}\`\n\n`;
  summaryMarkdown += `### サマリー\n\n`;
  summaryMarkdown += `| 項目 | 数量 |\n`;
  summaryMarkdown += `|------|------|\n`;
  summaryMarkdown += `| **総数** | **${formattedIssues.length}** |\n`;
  summaryMarkdown += `| オープン | ${openIssues} |\n`;
  summaryMarkdown += `| クローズ | ${closedIssues} |\n`;
  summaryMarkdown += `| プルリクエスト | ${pullRequests} |\n\n`;
  
  // 最新のIssue一覧（最大10件）
  if (formattedIssues.length > 0) {
    summaryMarkdown += `### 最新のIssue（最大10件）\n\n`;
    summaryMarkdown += `| # | タイトル | 状態 | 作成日 |\n`;
    summaryMarkdown += `|---|---------|------|--------|\n`;
    const recentIssues = formattedIssues.slice(0, 10);
    recentIssues.forEach(issue => {
      const issueUrl = `https://github.com/${owner}/${repo}/issues/${issue.number}`;
      const stateIcon = issue.state === 'open' ? '🟢' : '🔴';
      summaryMarkdown += `| [#${issue.number}](${issueUrl}) | ${issue.title} | ${stateIcon} ${issue.state} | ${issue.created_at} |\n`;
    });
    summaryMarkdown += `\n`;
  }
  
  return summaryMarkdown;
}

/**
 * ProjectsデータのSummary Markdownを生成する
 * @param {Project[]} formattedProjects - 整形されたProject配列
 * @returns {string} Markdown文字列
 */
export function generateProjectsSummaryMarkdown(formattedProjects) {
  const totalTasks = formattedProjects.reduce((sum, project) => sum + project.totalItems, 0);
  
  let summaryMarkdown = `## 📊 Projects メトリクス\n\n`;
  summaryMarkdown += `### サマリー\n\n`;
  summaryMarkdown += `| 項目 | 数量 |\n`;
  summaryMarkdown += `|------|------|\n`;
  summaryMarkdown += `| **総プロジェクト数** | **${formattedProjects.length}** |\n`;
  summaryMarkdown += `| **総タスク数** | **${totalTasks}** |\n\n`;
  
  // プロジェクト詳細
  if (formattedProjects.length > 0) {
    summaryMarkdown += `### プロジェクト一覧\n\n`;
    formattedProjects.forEach((project, index) => {
      summaryMarkdown += `#### ${index + 1}. ${project.title}\n\n`;
      summaryMarkdown += `- **URL**: [${project.url}](${project.url})\n`;
      summaryMarkdown += `- **タスク数**: ${project.totalItems}\n`;
      summaryMarkdown += `- **作成日**: ${project.createdAt}\n`;
      summaryMarkdown += `- **更新日**: ${project.updatedAt}\n`;
      if (project.shortDescription) {
        summaryMarkdown += `- **説明**: ${project.shortDescription}\n`;
      }
      summaryMarkdown += `\n`;
      
      // プロジェクト内のタスク一覧を表示
      if (project.items && project.items.length > 0) {
        summaryMarkdown += `**タスク一覧**:\n\n`;
        summaryMarkdown += `| # | タイプ | タイトル | 状態 | URL |\n`;
        summaryMarkdown += `|---|--------|---------|------|-----|\n`;
        
        project.items.forEach((item, itemIndex) => {
          const taskNumber = itemIndex + 1;
          if (item.content) {
            const typeIcon = item.type === 'PULL_REQUEST' ? '🔀' : item.type === 'ISSUE' ? '📋' : '📝';
            const typeLabel = item.type === 'PULL_REQUEST' ? 'PR' : item.type === 'ISSUE' ? 'Issue' : 'Draft';
            const stateIcon = item.content.state === 'OPEN' ? '🟢' : '🔴';
            const stateLabel = item.content.state === 'OPEN' ? 'Open' : item.content.state === 'CLOSED' ? 'Closed' : item.content.state || 'N/A';
            const title = item.content.title || 'タイトルなし';
            const url = item.content.url || '';
            
            summaryMarkdown += `| ${taskNumber} | ${typeIcon} ${typeLabel} | ${title} | ${stateIcon} ${stateLabel} | [リンク](${url}) |\n`;
          } else if (item.type === 'DRAFT_ISSUE') {
            // ドラフトイシューの場合はcontentがnullの場合がある
            summaryMarkdown += `| ${taskNumber} | 📝 Draft | (ドラフト) | - | - |\n`;
          }
        });
        summaryMarkdown += `\n`;
      } else if (project.totalItems > 0) {
        summaryMarkdown += `**タスク**: ${project.totalItems}件（詳細データなし）\n\n`;
      } else {
        summaryMarkdown += `**タスク**: なし\n\n`;
      }
    });
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

/**
 * IssuesとProjectsのJSONファイルを保存する
 * @param {string} outputPath - 出力先のパス
 * @param {Issue[]|null|undefined} issuesData - Issuesデータ（オプション）
 * @param {Project[]} projectsData - Projectsデータ
 */
export function saveJsonFiles(outputPath, issuesData, projectsData) {
  // issues.jsonファイルを保存（issuesDataが渡された場合のみ）
  if (issuesData) {
    saveJsonFile(outputPath, 'issues.json', issuesData);
  }
  
  // projects.jsonファイルを保存
  saveJsonFile(outputPath, 'projects.json', projectsData);
}

