import type { ResponseIssue } from "../issues/types/responseIssue";
import type { ProjectData, ProjectV2Item } from "../projects/types/projectData";
import type { IssueWithProject } from "./types/issueWithProject";

function createProjectItemMap(
  projectData: ProjectData | null | undefined,
): Map<number, ProjectV2Item> {
  const map = new Map<number, ProjectV2Item>();
  const items = projectData?.project?.items.nodes ?? [];

  for (const item of items) {
    const content = item.content;

    if (content && (content.__typename === "Issue" || content.__typename === "PullRequest")) {
      map.set(content.number, item);
    }
  }

  return map;
}

/**
 * REST API から取得した Issue と Projects v2 のアイテム情報を結合する。
 *
 * @param issues - REST API から取得した Issue 一覧。
 * @param projectData - Projects v2 から取得したプロジェクトデータ。null の場合は結合を行わない。
 * @returns Issue と Project アイテムを結合した結果。
 */
export function combineIssuesWithProject(
  issues: ResponseIssue[],
  projectData: ProjectData | null | undefined,
): IssueWithProject[] {
  const projectItemMap = createProjectItemMap(projectData);

  return issues.map<IssueWithProject>((issue) => ({
    issue,
    projects: projectItemMap.get(issue.number) ?? null,
  }));
}
