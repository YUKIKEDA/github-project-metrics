import type { Issues } from './type';

/**
 * 指定した期間に作成された Issue のみを抽出する。
 *
 * @param issues issues.json から読み込んだ Issue 一覧
 * @param startDate フィルタ対象期間の開始日時 (ISO 8601 形式)。未指定または不正な場合は下限なし
 * @param endDate フィルタ対象期間の終了日時 (ISO 8601 形式)。未指定または不正な場合は上限なし
 * @returns 期間でフィルタされた Issue 配列
 */
export function filterIssuesByDateRange(
  issues: Issues,
  startDate?: string,
  endDate?: string,
): Issues {
  const start = parseDate(startDate);
  const end = parseDate(endDate);

  if (start && end && start > end) {
    return [];
  }

  return issues.filter((issue) => {
    const createdAt = parseDate(issue.created_at);
    if (!createdAt) {
      return false;
    }

    if (start && createdAt < start) {
      return false;
    }

    if (end && createdAt > end) {
      return false;
    }

    return true;
  });
}

function parseDate(value?: string): Date | undefined {
  if (!value) {
    return undefined;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}
