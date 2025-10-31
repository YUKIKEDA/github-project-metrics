//@ts-check
/// <reference path="./types.d.ts" />
import * as core from "@actions/core";
import {
  ITEM_FRAGMENT,
  PROJECTS_FRAGMENT
} from "./fragments.js";

/**
 * プロジェクトのアイテムを全件取得する共通関数
 * @param {import('@octokit/core').Octokit} octokit - Octokitインスタンス
 * @param {string} projectId - プロジェクトID
 * @returns {Promise<Array<any>>} プロジェクトアイテムの配列
 */
export async function getAllProjectItems(octokit, projectId) {
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
export async function fetchAllProjects(octokit, queryType, organizationName = null) {
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

