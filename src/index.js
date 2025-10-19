import * as core from "@actions/core";
import * as github from "@actions/github";

async function getAllProjects() {
  const token = core.getInput("github-token");
  const octokit = github.getOctokit(token);
  
  const { owner, repo } = github.context.repo;
  
  core.info(`リポジトリ ${owner}/${repo} のProjectを取得中...`);
  
  try {
    // GraphQLクエリでプロジェクトを取得
    const query = `
      query($owner: String!, $repo: String!) {
        repository(owner: $owner, name: $repo) {
          projectsV2(first: 100) {
            nodes {
              id
              title
              number
              url
              createdAt
              updatedAt
              closedAt
              shortDescription
              items(first: 100) {
                totalCount
                nodes {
                  id
                  type
                  content {
                    ... on Issue {
                      id
                      number
                      title
                      state
                      createdAt
                      updatedAt
                      closedAt
                      url
                      assignees(first: 10) {
                        nodes {
                          id
                          login
                        }
                      }
                      labels(first: 10) {
                        nodes {
                          id
                          name
                          color
                        }
                      }
                    }
                    ... on PullRequest {
                      id
                      number
                      title
                      state
                      createdAt
                      updatedAt
                      closedAt
                      url
                      isDraft
                      assignees(first: 10) {
                        nodes {
                          id
                          login
                        }
                      }
                      labels(first: 10) {
                        nodes {
                          id
                          name
                          color
                        }
                      }
                    }
                    ... on DraftIssue {
                      id
                      title
                      body
                      createdAt
                      updatedAt
                    }
                  }
                  fieldValues(first: 20) {
                    nodes {
                      ... on ProjectV2ItemFieldSingleSelectValue {
                        field {
                          ... on ProjectV2SingleSelectField {
                            id
                            name
                          }
                        }
                        name
                      }
                      ... on ProjectV2ItemFieldTextValue {
                        field {
                          ... on ProjectV2Field {
                            id
                            name
                          }
                        }
                        text
                      }
                      ... on ProjectV2ItemFieldNumberValue {
                        field {
                          ... on ProjectV2Field {
                            id
                            name
                          }
                        }
                        number
                      }
                      ... on ProjectV2ItemFieldDateValue {
                        field {
                          ... on ProjectV2Field {
                            id
                            name
                          }
                        }
                        date
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    `;
    
    const { repository } = await octokit.graphql(query, {
      owner,
      repo
    });
    
    const projects = repository?.projectsV2?.nodes || [];
    
    core.info(`合計 ${projects.length}件のProjectを取得しました`);
    
    // プロジェクトデータを整形
    const formattedProjects = projects.map(project => ({
      id: project.id,
      title: project.title,
      number: project.number,
      url: project.url,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      closedAt: project.closedAt,
      shortDescription: project.shortDescription,
      items: project.items.nodes.map(item => ({
        id: item.id,
        type: item.type,
        content: item.content ? {
          id: item.content.id,
          number: item.content.number,
          title: item.content.title,
          state: item.content.state,
          createdAt: item.content.createdAt,
          updatedAt: item.content.updatedAt,
          closedAt: item.content.closedAt,
          url: item.content.url,
          isDraft: item.content.isDraft || false,
          assignees: item.content.assignees?.nodes || [],
          labels: item.content.labels?.nodes || [],
          body: item.content.body || null
        } : null,
        fieldValues: item.fieldValues.nodes.map(fieldValue => ({
          field: fieldValue.field,
          value: fieldValue.name || fieldValue.text || fieldValue.number || fieldValue.date
        }))
      })),
      totalItems: project.items.totalCount
    }));
    
    // 出力として設定
    core.setOutput("projects", JSON.stringify(formattedProjects));
    core.setOutput("raw-projects", JSON.stringify(projects)); // 整形前の生データも出力
    core.setOutput("project-count", projects.length.toString());
    
    // 全プロジェクトのタスク数を計算
    const totalTasks = formattedProjects.reduce((sum, project) => sum + project.totalItems, 0);
    core.setOutput("total-tasks", totalTasks.toString());
    
    core.info(`Project取得が完了しました。総数: ${projects.length}件、総タスク数: ${totalTasks}件`);
    
    // ProjectデータのJSONを表示
    core.info("=== Projectデータ（整形済み） ===");
    core.info(JSON.stringify(formattedProjects, null, 2));
    
    core.info("=== Projectデータ（生データ） ===");
    core.info(JSON.stringify(projects, null, 2));
    
    return formattedProjects;
    
  } catch (error) {
    core.error(`Project取得中にエラーが発生しました: ${error.message}`);
    throw error;
  }
}

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
    core.setOutput("raw-issues", JSON.stringify(allIssues)); // 整形前の生データも出力
    core.setOutput("issue-count", allIssues.length.toString());
    
    core.info(`Issue取得が完了しました。総数: ${allIssues.length}件`);
    
  } catch (error) {
    core.error(`Issue取得中にエラーが発生しました: ${error.message}`);
    throw error;
  }
}

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
