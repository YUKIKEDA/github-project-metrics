//@ts-check
/// <reference path="./types.d.ts" />
import * as core from "@actions/core";
import * as github from "@actions/github";
import { fetchAllProjects } from "./projectUtils.js";

/**
 * GitHubプロジェクト（v2）を取得し、整形して返す
 * @returns {Promise<Project[]>} 整形されたプロジェクトデータの配列
 * @throws {Error} エラーが発生した場合
 */
export async function getAllProjects() {
  const token = core.getInput("github-token");
  const projectScope = core.getInput("project-scope");
  const organizationName = core.getInput("organization-name");
  const debugJson = core.getBooleanInput("debug-json");
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
        fieldValues: item.fieldValues.nodes.map(fieldValue => {
          // @ts-ignore - GitHub APIのフィールド値オブジェクトは動的なプロパティを持つ
          const fieldValueAny = /** @type {any} */ (fieldValue);
          
          // フィールド名を取得（Status、Iteration、Start Date、End Date、Estimationなど）
          const fieldName = fieldValue.field?.name || '';
          
          // 基本フィールド値（SingleSelect、Text、Number、Date）
          // SingleSelectの場合: fieldValueAny.name に選択肢名が入る（例："Todo"、"In Progress"）
          // Textの場合: fieldValueAny.text にテキストが入る
          // Numberの場合: fieldValueAny.number に数値が入る
          // Dateの場合: fieldValueAny.date に日時文字列が入る
          let value = fieldValueAny.name || fieldValueAny.text || fieldValueAny.number || fieldValueAny.date || null;
          
          // Iterationフィールド値（フィールド名が"Iteration"の場合）
          const iteration = fieldValueAny.iterationId ? {
            iterationId: fieldValueAny.iterationId,
            title: fieldValueAny.title || '',
            startDate: fieldValueAny.startDate || '',
            duration: fieldValueAny.duration || 0
          } : null;
          
          // Milestoneフィールド値
          const milestone = fieldValueAny.milestone ? {
            id: fieldValueAny.milestone.id || '',
            title: fieldValueAny.milestone.title || '',
            description: fieldValueAny.milestone.description || null,
            dueOn: fieldValueAny.milestone.dueOn || null
          } : null;
          
          // Userフィールド値
          const users = fieldValueAny.users?.nodes ? fieldValueAny.users.nodes.map((/** @type {any} */ user) => ({
            id: user.id,
            login: user.login
          })) : null;
          
          return {
            field: fieldValue.field,
            fieldName: fieldName, // フィールド名を明示的に追加（Status、Start Date、End Date、Estimation、Iterationなど）
            value: value,
            iteration: iteration,
            milestone: milestone,
            users: users
          };
        })
      })),
      totalItems: project.items.totalCount
    }));
    
    // 全プロジェクトのタスク数を計算
    const totalTasks = formattedProjects.reduce((sum, project) => sum + project.totalItems, 0);
    
    core.info(`Project取得が完了しました。総数: ${projects.length}件、総タスク数: ${totalTasks}件`);
    
    // Projectサマリー情報を表示
    core.info("=== Projectサマリー ===");
    core.info(`総プロジェクト数: ${projects.length}件`);
    core.info(`総タスク数: ${totalTasks}件`);
    
    if (debugJson) {
      formattedProjects.forEach((project, index) => {
        core.info(`\n--- Project ${index + 1}: ${project.title} ---`);
        core.info(`ID: ${project.id}`);
        core.info(`URL: ${project.url}`);
        core.info(`タスク数: ${project.totalItems}件`);
        core.info(`作成日: ${project.createdAt}`);
        core.info(`更新日: ${project.updatedAt}`);
        if (project.shortDescription) {
          core.info(`説明: ${project.shortDescription}`);
        }
      });
      
      // ProjectデータのJSONを表示（詳細版）
      core.info("\n=== Projectデータ（整形済み） ===");
      core.info(JSON.stringify(formattedProjects, null, 2));
    }
    
    return formattedProjects;
    
  } catch (error) {
    core.error(`Project取得中にエラーが発生しました: ${error.message}`);
    throw error;
  }
}

