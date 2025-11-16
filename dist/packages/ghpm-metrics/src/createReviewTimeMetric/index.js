const REVIEW_REQUESTED_EVENT_TYPES = new Set(["review_requested", "review_requested_team"]);
const MERGED_EVENT_TYPES = new Set(["merged"]);
/**
 * タイムラインイベントに `created_at` フィールドが存在するか判定する。
 */
function hasCreatedAt(event) {
    return (typeof event === "object" &&
        event !== null &&
        "created_at" in event &&
        typeof event.created_at === "string");
}
/**
 * タイムラインイベントからイベント種別文字列を取得する。
 */
function getEventType(event) {
    return typeof event.event === "string" ? event.event : undefined;
}
/**
 * 指定したイベント種別に該当する最初（または最後）のタイムラインイベントを取得する。
 *
 * @param events タイムラインイベント一覧
 * @param eventTypes 抽出対象のイベント種別集合
 * @param reverse true の場合は最新側から探索する
 */
function findFirstEvent(events, eventTypes, reverse = false) {
    const sortableEvents = events
        .map((event) => {
        const eventType = getEventType(event);
        if (!eventType || !hasCreatedAt(event)) {
            return undefined;
        }
        return {
            ...event,
            event: eventType,
            created_at: event.created_at,
        };
    })
        .filter((event) => Boolean(event));
    sortableEvents.sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at));
    const iterable = reverse ? [...sortableEvents].reverse() : sortableEvents;
    return iterable.find((event) => eventTypes.has(event.event));
}
/**
 * レビュー時間 (レビュー開始〜マージ) を算出する。
 */
export function createReviewTimeMetric(issue) {
    const isPullRequest = Boolean(issue.issue.pull_request);
    if (!isPullRequest) {
        return undefined;
    }
    const reviewRequestedEvent = findFirstEvent(issue.events, REVIEW_REQUESTED_EVENT_TYPES);
    if (!reviewRequestedEvent) {
        return undefined;
    }
    const mergedEvent = findFirstEvent(issue.events, MERGED_EVENT_TYPES, true);
    const mergedTimestamp = mergedEvent?.created_at ?? issue.issue.closed_at ?? undefined;
    if (!mergedTimestamp) {
        return undefined;
    }
    const reviewRequestedAt = reviewRequestedEvent.created_at;
    const reviewRequestedMs = Date.parse(reviewRequestedAt);
    const mergedMs = Date.parse(mergedTimestamp);
    if (!Number.isFinite(reviewRequestedMs) || !Number.isFinite(mergedMs) || mergedMs <= reviewRequestedMs) {
        return undefined;
    }
    return {
        duration: mergedMs - reviewRequestedMs,
        reviewRequestedAt: new Date(reviewRequestedMs).toISOString(),
        reviewMergedAt: new Date(mergedMs).toISOString(),
    };
}
//# sourceMappingURL=index.js.map