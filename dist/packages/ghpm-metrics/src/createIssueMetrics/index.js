import { createCommentCountMetric } from "../createCommentCountMetric";
import { createCycleTimeMetric } from "../createCycleTimeMetric";
import { createLeadTimeMetric } from "../createLeadTimeMetric";
import { createComplexityMetric } from "../createComplexityMetric";
import { createPlanVsActualMetric } from "../createPlanVsActualMetric";
import { createReviewTimeMetric } from "../createReviewTimeMetric";
/**
 * Issue と Project 情報を統合したデータセットから `IssueMetrics[]` を生成する。
 *
 * @param combinedIssue REST Issue と Project v2 アイテムを結合したデータ。
 * @returns メトリクス計算に利用できる IssueMetrics 配列。
 */
export function createIssueMetrics(combinedIssue) {
    return combinedIssue.map((issue) => ({
        issue: createIssueItem(issue),
        metrics: createMetricData(issue),
    }));
}
function createMetricData(issue) {
    const metrics = {};
    const commentMetric = createCommentCountMetric(issue);
    if (commentMetric) {
        metrics.commentCount = commentMetric;
    }
    const leadTimeMetric = createLeadTimeMetric(issue);
    if (leadTimeMetric) {
        metrics.leadTime = leadTimeMetric;
    }
    const cycleTimeMetric = createCycleTimeMetric(issue);
    if (cycleTimeMetric) {
        metrics.cycleTime = cycleTimeMetric;
    }
    const complexityMetric = createComplexityMetric(issue);
    if (complexityMetric) {
        metrics.complexity = complexityMetric;
    }
    const planVsActualMetric = createPlanVsActualMetric(issue);
    if (planVsActualMetric) {
        metrics.planVsActual = planVsActualMetric;
    }
    const reviewTimeMetric = createReviewTimeMetric(issue);
    if (reviewTimeMetric) {
        metrics.reviewTime = reviewTimeMetric;
    }
    return metrics;
}
function createIssueItem(combinedIssue) {
    const { issue, events, projects } = combinedIssue;
    const issueUser = normalizeUser(issue.user);
    const assignees = (issue.assignees ?? []).map(normalizeUser);
    const labels = normalizeLabels(issue.labels);
    const milestone = issue.milestone ? normalizeIssueMilestone(issue.milestone) : null;
    const normalizedEvents = normalizeEvents(events);
    const normalizedProjects = projects ? [normalizeProject(projects)] : [];
    return {
        number: issue.number,
        title: issue.title,
        state: issue.state,
        created_at: issue.created_at,
        updated_at: issue.updated_at,
        closed_at: issue.closed_at ?? null,
        user: issueUser,
        assignees,
        labels,
        milestone,
        comments: issue.comments,
        body: issue.body ?? null,
        pull_request: Boolean(issue.pull_request),
        draft: Boolean(issue.draft),
        events: normalizedEvents,
        projects: normalizedProjects,
    };
}
function normalizeUser(user) {
    return {
        login: user?.login ?? "ghost",
        id: user?.id ?? 0,
    };
}
function normalizeOptionalUser(user) {
    return user ? normalizeUser(user) : null;
}
function normalizeLabels(labels) {
    return (labels ?? []).map((label) => {
        if (typeof label === "string") {
            return {
                name: label,
                color: "",
                description: null,
            };
        }
        return {
            name: label?.name ?? "",
            color: label?.color ?? "",
            description: label?.description ?? null,
        };
    });
}
function normalizeIssueMilestone(milestone) {
    return {
        title: milestone.title ?? "",
        state: milestone.state ?? undefined,
        description: milestone.description ?? null,
        due_on: milestone.due_on ?? null,
    };
}
function normalizeEvents(events) {
    return events.map((rawEvent) => {
        const event = rawEvent;
        return {
            id: event.id,
            node_id: event.node_id,
            url: event.url,
            actor: normalizeOptionalUser(event.actor ?? null),
            event: (event.event ?? ""),
            commit_id: event.commit_id ?? null,
            commit_url: event.commit_url ?? null,
            created_at: event.created_at,
            label: event.label ? normalizeEventLabel(event.label) : null,
            assignee: normalizeOptionalUser(event.assignee ?? null),
            assigner: normalizeOptionalUser(event.assigner ?? null),
            review_requester: normalizeOptionalUser(event.review_requester ?? null),
            requested_reviewer: normalizeOptionalUser(event.requested_reviewer ?? null),
            requested_team: event.requested_team
                ? {
                    id: event.requested_team.id,
                    slug: event.requested_team.slug,
                    name: event.requested_team.name ?? undefined,
                }
                : null,
            dismissed_review: event.dismissed_review
                ? {
                    state: event.dismissed_review.state,
                    review_id: event.dismissed_review.review_id,
                    dismissal_message: event.dismissed_review.dismissal_message ?? null,
                    dismissal_commit_id: event.dismissed_review.dismissal_commit_id ?? null,
                }
                : null,
            milestone: event.milestone ? normalizeTimelineMilestone(event.milestone) : null,
            project_card: event.project_card
                ? {
                    url: event.project_card.url,
                    id: event.project_card.id,
                    project_url: event.project_card.project_url,
                    project_id: event.project_card.project_id,
                    column_name: event.project_card.column_name,
                    previous_column_name: event.project_card.previous_column_name ?? null,
                }
                : null,
            rename: event.rename ?? null,
            lock_reason: event.lock_reason ?? null,
        };
    });
}
function normalizeTimelineMilestone(milestone) {
    return {
        title: milestone.title ?? "",
        description: milestone.description ?? null,
        due_on: milestone.due_on ?? null,
        state: milestone.state ?? undefined,
    };
}
function normalizeEventLabel(label) {
    return {
        name: label.name ?? "",
        color: label.color ?? "",
        description: label.description ?? null,
    };
}
function normalizeProject(project) {
    const fieldValues = project.fieldValues?.nodes ?? [];
    const fieldValueResults = fieldValues
        .map(convertProjectFieldValue)
        .filter((value) => value !== null);
    const content = project.content ?? null;
    const projectTitle = typeof content?.title === "string" ? content.title : "";
    const projectNumber = typeof content?.number === "number" ? content.number : 0;
    const projectUrl = typeof content?.url === "string" ? content.url : "";
    return {
        projectId: project.id,
        projectTitle,
        projectNumber,
        projectUrl,
        fieldValues: fieldValueResults,
    };
}
function convertProjectFieldValue(value) {
    const field = toProjectFieldDefinition(value);
    const fieldName = field.name;
    switch (value.__typename) {
        case "ProjectV2ItemFieldDateValue": {
            const dateValue = value;
            return {
                field,
                fieldName,
                type: "date",
                value: dateValue.date ?? null,
            };
        }
        case "ProjectV2ItemFieldIterationValue": {
            const iterationValue = value;
            if (!iterationValue.iterationId || !iterationValue.title) {
                return null;
            }
            return {
                field,
                fieldName,
                type: "iteration",
                value: null,
                iteration: {
                    iterationId: iterationValue.iterationId,
                    title: iterationValue.title,
                    startDate: iterationValue.startDate ?? "",
                    duration: iterationValue.duration ?? 0,
                },
            };
        }
        case "ProjectV2ItemFieldLabelValue": {
            const labelValue = value;
            const labels = labelValue.labels.nodes ?? [];
            return {
                field,
                fieldName,
                type: "label",
                value: null,
                labels: labels.map((label) => ({
                    id: label.id,
                    name: label.name,
                    color: label.color ?? undefined,
                })),
            };
        }
        case "ProjectV2ItemFieldMilestoneValue": {
            const milestoneValue = value;
            if (!milestoneValue.milestone) {
                return null;
            }
            return {
                field,
                fieldName,
                type: "milestone",
                value: null,
                milestone: {
                    title: milestoneValue.milestone.title,
                    dueOn: milestoneValue.milestone.dueOn ?? null,
                    state: milestoneValue.milestone.state ?? undefined,
                },
            };
        }
        case "ProjectV2ItemFieldNumberValue": {
            const numberValue = value;
            return {
                field,
                fieldName,
                type: "number",
                value: numberValue.number ?? null,
            };
        }
        case "ProjectV2ItemFieldPullRequestValue": {
            const pullRequestValue = value;
            const pullRequests = pullRequestValue.pullRequests.nodes ?? [];
            return {
                field,
                fieldName,
                type: "pullRequest",
                value: null,
                pullRequests: pullRequests.map((pullRequest) => ({
                    id: pullRequest.id,
                    number: pullRequest.number,
                    title: pullRequest.title,
                    url: pullRequest.url,
                })),
            };
        }
        case "ProjectV2ItemFieldRepositoryValue": {
            const repositoryValue = value;
            const repository = repositoryValue.repository;
            return {
                field,
                fieldName,
                type: "repository",
                value: null,
                repositories: repository
                    ? [
                        {
                            id: repository.id,
                            nameWithOwner: repository.nameWithOwner,
                            url: repository.url ?? "",
                        },
                    ]
                    : [],
            };
        }
        case "ProjectV2ItemFieldSingleSelectValue": {
            const singleSelectValue = value;
            return {
                field,
                fieldName,
                type: "singleSelect",
                value: singleSelectValue.name ?? null,
            };
        }
        case "ProjectV2ItemFieldTextValue": {
            const textValue = value;
            return {
                field,
                fieldName,
                type: "text",
                value: textValue.text ?? null,
            };
        }
        case "ProjectV2ItemFieldUserValue": {
            const userValue = value;
            const users = userValue.users.nodes ?? [];
            return {
                field,
                fieldName,
                type: "users",
                value: null,
                users: users.map((user) => ({
                    id: user.id,
                    login: user.login,
                })),
            };
        }
        default:
            return null;
    }
}
function toProjectFieldDefinition(value) {
    const field = value.field;
    return {
        id: field.id,
        name: field.name,
    };
}
//# sourceMappingURL=index.js.map