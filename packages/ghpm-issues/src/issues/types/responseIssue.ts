import type { RestEndpointMethodTypes } from "@octokit/rest";

export type ResponseIssue =
  RestEndpointMethodTypes["issues"]["listForRepo"]["response"]["data"][number];
