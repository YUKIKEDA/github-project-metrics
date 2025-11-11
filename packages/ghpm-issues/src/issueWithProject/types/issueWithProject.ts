import type { ResponseIssue } from "../../issues/types/responseIssue";
import type { ProjectV2Item } from "../../projects/types/projectData";

/**
 * REST API から取得した Issue と Projects v2 から取得した Project データの結合結果。
 */
export interface IssueWithProject {
  /**
   * GitHub REST API から取得した Issue 本体。
   */
  issue: ResponseIssue;
  /**
   * Issue が紐付く Project 一覧。
   */
  projects: ProjectV2Item | null;
}
