import type { GitHubApiContext } from "../issues/types/githubApiContext";
import type { ResponseIssue } from "../issues/types/responseIssue";
import type { IssueEvent } from "./types/issueEvent";
import type { IssueWithEvent } from "./types/issueWithEvent";

const DEFAULT_TIMELINE_PREVIEW = "mockingbird";

export async function fetchTimelineEventsForIssue(
  context: GitHubApiContext,
  issueNumber: number,
): Promise<IssueEvent[]> {
  const { client, options } = context;
  const {
    repository: { owner, repo },
    pagination,
  } = options;

  const perPage = pagination?.perPage ?? 100;
  const maxPages = pagination?.maxPages;

  const iterator = client.paginate.iterator(client.issues.listEventsForTimeline, {
    owner,
    repo,
    issue_number: issueNumber,
    per_page: perPage,
    mediaType: {
      previews: [DEFAULT_TIMELINE_PREVIEW],
    },
  });

  const events: IssueEvent[] = [];
  let page = 0;

  for await (const { data } of iterator) {
    events.push(...(data as IssueEvent[]));
    page += 1;

    if (maxPages !== undefined && page >= maxPages) {
      break;
    }
  }

  return events;
}

export async function fetchIssuesWithEvents(
  context: GitHubApiContext,
  issues: ResponseIssue[],
): Promise<IssueWithEvent[]> {
  const results: IssueWithEvent[] = [];

  for (const issue of issues) {
    const events = await fetchTimelineEventsForIssue(context, issue.number);
    results.push({ issue, events });
  }

  return results;
}

