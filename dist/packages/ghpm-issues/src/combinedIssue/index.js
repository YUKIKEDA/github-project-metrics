function createProjectItemMap(projectData) {
    const map = new Map();
    const items = projectData?.project?.items.nodes ?? [];
    for (const item of items) {
        const content = item.content;
        if (content && (content.__typename === "Issue" || content.__typename === "PullRequest")) {
            map.set(content.number, item);
        }
    }
    return map;
}
/**
 * REST API から取得した Issue + Timeline Events と Projects v2 のアイテム情報を結合する。
 *
 * @param issuesWithEvents - REST API から取得した Issue と Timeline Events の一覧。
 * @param projectData - Projects v2 から取得したプロジェクトデータ。null の場合は結合を行わない。
 * @returns Issue / Project / Events を結合した結果。
 */
export function combineIssuesWithProject(issuesWithEvents, projectData) {
    const projectItemMap = createProjectItemMap(projectData);
    return issuesWithEvents.map(({ issue, events }) => ({
        issue,
        events,
        projects: projectItemMap.get(issue.number) ?? null,
    }));
}
//# sourceMappingURL=index.js.map