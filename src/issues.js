//@ts-check
/// <reference path="./types.d.ts" />
import * as core from "@actions/core";
import * as github from "@actions/github";
import * as fs from "fs";

/**
 * GitHubリポジトリのIssue（プルリクエスト含む）を取得し、整形して出力する
 * @returns {Promise<Issue[]>} 整形されたIssue配列
 * @throws {Error} エラーが発生した場合
 */
export async function getAllIssues() {
  const token = core.getInput("github-token");
  const octokit = github.getOctokit(token);
  
  const { owner, repo } = github.context.repo;
  
  core.info(`リポジトリ ${owner}/${repo} のIssueを取得中...`);
  
  try {
    // ページネーションを使用して全てのIssueを取得
    const allIssues = [];
    let page = 1;
    const perPage = 100; // GitHub APIの最大値
    
    while (true) {
      const { data: issues } = await octokit.rest.issues.listForRepo({
        owner,
        repo,
        state: "all", // open, closed, all
        per_page: perPage,
        page: page,
        sort: "created",
        direction: "desc"
      });
      
      if (issues.length === 0) {
        break; // これ以上Issueがない場合は終了
      }
      
      // Issueの詳細情報を取得（プルリクエストも含む）
      allIssues.push(...issues);
      core.info(`ページ ${page}: ${issues.length}件のIssueを取得しました`);
      
      if (issues.length < perPage) {
        break; // 最後のページ
      }
      
      page++;
    }
    
    core.info(`合計 ${allIssues.length}件のIssueを取得しました`);
    
    // Issueデータを整形
    /** @type {Issue[]} */
    const formattedIssues = allIssues.map(issue => ({
      number: issue.number,
      title: issue.title,
      state: /** @type {IssueState} */ (issue.state),
      created_at: issue.created_at,
      updated_at: issue.updated_at,
      closed_at: issue.closed_at,
      user: issue.user ? {
        login: issue.user.login,
        id: issue.user.id
      } : null,
      assignees: issue.assignees ? issue.assignees.map(assignee => ({
        login: assignee.login,
        id: assignee.id
      })) : [],
      labels: issue.labels ? issue.labels.map(label => {
        const labelObj = typeof label === 'string' ? { name: label, color: null } : label;
        return {
          name: typeof labelObj.name === 'string' ? labelObj.name : '',
          color: typeof labelObj.color === 'string' ? labelObj.color : null
        };
      }) : [],
      milestone: issue.milestone ? {
        title: issue.milestone.title,
        state: issue.milestone.state
      } : null,
      comments: issue.comments,
      body: issue.body || null,
      pull_request: issue.pull_request ? true : false, // プルリクエストかどうかのフラグ
      draft: issue.draft || false // ドラフトかどうかのフラグ（プルリクエストの場合）
    }));
    
    // 出力として設定
    core.setOutput("issues", JSON.stringify(formattedIssues));
    core.setOutput("raw-issues", JSON.stringify(allIssues)); // 整形前の生データも出力
    core.setOutput("issue-count", allIssues.length.toString());
    
    core.info(`Issue取得が完了しました。総数: ${allIssues.length}件`);
    
    // Issueデータのサマリーを表示
    core.info("=== Issueデータ（整形済み） ===");
    core.info(JSON.stringify(formattedIssues, null, 2));
    
    // Issueサマリー情報を表示
    const openIssues = formattedIssues.filter(issue => issue.state === 'open').length;
    const closedIssues = formattedIssues.filter(issue => issue.state === 'closed').length;
    const pullRequests = formattedIssues.filter(issue => issue.pull_request).length;
    
    core.info("=== Issueサマリー ===");
    core.info(`総数: ${formattedIssues.length}件`);
    core.info(`オープン: ${openIssues}件`);
    core.info(`クローズ: ${closedIssues}件`);
    core.info(`プルリクエスト: ${pullRequests}件`);
    
    // GitHub Actions Summaryに書き込む
    const summaryPath = process.env.GITHUB_STEP_SUMMARY;
    if (summaryPath) {
      const { owner, repo } = github.context.repo;
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
      
      fs.appendFileSync(summaryPath, summaryMarkdown, 'utf8');
    }
    
    return formattedIssues;
    
  } catch (error) {
    core.error(`Issue取得中にエラーが発生しました: ${error.message}`);
    throw error;
  }
}

