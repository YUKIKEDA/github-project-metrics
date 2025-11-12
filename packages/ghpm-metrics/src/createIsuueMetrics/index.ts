import type { CombinedIssue, ProjectV2Item, ProjectV2ItemFieldValue } from "@github-project-metrics/ghpm-issues";
import type {
  IssueMetrics,
  IssueItem,
  IssueEvent,
  IssueProject,
  ProjectFieldDefinition,
  ProjectFieldValue,
} from "../types/issueMetrics";
import type { MetricData } from "../types/metricsData";
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
export function createIssueMetrics(combinedIssue: CombinedIssue[]): IssueMetrics[] {
  return combinedIssue.map<IssueMetrics>((issue) => ({
    issue: createIssueItem(issue),
    metrics: createMetricData(issue),
  }));
}

function createMetricData(issue: CombinedIssue): MetricData {
  const metrics: MetricData = {};

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

type TimelineEventLike = {
  event: string;
  id?: number;
  node_id?: string;
  url?: string;
  actor?: { login?: string | null; id?: number | null } | null;
  commit_id?: string | null;
  commit_url?: string | null;
  created_at?: string;
  label?: {
    name?: string | null;
    color?: string | null;
    description?: string | null;
  } | null;
  assignee?: { 
    login?: string | null; 
    id?: number | null 
  } | null;
  assigner?: { 
    login?: string | null; 
    id?: number | null 
  } | null;
  review_requester?: { 
    login?: string | null; 
    id?: number | null 
  } | null;
  requested_reviewer?: { 
    login?: string | null; 
    id?: number | null 
  } | null;
  requested_team?: { 
    id: number; slug: string; 
    name?: string | null 
  } | null;
  dismissed_review?: {
    state: string;
    review_id: number;
    dismissal_message?: string | null;
    dismissal_commit_id?: string | null;
  } | null;
  milestone?: {
    title?: string | null;
    state?: string | null;
    description?: string | null;
    due_on?: string | null;
  } | null;
  project_card?: {
    url: string;
    id: number;
    project_url: string;
    project_id: number;
    column_name: string;
    previous_column_name?: string | null;
  } | null;
  rename?: { 
    from: string; 
    to: string 
  } | null;
  lock_reason?: string | null;
};
function createIssueItem(combinedIssue: CombinedIssue): IssueItem {
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
    state: issue.state as IssueItem["state"],
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

function normalizeUser(user: { login?: string | null; id?: number | null } | null | undefined): IssueItem["user"] {
  return {
    login: user?.login ?? "ghost",
    id: user?.id ?? 0,
  };
}

function normalizeOptionalUser(
  user: { login?: string | null; id?: number | null } | null | undefined,
): IssueEvent["actor"] {
  return user ? normalizeUser(user) : null;
}

function normalizeLabels(labels: CombinedIssue["issue"]["labels"] | undefined): IssueItem["labels"] {
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

function normalizeIssueMilestone(
  milestone: NonNullable<CombinedIssue["issue"]["milestone"]>,
): IssueItem["milestone"] {
  return {
    title: milestone.title ?? "",
    state: milestone.state ?? undefined,
    description: milestone.description ?? null,
    due_on: milestone.due_on ?? null,
  };
}

function normalizeEvents(events: CombinedIssue["events"]): IssueEvent[] {
  return events.map((rawEvent) => {
    const event = rawEvent as TimelineEventLike;

    return {
      id: event.id,
      node_id: event.node_id,
      url: event.url,
      actor: normalizeOptionalUser(event.actor ?? null),
      event: (event.event ?? "") as IssueEvent["event"],
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

function normalizeTimelineMilestone(milestone: NonNullable<TimelineEventLike["milestone"]>): IssueEvent["milestone"] {
  return {
    title: milestone.title ?? "",
    description: milestone.description ?? null,
    due_on: milestone.due_on ?? null,
    state: milestone.state ?? undefined,
  };
}

function normalizeEventLabel(label: NonNullable<TimelineEventLike["label"]>): IssueEvent["label"] {
  return {
    name: label.name ?? "",
    color: label.color ?? "",
    description: label.description ?? null,
  };
}

function normalizeProject(project: ProjectV2Item): IssueProject {
  const fieldValues = project.fieldValues?.nodes ?? [];
  const fieldValueResults = fieldValues
    .map(convertProjectFieldValue)
    .filter((value): value is ProjectFieldValue => value !== null);

  const content = project.content ?? null;
  const projectTitle = typeof (content as { title?: unknown })?.title === "string" ? (content as { title: string }).title : "";
  const projectNumber =
    typeof (content as { number?: unknown })?.number === "number" ? (content as { number: number }).number : 0;
  const projectUrl =
    typeof (content as { url?: unknown })?.url === "string" ? (content as { url: string }).url : "";

  return {
    projectId: project.id,
    projectTitle,
    projectNumber,
    projectUrl,
    fieldValues: fieldValueResults,
  };
}

function convertProjectFieldValue(value: ProjectV2ItemFieldValue): ProjectFieldValue | null {
  const field = toProjectFieldDefinition(value);
  const fieldName = field.name;

  switch (value.__typename) {
    case "ProjectV2ItemFieldDateValue": {
      const dateValue = value as Extract<ProjectV2ItemFieldValue, { __typename: "ProjectV2ItemFieldDateValue" }>;
      return {
        field,
        fieldName,
        type: "date",
        value: dateValue.date ?? null,
      };
    }
    case "ProjectV2ItemFieldIterationValue": {
      const iterationValue = value as Extract<
        ProjectV2ItemFieldValue,
        { __typename: "ProjectV2ItemFieldIterationValue" }
      >;

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
      const labelValue = value as Extract<ProjectV2ItemFieldValue, { __typename: "ProjectV2ItemFieldLabelValue" }>;
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
      const milestoneValue = value as Extract<
        ProjectV2ItemFieldValue,
        { __typename: "ProjectV2ItemFieldMilestoneValue" }
      >;

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
      const numberValue = value as Extract<ProjectV2ItemFieldValue, { __typename: "ProjectV2ItemFieldNumberValue" }>;
      return {
        field,
        fieldName,
        type: "number",
        value: numberValue.number ?? null,
      };
    }
    case "ProjectV2ItemFieldPullRequestValue": {
      const pullRequestValue = value as Extract<
        ProjectV2ItemFieldValue,
        { __typename: "ProjectV2ItemFieldPullRequestValue" }
      >;
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
      const repositoryValue = value as Extract<
        ProjectV2ItemFieldValue,
        { __typename: "ProjectV2ItemFieldRepositoryValue" }
      >;
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
      const singleSelectValue = value as Extract<
        ProjectV2ItemFieldValue,
        { __typename: "ProjectV2ItemFieldSingleSelectValue" }
      >;
      return {
        field,
        fieldName,
        type: "singleSelect",
        value: singleSelectValue.name ?? null,
      };
    }
    case "ProjectV2ItemFieldTextValue": {
      const textValue = value as Extract<ProjectV2ItemFieldValue, { __typename: "ProjectV2ItemFieldTextValue" }>;
      return {
        field,
        fieldName,
        type: "text",
        value: textValue.text ?? null,
      };
    }
    case "ProjectV2ItemFieldUserValue": {
      const userValue = value as Extract<ProjectV2ItemFieldValue, { __typename: "ProjectV2ItemFieldUserValue" }>;
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

function toProjectFieldDefinition(value: ProjectV2ItemFieldValue): ProjectFieldDefinition {
  const field = value.field;

  return {
    id: field.id,
    name: field.name,
  };
}

