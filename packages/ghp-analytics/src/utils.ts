
/** 1 時間を表すミリ秒数 */
const MS_IN_HOUR = 3_600_000;

/**
 * ISO 8601 文字列を Date に変換する。変換できなければ undefined を返す。
 * @param value 変換対象の日時文字列
 * @returns Date もしくは undefined
 */
function parseDate(value?: string): Date | undefined {
  if (!value) {
    return undefined;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

/**
 * 2 つの日時の差分を時間数で返す。
 * @param start 開始日時
 * @param end 終了日時
 * @returns 差分時間
 */
function diffHours(start: Date, end: Date): number {
  return (end.getTime() - start.getTime()) / MS_IN_HOUR;
}