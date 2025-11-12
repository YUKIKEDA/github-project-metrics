import type { RestEndpointMethodTypes } from "@octokit/rest";

export type IssueEvent =
  RestEndpointMethodTypes["issues"]["listEventsForTimeline"]["response"]["data"][number];

