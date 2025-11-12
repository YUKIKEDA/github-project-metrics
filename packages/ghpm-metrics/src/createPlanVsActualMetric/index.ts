import type { CombinedIssue } from "@github-project-metrics/ghpm-issues";
import type { PlanVsActualMetric } from "../types/planVsActual";
import { createCycleTimeMetric } from "../createCycleTimeMetric";
import { createLeadTimeMetric } from "../createLeadTimeMetric";

/**
 * Project の数値フィールドから時間ベースの見積もりを取得し、
 * 実際の経過時間と比較して予実差を算出する。
 */

const ESTIMATION_KEYWORDS = [
  "estimate",
  "estimation",
  "estimated",
];

const UNIT_KEYWORDS: Array<{ keywords: string[]; unit: SupportedTimeUnit }> = [
  { keywords: ["hour", "hr", "h"], unit: "hour" },
  { keywords: ["day", "d"], unit: "day" },
  { keywords: ["minute", "min", "m"], unit: "minute" },
];

type SupportedTimeUnit = "minute" | "hour" | "day";

const MS_PER_UNIT: Record<SupportedTimeUnit, number> = {
  minute: 60_000,
  hour: 3_600_000,
  day: 86_400_000,
};

const DEFAULT_TIME_UNIT: SupportedTimeUnit = "hour";

type NumberFieldValue = Extract<
  NonNullable<CombinedIssue["projects"]>["fieldValues"]["nodes"][number],
  { __typename: "ProjectV2ItemFieldNumberValue" }
>;

function normalizeName(name: string | null | undefined): string {
  return (name ?? "").toLowerCase();
}

/**
 * 文字列が指定したキーワード集合のいずれかを含むか判定する。
 */
function includesKeyword(name: string, keywords: readonly string[]): boolean {
  if (!name) {
    return false;
  }

  return keywords.some((keyword) => {
    const normalizedKeyword = keyword.toLowerCase();
    return normalizedKeyword.length > 0 && name.includes(normalizedKeyword);
  });
}

function inferUnit(fieldName: string): SupportedTimeUnit | undefined {
  for (const { keywords, unit } of UNIT_KEYWORDS) {
    if (includesKeyword(fieldName, keywords)) {
      return unit;
    }
  }

  return undefined;
}

function isSupportedTimeUnit(unit: string | undefined): unit is SupportedTimeUnit {
  return unit === "minute" || unit === "hour" || unit === "day";
}

/**
 * ミリ秒単位の期間を指定した単位へ変換する。
 */
function convertDuration(durationMs: number, unit: SupportedTimeUnit): number {
  return durationMs / MS_PER_UNIT[unit];
}

/**
 * Project の数値フィールドから時間ベースの見積もり値を抽出する。
 */
function extractPlannedEstimate(issue: CombinedIssue): { planned: number; unit: SupportedTimeUnit } | undefined {
  const fieldValues = issue.projects?.fieldValues?.nodes ?? [];

  for (const fieldValue of fieldValues) {
    if (!fieldValue || fieldValue.__typename !== "ProjectV2ItemFieldNumberValue") {
      continue;
    }

    const numberField = fieldValue as NumberFieldValue;
    const value = numberField.number;

    if (value === null || value === undefined || !Number.isFinite(value)) {
      continue;
    }

    const rawFieldName = typeof numberField.field?.name === "string" ? numberField.field.name : "";
    const normalizedFieldName = normalizeName(rawFieldName);

    if (!includesKeyword(normalizedFieldName, ESTIMATION_KEYWORDS)) {
      continue;
    }

    const detectedUnit = inferUnit(normalizedFieldName);

    const unit = isSupportedTimeUnit(detectedUnit) ? detectedUnit : DEFAULT_TIME_UNIT;
    return { planned: value, unit };
  }

  return undefined;
}

/**
 * サイクルタイムまたはリードタイムから実績の期間 (ms) を取得する。
 */
function extractActualDuration(issue: CombinedIssue): number | undefined {
  const cycleTimeMetric = createCycleTimeMetric(issue);
  if (cycleTimeMetric && Number.isFinite(cycleTimeMetric.durationMs)) {
    return cycleTimeMetric.durationMs;
  }

  const leadTimeMetric = createLeadTimeMetric(issue);
  if (leadTimeMetric && Number.isFinite(leadTimeMetric.durationMs)) {
    return leadTimeMetric.durationMs;
  }

  return undefined;
}

/**
 * 計画値と実績値を比較するメトリクスを生成する。
 */
export function createPlanVsActualMetric(issue: CombinedIssue): PlanVsActualMetric | undefined {
  const plannedEstimate = extractPlannedEstimate(issue);
  if (!plannedEstimate) {
    return undefined;
  }

  const durationMs = extractActualDuration(issue);
  if (durationMs === undefined) {
    return undefined;
  }

  const actual = convertDuration(durationMs, plannedEstimate.unit);
  if (!Number.isFinite(actual)) {
    return undefined;
  }

  const { planned, unit } = plannedEstimate;
  const variance = actual - planned;
  const varianceRatio = planned !== 0 ? variance / planned : undefined;

  return {
    planned,
    actual,
    variance,
    varianceRatio,
    unit,
  };
}