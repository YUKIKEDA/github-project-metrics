/**
 * 計画値と実績値の差異を表すメトリクス。
 * 見積もり精度や納期遵守状況の把握に使用する。
 */
export interface PlanVsActualMetric {
  /** 計画した値 (例: 工数、日数など)。 */
  planned: number;
  /** 実際にかかった値。 */
  actual: number;
  /** 差分 (actual - planned)。 */
  variance: number;
  /** 差分比率 (variance / planned)。 planned が 0 の場合は undefined。 */
  varianceRatio?: number;
  /** 使用した単位 (例: "hour", "point")。 */
  unit?: string;
}

