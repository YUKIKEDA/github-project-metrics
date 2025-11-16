const COMMENT_EVENT_TYPES = new Set([
    "commented",
    "commented_on",
    "timeline_comment",
    "issue_comment",
    "discussion_comment",
]);
function getEventType(event) {
    return typeof event.event === "string" ? event.event : undefined;
}
function isCommentEvent(event) {
    const eventType = getEventType(event);
    return eventType !== undefined && COMMENT_EVENT_TYPES.has(eventType);
}
function countCommentParticipants(events) {
    const participants = new Set();
    for (const event of events) {
        if (!isCommentEvent(event)) {
            continue;
        }
        const login = event.actor?.login ?? undefined;
        if (login) {
            participants.add(login);
        }
    }
    return participants.size;
}
function countCommentEvents(events) {
    return events.filter(isCommentEvent).length;
}
/**
 * コメント関連イベントを基にコメント数メトリクスを生成する。
 */
export function createCommentCountMetric(issue) {
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
//# sourceMappingURL=index.js.map