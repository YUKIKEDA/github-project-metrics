import type { CombinedIssue } from "@github-project-metrics/ghpm-issues";
import type { ComplexityMetric } from "../types/complexity";

/**
 * 推定対象となるキーワード一覧。
 * フィールド名に含まれる場合は複雑さの見積り候補として扱う。
 */
const ESTIMATION_KEYWORDS = [
  "estimate",
  "estimation",
  "estimated",
  "story point",
  "storypoint",
  "sp",
  "points",
  "complexity",
  "size"
];

/**
 * フィールド名と推定単位の対応表。
 * より具体的な単位を検知した場合にメトリクスへ付与する。
 */
const UNIT_KEYWORDS: Array<{ keywords: string[]; unit: ComplexityMetric["unit"] }> = [
  { keywords: ["story point", "storypoint", "sp", "function point", "fp", "pt", "point"], unit: "point" },
  { keywords: ["hour", "hr", "h"], unit: "hour" },
  { keywords: ["day", "d"], unit: "day" },
  { keywords: ["minute", "min", "m"], unit: "minute" },
];

/**
 * Project V2 の数値フィールドを表す型。
 */
type NumberFieldValue = Extract<
  NonNullable<CombinedIssue["projects"]>["fieldValues"]["nodes"][number],
  { __typename: "ProjectV2ItemFieldNumberValue" }
>;

/**
 * フィールド名を小文字へ正規化する。
 */
function normalizeName(name: string | null | undefined): string {
  return (name ?? "").toLowerCase();
}

/**
 * 指定したキーワードのいずれかが文字列に含まれるかを判定する。
 */
function includesKeyword(name: string, keywords: readonly string[]): boolean {
  return keywords.some((keyword) => {
    const normalizedKeyword = keyword.toLowerCase().trim();
    if (normalizedKeyword.length === 0) {
      return false;
    }

    const requiresWordBoundary = normalizedKeyword.length <= 2 && !/\s/.test(normalizedKeyword);
    if (requiresWordBoundary) {
      const pattern = new RegExp(`\\b${escapeRegExp(normalizedKeyword)}\\b`, "i");
      return pattern.test(name);
    }

    return name.includes(normalizedKeyword);
  });
}

/**
 * フィールド名から対応する単位を推定する。
 */
function inferUnit(fieldName: string): ComplexityMetric["unit"] | undefined {
  for (const { keywords, unit } of UNIT_KEYWORDS) {
    if (includesKeyword(fieldName, keywords)) {
      return unit;
    }
  }

  return undefined;
}

/**
 * 正規表現パターン用に特殊文字をエスケープする。
 */
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Project フィールドの数値情報を基に複雑さメトリクスを推定する。
 *
 * @param issue 対象となる課題とその Project フィールド
 * @returns 推定した複雑さメトリクス。利用可能な値が無い場合は undefined
 */
export function createComplexityMetric(issue: CombinedIssue): ComplexityMetric | undefined {
  const project = issue.projects;

  const fieldValues = project?.fieldValues?.nodes ?? [];
  if (fieldValues.length === 0) {
    return undefined;
  }

  for (const fieldValue of fieldValues) {
    if (fieldValue?.__typename !== "ProjectV2ItemFieldNumberValue") {
      continue;
    }

    const numberField = fieldValue as NumberFieldValue;
    const value = numberField.number;
    if (value === null || value === undefined) {
      continue;
    }

    const fieldNameRaw = typeof numberField.field?.name === "string" ? numberField.field.name : "";
    const fieldName = normalizeName(fieldNameRaw);

    if (!fieldName) {
      continue;
    }

    const unit = inferUnit(fieldName);

    if (includesKeyword(fieldName, ESTIMATION_KEYWORDS)) {
      const notes = `estimated from "${fieldNameRaw}"`;
      return {
        estimated: value,
        unit,
        notes,
      };
    }
  }

  return undefined;
}