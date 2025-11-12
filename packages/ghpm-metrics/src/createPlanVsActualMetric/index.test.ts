import { describe, expect, it } from "vitest";
import type { CombinedIssue } from "@github-project-metrics/ghpm-issues";
import { createPlanVsActualMetric } from "./index";

function buildNumberField(name: string, value: number) {
  return {
    __typename: "ProjectV2ItemFieldNumberValue",
    number: value,
    field: {
      __typename: "ProjectV2Field",
      id: `field-${name}`,
      name,
      dataType: "NUMBER",
    },
  } as const;
}

function buildEvent(event: string, createdAt: string) {
  return {
    id: `${event}-${createdAt}`,
    event,
    created_at: createdAt,
  } as const;
}

function buildIssue({
  fields = [],
  issueFields = {},
  events = [],
}: {
  fields?: Array<[string, number]>;
  issueFields?: Record<string, unknown>;
  events?: ReadonlyArray<ReturnType<typeof buildEvent>>;
} = {}): CombinedIssue {
  const fieldNodes = fields.map(([name, value]) => buildNumberField(name, value));

  return {
    issue: {
      created_at: "2024-01-01T00:00:00Z",
      closed_at: "2024-01-02T00:00:00Z",
      ...issueFields,
    },
    events: events as unknown as CombinedIssue["events"],
    projects:
      fieldNodes.length === 0
        ? null
        : {
            id: "project-item",
            type: "ISSUE",
            createdAt: "2024-01-01T00:00:00Z",
            updatedAt: "2024-01-01T00:00:00Z",
            content: null,
            fieldValues: {
              nodes: fieldNodes as unknown as NonNullable<CombinedIssue["projects"]>["fieldValues"]["nodes"],
            },
          },
  } as CombinedIssue;
}

describe("createPlanVsActualMetric", () => {
  it("見積フィールドが無い場合は undefined を返す", () => {
    const issue = buildIssue();

    expect(createPlanVsActualMetric(issue)).toBeUndefined();
  });

  it("サイクルタイムが算出できない場合は undefined を返す", () => {
    const issue = buildIssue({
      fields: [["Estimate (Hours)", 4]],
      issueFields: { closed_at: undefined },
    });

    expect(createPlanVsActualMetric(issue)).toBeUndefined();
  });

  it("見積値とサイクルタイムから計画と実績を算出する", () => {
    const issue = buildIssue({
      fields: [["Estimate (Hours)", 3]],
      issueFields: {
        created_at: "2024-01-01T00:00:00Z",
        closed_at: "2024-01-01T04:00:00Z",
      },
    });

    const metric = createPlanVsActualMetric(issue);

    expect(metric).toEqual(
      expect.objectContaining({
        planned: 3,
        actual: 4,
        variance: 1,
        unit: "hour",
      }),
    );
    expect(metric?.varianceRatio).toBeCloseTo(1 / 3);
  });

  it("サイクルタイムが無効な場合はリードタイムを使用する", () => {
    const issue = buildIssue({
      fields: [["Estimate (Days)", 0]],
      issueFields: {
        created_at: "2024-01-01T00:00:00Z",
        closed_at: "2024-01-03T00:00:00Z",
      },
      events: [buildEvent("in_progress", "2024-01-04T00:00:00Z")],
    });

    const metric = createPlanVsActualMetric(issue);

    expect(metric).toEqual({
      planned: 0,
      actual: 2,
      variance: 2,
      varianceRatio: undefined,
      unit: "day",
    });
  });
});
