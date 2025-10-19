import * as core from "@actions/core";
import * as github from "@actions/github";

async function getAllIssues() {
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
    const formattedIssues = allIssues.map(issue => ({
      number: issue.number,
      title: issue.title,
      state: issue.state,
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
      labels: issue.labels ? issue.labels.map(label => ({
        name: label.name,
        color: label.color
      })) : [],
      milestone: issue.milestone ? {
        title: issue.milestone.title,
        state: issue.milestone.state
      } : null,
      comments: issue.comments,
      body: issue.body,
      pull_request: issue.pull_request ? true : false, // プルリクエストかどうかのフラグ
      draft: issue.draft || false // ドラフトかどうかのフラグ（プルリクエストの場合）
    }));
    
    // 出力として設定
    core.setOutput("issues", JSON.stringify(formattedIssues));
    core.setOutput("issue-count", allIssues.length.toString());
    
    core.info(`Issue取得が完了しました。総数: ${allIssues.length}件`);
    
  } catch (error) {
    core.error(`Issue取得中にエラーが発生しました: ${error.message}`);
    throw error;
  }
}

try {
  await getAllIssues();
} catch (error) {
  core.setFailed(error.message);
}
