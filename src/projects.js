//@ts-check
/// <reference path="./types.d.ts" />
import * as core from "@actions/core";
import * as github from "@actions/github";
import * as fs from "fs";
import * as path from "path";
import { fetchAllProjects } from "./projectUtils.js";

/**
 * GitHubプロジェクト（v2）を取得し、整形して出力する
 * @returns {Promise<Project[]>} 整形されたプロジェクトデータの配列
 * @throws {Error} エラーが発生した場合
 */
export async function getAllProjects() {
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

