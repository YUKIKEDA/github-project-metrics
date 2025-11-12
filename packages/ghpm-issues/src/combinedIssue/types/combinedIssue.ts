import type { IssueEvent } from "../../issueEvent/types/issueEvent";
import type { ResponseIssue } from "../../issues/types/responseIssue";
import type { ProjectV2Item } from "../../projects/types/projectData";

/**
 * 
 */
export interface CombinedIssue {
  /**
   * GitHub REST API から取得した Issue 本体。
   */
  issue: ResponseIssue;
  /**
   * Issue のタイムラインイベント一覧。
   */
  events: IssueEvent[];
  /**
   * Issue が紐付く Project 一覧。
   */
  projects: ProjectV2Item | null;
}
