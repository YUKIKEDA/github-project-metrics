const DEFAULT_TIMELINE_PREVIEW = "mockingbird";
export async function fetchTimelineEventsForIssue(context, issueNumber) {
    const { client, options } = context;
    const { repository: { owner, repo }, pagination, } = options;
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
    const events = [];
    let page = 0;
    for await (const { data } of iterator) {
        events.push(...data);
        page += 1;
        if (maxPages !== undefined && page >= maxPages) {
            break;
        }
    }
    return events;
}
export async function fetchIssuesWithEvents(context, issues) {
    const results = [];
    for (const issue of issues) {
        const events = await fetchTimelineEventsForIssue(context, issue.number);
        results.push({ issue, events });
    }
    return results;
}
//# sourceMappingURL=index.js.map