/**
 * JSONファイル保存の設定。
 */
export interface SaveStatisticsConfig {
  /** 保存先のディレクトリパス。 */
  outputDir: string;
  /** ファイル名（拡張子なし）。指定しない場合は自動生成。 */
  filename?: string;
}

