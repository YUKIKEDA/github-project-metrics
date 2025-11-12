import type { ResponseIssue } from "../../issues/types/responseIssue";
import type { IssueEvent } from "./issueEvent";

export interface IssueWithEvent {
  issue: ResponseIssue;
  events: IssueEvent[];
}