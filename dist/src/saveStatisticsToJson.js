import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
/**
 * 統計データをJSONファイルに保存する。
 *
 * @param config - 保存設定
 * @param data - 保存する統計データ
 */
export function saveStatisticsToJson(config, data) {
    // ディレクトリが存在しない場合は作成
    mkdirSync(config.outputDir, { recursive: true });
    // ファイル名を決定
    const filename = config.filename ?? "statistics.json";
    const filepath = join(config.outputDir, filename);
    // JSONを整形して保存
    const jsonContent = JSON.stringify(data, null, 2);
    writeFileSync(filepath, jsonContent, "utf-8");
}
//# sourceMappingURL=saveStatisticsToJson.js.map