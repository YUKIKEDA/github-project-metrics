//@ts-check
/// <reference path="./types.d.ts" />
import * as core from "@actions/core";
import * as github from "@actions/github";

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
    
    // 各Issueのイベントを取得
    core.info("各Issueのイベントを取得中...");
    const issuesWithEvents = await Promise.all(
      allIssues.map(async (issue) => {
        try {
          // Issueのイベントを取得
          const allEvents = [];
          let eventPage = 1;
          const eventsPerPage = 100;
          
          while (true) {
            try {
              const { data: events } = await octokit.rest.issues.listEvents({
                owner,
                repo,
                issue_number: issue.number,
                per_page: eventsPerPage,
                page: eventPage
              });
              
              if (events.length === 0) {
                break;
              }
              
              allEvents.push(...events);
              
              if (events.length < eventsPerPage) {
                break;
              }
              
              eventPage++;
            } catch (eventError) {
              // プルリクエストの場合はイベント取得が失敗する可能性があるため、エラーを無視
              if (eventError.status === 404) {
                core.warning(`Issue #${issue.number} のイベントを取得できませんでした（プルリクエストの可能性）`);
              } else {
                core.warning(`Issue #${issue.number} のイベント取得中にエラー: ${eventError.message}`);
              }
              break;
            }
          }
          
          return {
            issue,
            events: allEvents
          };
        } catch (error) {
          core.warning(`Issue #${issue.number} のイベント取得中にエラー: ${error.message}`);
          return {
            issue,
            events: []
          };
        }
      })
    );
    
    core.info("イベント取得が完了しました");
    
    // Issueデータを整形
    /** @type {Issue[]} */
    const formattedIssues = issuesWithEvents.map(({ issue, events }) => ({
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
      draft: issue.draft || false, // ドラフトかどうかのフラグ（プルリクエストの場合）
      events: events.map(event => {
        // @ts-ignore - GitHub APIのイベントオブジェクトは動的なプロパティを持つ
        const eventAny = /** @type {any} */ (event);
        return {
          id: event.id,
          event: /** @type {IssueEventType} */ (event.event),
          created_at: event.created_at,
          actor: event.actor ? {
            login: event.actor.login,
            id: event.actor.id
          } : null,
          assignee: eventAny.assignee ? {
            login: eventAny.assignee.login,
            id: eventAny.assignee.id
          } : null,
          label: eventAny.label ? {
            name: eventAny.label.name,
            color: eventAny.label.color || null
          } : null,
          milestone: eventAny.milestone ? {
            title: eventAny.milestone.title
          } : null,
          rename: eventAny.rename ? {
            from: eventAny.rename.from,
            to: eventAny.rename.to
          } : null,
          requested_reviewer: eventAny.requested_reviewer ? {
            login: eventAny.requested_reviewer.login,
            id: eventAny.requested_reviewer.id
          } : null,
          requested_team: eventAny.requested_team ? {
            name: eventAny.requested_team.name,
            id: eventAny.requested_team.id
          } : null,
          commit_id: eventAny.commit_id || null,
          commit_url: eventAny.commit_url || null
        };
      })
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
    
    return formattedIssues;
    
  } catch (error) {
    core.error(`Issue取得中にエラーが発生しました: ${error.message}`);
    throw error;
  }
}

