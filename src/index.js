//@ts-check
/// <reference path="./types.d.ts" />
import * as core from "@actions/core";
import * as github from "@actions/github";
import * as fs from "fs";
import * as path from "path";

// 共通のGraphQLフラグメント
const ISSUE_FRAGMENT = `
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
`;

const PULL_REQUEST_FRAGMENT = `
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
`;

const DRAFT_ISSUE_FRAGMENT = `
  ... on DraftIssue {
    id
    title
    body
    createdAt
    updatedAt
  }
`;

const FIELD_VALUE_FRAGMENT = `
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
`;

const ITEM_FRAGMENT = `
  id
  type
  content {
    ${ISSUE_FRAGMENT}
    ${PULL_REQUEST_FRAGMENT}
    ${DRAFT_ISSUE_FRAGMENT}
  }
  fieldValues(first: 20) {
    nodes {
      ${FIELD_VALUE_FRAGMENT}
    }
  }
`;

const PROJECT_ITEMS_FRAGMENT = `
  items(first: 100) {
    totalCount
    pageInfo {
      hasNextPage
      endCursor
    }
    nodes {
      ${ITEM_FRAGMENT}
    }
  }
`;

const PROJECT_FRAGMENT = `
  id
  title
  number
  url
  createdAt
  updatedAt
  closedAt
  shortDescription
  ${PROJECT_ITEMS_FRAGMENT}
`;

const PROJECTS_FRAGMENT = `
  totalCount
  pageInfo {
    hasNextPage
    endCursor
  }
  nodes {
    ${PROJECT_FRAGMENT}
  }
`;

/**
 * プロジェクトのアイテムを全件取得する共通関数
 * @param {import('@octokit/core').Octokit} octokit - Octokitインスタンス
 * @param {string} projectId - プロジェクトID
 * @returns {Promise<Array<any>>} プロジェクトアイテムの配列
 */
async function getAllProjectItems(octokit, projectId) {
  const allItems = [];
  let hasNextPage = true;
  let endCursor = null;
  
  while (hasNextPage) {
    const itemsQuery = `
      query($projectId: ID!, $after: String) {
        node(id: $projectId) {
          ... on ProjectV2 {
            items(first: 100, after: $after) {
              pageInfo {
                hasNextPage
                endCursor
              }
              nodes {
                ${ITEM_FRAGMENT}
              }
            }
          }
        }
      }
    `;
    
    const { node } = await octokit.graphql(itemsQuery, {
      projectId: projectId,
      after: endCursor
    });
    
    if (node && node.items) {
      allItems.push(...node.items.nodes);
      hasNextPage = node.items.pageInfo.hasNextPage;
      endCursor = node.items.pageInfo.endCursor;
    } else {
      hasNextPage = false;
    }
  }
  
  return allItems;
}

/**
 * プロジェクトを全件取得する共通関数
 * @param {import('@octokit/core').Octokit} octokit - Octokitインスタンス
 * @param {('user'|'organization')} queryType - クエリタイプ（ユーザーまたは組織）
 * @param {string|null} [organizationName=null] - 組織名（queryTypeが'organization'の場合に必要）
 * @returns {Promise<Array<any>>} プロジェクトの配列
 */
async function fetchAllProjects(octokit, queryType, organizationName = null) {
  const allProjects = [];
  let hasNextPage = true;
  let endCursor = null;
  
  while (hasNextPage) {
    let query;
    let variables = { after: endCursor };
    
    if (queryType === 'user') {
      query = `
        query($after: String) {
          viewer {
            projectsV2(first: 100, after: $after) {
              ${PROJECTS_FRAGMENT}
            }
          }
        }
      `;
    } else if (queryType === 'organization') {
      if (!organizationName) {
        throw new Error('organizationName is required when queryType is organization');
      }
      query = `
        query($orgName: String!, $after: String) {
          organization(login: $orgName) {
            projectsV2(first: 100, after: $after) {
              ${PROJECTS_FRAGMENT}
            }
          }
        }
      `;
      variables.orgName = organizationName;
    }
    
    if (!query) {
      throw new Error('Query is not defined');
    }
    
    const result = await octokit.graphql(query, variables);
    const projectsData = queryType === 'user' 
      ? result?.viewer?.projectsV2 
      : result?.organization?.projectsV2;
    
    if (projectsData) {
      const projects = projectsData.nodes || [];
      core.info(`${queryType === 'user' ? 'ユーザー' : '組織'}のプロジェクト（このページ）: ${projects.length}件`);
      
      // 各プロジェクトのアイテムを全件取得
      for (const project of projects) {
        if (project.items && project.items.pageInfo.hasNextPage && project.id) {
          const allItems = await getAllProjectItems(octokit, project.id);
          project.items.nodes = allItems;
        }
      }
      
      allProjects.push(...projects);
      hasNextPage = projectsData.pageInfo.hasNextPage;
      endCursor = projectsData.pageInfo.endCursor;
    } else {
      hasNextPage = false;
    }
  }
  
  return allProjects;
}

