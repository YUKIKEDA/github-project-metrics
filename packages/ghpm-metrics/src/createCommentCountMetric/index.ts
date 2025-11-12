import type { CombinedIssue } from "@github-project-metrics/ghpm-issues";
import type { CommentCountMetric } from "../types/commentCount";

const COMMENT_EVENT_TYPES = new Set([
  "commented",
  "commented_on",
  "timeline_comment",
  "issue_comment",
  "discussion_comment",
]);

type CombinedIssueEvent = CombinedIssue["events"][number];

function getEventType(event: CombinedIssueEvent): string | undefined {
  return typeof event.event === "string" ? (event.event as string) : undefined;
}

function isCommentEvent(event: CombinedIssueEvent): boolean {
  const eventType = getEventType(event);
  return eventType !== undefined && COMMENT_EVENT_TYPES.has(eventType);
}

function countCommentParticipants(events: CombinedIssue["events"]): number {
  const participants = new Set<string>();

  for (const event of events) {
    if (!isCommentEvent(event)) {
      continue;
    }

    const login = (event as { actor?: { login?: string | null } | null }).actor?.login ?? undefined;
    if (login) {
      participants.add(login);
    }
  }

  return participants.size;
}

function countCommentEvents(events: CombinedIssue["events"]): number {
  return events.filter(isCommentEvent).length;
}

/**
 * コメント関連イベントを基にコメント数メトリクスを生成する。
 */
export function createCommentCountMetric(issue: CombinedIssue): CommentCountMetric | undefined {
  const commentEventCount = countCommentEvents(issue.events);
  const totalComments = Math.max(issue.issue.comments ?? 0, commentEventCount);
  const participantCount = countCommentParticipants(issue.events);

  if (totalComments === 0 && participantCount === 0) {
    return undefined;
  }

  return {
    total: totalComments,
    participantCount,
  };
}

