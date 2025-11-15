/**
 * 作業項目の複雑さに関する情報。
 */
export interface ComplexityMetric {
  /** 見積もり時点での複雑さ (例: ストーリーポイント、時間など)。 */
  estimated?: number;
  /** 見積もりや実績に使用した単位 (例: "story_point", "hour")。 */
  unit?: string;
  /** 補足情報や複雑さの算出根拠。 */
  notes?: string;
}

