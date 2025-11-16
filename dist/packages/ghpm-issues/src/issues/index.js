export async function fetchAllIssues(context) {
    const { client, options } = context;
    const { repository: { owner, repo }, pagination, } = options;
    const perPage = pagination?.perPage ?? 100;
    const maxPages = pagination?.maxPages;
    const issues = [];
    const iterator = client.paginate.iterator(client.issues.listForRepo, {
        owner,
        repo,
        per_page: perPage,
        state: "all",
    });
    let page = 0;
    for await (const { data } of iterator) {
        issues.push(...data);
        page += 1;
        if (maxPages !== undefined && page >= maxPages) {
            break;
        }
    }
    return issues;
}
//# sourceMappingURL=index.js.map