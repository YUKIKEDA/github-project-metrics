const IN_PROGRESS_EVENT_TYPES = new Set(["in_progress"]);
const ASSIGNED_EVENT_TYPES = new Set(["assigned"]);
const CLOSED_EVENT_TYPES = new Set(["closed", "issue_closed"]);
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
 * タイムラインイベントを元にサイクルタイムを算出する。
 * 開始時刻は「in_progress → assigned → issue 作成日時」の優先順位で決定し、
 * 終了時刻は issue の `closed_at` を使用する。
 */
export function createCycleTimeMetric(issue) {
    const closedAt = issue.issue.closed_at;
    if (!closedAt) {
        return undefined;
    }
    const end = Date.parse(closedAt);
    if (!Number.isFinite(end)) {
        return undefined;
    }
    const inProgressEvent = findFirstEvent(issue.events, IN_PROGRESS_EVENT_TYPES);
    const assignedEvent = findFirstEvent(issue.events, ASSIGNED_EVENT_TYPES);
    const startEvent = inProgressEvent ?? assignedEvent;
    const completedEvent = findFirstEvent(issue.events, CLOSED_EVENT_TYPES, true);
    const startTimestamp = startEvent?.created_at ?? issue.issue.created_at;
    if (!startTimestamp) {
        return undefined;
    }
    const start = Date.parse(startTimestamp);
    if (!Number.isFinite(start) || end <= start) {
        return undefined;
    }
    return {
        durationMs: end - start,
        startedAt: new Date(start).toISOString(),
        completedAt: new Date(end).toISOString(),
        startedEvent: startEvent?.event ?? "issue_opened",
        completedEvent: completedEvent?.event ?? "issue_closed",
    };
}
//# sourceMappingURL=index.js.map