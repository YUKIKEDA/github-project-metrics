import type { LeadTimeMetric } from "@github-project-metrics/ghpm-metrics";
import { kurtosis } from "@github-project-metrics/ghpm-statistics";

/**
 * LeadTimeMetric の各フィールドの尖度を計算します。
 *
 * @param metrics - 尖度を計算する LeadTimeMetric 配列
 * @returns 各フィールドの尖度。配列が空、または要素数が不足している場合は undefined を返します。
 */
export function calculateLeadTimeKurtosis(
  metrics: ReadonlyArray<LeadTimeMetric>,
): { durationMs: number } | undefined {
  if (metrics.length < 4) {
    return undefined;
  }

  const durationMsValues = metrics.map((m) => m.durationMs);

  try {
    return {
      durationMs: kurtosis(durationMsValues),
    };
  } catch {
    return undefined;
  }
}

