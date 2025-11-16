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
const UNIT_KEYWORDS = [
    { keywords: ["hour", "hr", "h"], unit: "hour" },
    { keywords: ["day", "d"], unit: "day" },
    { keywords: ["minute", "min", "m"], unit: "minute" },
];
const MS_PER_UNIT = {
    minute: 60_000,
    hour: 3_600_000,
    day: 86_400_000,
};
const DEFAULT_TIME_UNIT = "hour";
function normalizeName(name) {
    return (name ?? "").toLowerCase();
}
/**
 * 文字列が指定したキーワード集合のいずれかを含むか判定する。
 */
function includesKeyword(name, keywords) {
    if (!name) {
        return false;
    }
    return keywords.some((keyword) => {
        const normalizedKeyword = keyword.toLowerCase();
        return normalizedKeyword.length > 0 && name.includes(normalizedKeyword);
    });
}
function inferUnit(fieldName) {
    for (const { keywords, unit } of UNIT_KEYWORDS) {
        if (includesKeyword(fieldName, keywords)) {
            return unit;
        }
    }
    return undefined;
}
function isSupportedTimeUnit(unit) {
    return unit === "minute" || unit === "hour" || unit === "day";
}
/**
 * ミリ秒単位の期間を指定した単位へ変換する。
 */
function convertDuration(durationMs, unit) {
    return durationMs / MS_PER_UNIT[unit];
}
/**
 * Project の数値フィールドから時間ベースの見積もり値を抽出する。
 */
function extractPlannedEstimate(issue) {
    const fieldValues = issue.projects?.fieldValues?.nodes ?? [];
    for (const fieldValue of fieldValues) {
        if (!fieldValue || fieldValue.__typename !== "ProjectV2ItemFieldNumberValue") {
            continue;
        }
        const numberField = fieldValue;
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
function extractActualDuration(issue) {
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
export function createPlanVsActualMetric(issue) {
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
//# sourceMappingURL=index.js.map