/**
 * GitHubプロジェクト（v2）を取得し、整形して出力する
 * @returns {Promise<Project[]>} 整形されたプロジェクトデータの配列
 * @throws {Error} エラーが発生した場合
 */
async function getAllProjects() {
  const token = core.getInput("github-token");
  const projectScope = core.getInput("project-scope");
  const organizationName = core.getInput("organization-name");
  const octokit = github.getOctokit(token);
  
  core.info(`Project取得スコープ: ${projectScope}`);
  
  try {
    let allProjects = [];
    
    // ユーザーレベルのプロジェクトを取得
    if (projectScope === "user") {
      core.info("ユーザーレベルのプロジェクトを確認中...");
      allProjects = await fetchAllProjects(octokit, 'user');
      core.info(`ユーザーレベルのプロジェクト（全件）: ${allProjects.length}件`);
    }
    
    // 組織レベルのプロジェクトを取得
    if (projectScope === "organization") {
      if (organizationName) {
        core.info(`指定された組織 ${organizationName} のプロジェクトを確認中...`);
        // @ts-ignore - organizationNameはif文で確認済みなので、stringであることが保証されている
        allProjects = await fetchAllProjects(octokit, 'organization', organizationName);
        core.info(`組織 ${organizationName} のプロジェクト（全件）: ${allProjects.length}件`);
      } else {
        core.error("project-scopeがorganizationの場合、organization-nameの指定が必要です。");
        throw new Error("organization-name is required when project-scope is organization");
      }
    }
    
    core.info(`合計 ${allProjects.length}件のプロジェクトが見つかりました`);
    
    if (allProjects.length === 0) {
      core.warning("Project（v2）が見つかりませんでした。");
      core.setOutput("projects", JSON.stringify([]));
      core.setOutput("raw-projects", JSON.stringify([]));
      core.setOutput("project-count", "0");
      core.setOutput("total-tasks", "0");
      return [];
    }
    
    // プロジェクトデータは既に詳細情報を含んでいる
    const projects = allProjects;
    
    core.info(`合計 ${projects.length}件のProjectを取得しました`);
    
    // プロジェクトデータを整形
    /** @type {Project[]} */
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
    
    // JSONファイルを保存
    try {
      const workspacePath = process.env.GITHUB_WORKSPACE || '.';
      const issuesPath = path.join(workspacePath, 'issues.json');
      const projectsPath = path.join(workspacePath, 'projects.json');
      
      // issues.jsonファイルを保存（getAllIssuesから呼ばれる場合のみ）
      if (global.issuesData) {
        fs.writeFileSync(issuesPath, JSON.stringify(global.issuesData, null, 2));
        core.info(`Issues data saved to ${issuesPath}`);
      }
      
      // projects.jsonファイルを保存
      fs.writeFileSync(projectsPath, JSON.stringify(formattedProjects, null, 2));
      core.info(`Projects data saved to ${projectsPath}`);
      
    } catch (writeError) {
      core.warning(`Failed to save JSON files: ${writeError.message}`);
    }
    
    return formattedProjects;
    
  } catch (error) {
    core.error(`Project取得中にエラーが発生しました: ${error.message}`);
    throw error;
  }
}

/**
 * GitHubリポジトリのIssue（プルリクエスト含む）を取得し、整形して出力する
 * @returns {Promise<void>}
 * @throws {Error} エラーが発生した場合
 */
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
    
    // Issueデータをグローバル変数に保存（getAllProjectsで使用するため）
    global.issuesData = formattedIssues;
    
  } catch (error) {
    core.error(`Issue取得中にエラーが発生しました: ${error.message}`);
    throw error;
  }
}

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

