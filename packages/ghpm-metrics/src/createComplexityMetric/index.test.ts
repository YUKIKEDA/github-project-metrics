import { describe, expect, it } from "vitest";
import type { CombinedIssue } from "@github-project-metrics/ghpm-issues";
import { createComplexityMetric } from "./index";

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

function buildIssue(fieldNamesToValues: Array<[string, number]>, overrides: Partial<CombinedIssue> = {}): CombinedIssue {
  const fieldNodes = fieldNamesToValues.map(([name, value]) => buildNumberField(name, value));

  return {
    issue: {},
    events: [],
    projects: {
      id: "project-item",
      type: "ISSUE",
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
      content: null,
      fieldValues: {
        nodes: fieldNodes as unknown as NonNullable<CombinedIssue["projects"]>["fieldValues"]["nodes"],
      },
    },
    ...overrides,
  } as CombinedIssue;
}

describe("createComplexityMetric", () => {
  it("推定値を Story Point として抽出する", () => {
    const issue = buildIssue([
      ["Story Points Estimate", 5],
    ]);

    const metric = createComplexityMetric(issue);

    expect(metric).toEqual(
      expect.objectContaining({
        estimated: 5,
        unit: "point",
        notes: 'estimated from "Story Points Estimate"',
      }),
    );
  });

  it("推定値のみの場合でもメトリクスを返す", () => {
    const issue = buildIssue([["Complexity Estimate", 3]]);

    const metric = createComplexityMetric(issue);

    expect(metric).toEqual({
      estimated: 3,
      unit: undefined,
      notes: 'estimated from "Complexity Estimate"',
    });
  });

  it("有効なフィールドが無い場合は undefined を返す", () => {
    const issue = buildIssue([["Review Count", 2]]);

    expect(createComplexityMetric(issue)).toBeUndefined();
  });
});

