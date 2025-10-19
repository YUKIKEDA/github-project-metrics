# GitHub Project Metrics

GitHubのIssueやProjectの情報を取得してチームの生産性を計測するためのGitHubアクションです。

## 機能

- リポジトリの全Issueを取得（オープン・クローズ済み両方、プルリクエストも含む）
- Issueの詳細情報（作成者、アサイン、ラベル、マイルストーンなど）を取得
- ページネーション対応で大量のIssueも効率的に処理
- JSON形式で構造化されたデータを出力

## Inputs

### `github-token`

**必須** GitHub APIにアクセスするためのトークン。リポジトリの読み取り権限が必要です。

## Outputs

### `issues`

JSON形式で取得したIssueデータの配列。各Issueには以下の情報が含まれます：
- `number`: Issue番号
- `title`: Issueタイトル
- `state`: Issueの状態（open/closed）
- `created_at`: 作成日時
- `updated_at`: 更新日時
- `closed_at`: クローズ日時
- `user`: 作成者情報
- `assignees`: アサイニー情報
- `labels`: ラベル情報
- `milestone`: マイルストーン情報
- `comments`: コメント数
- `body`: Issue本文
- `pull_request`: プルリクエストかどうかのフラグ
- `draft`: ドラフトかどうかのフラグ（プルリクエストの場合）

### `issue-count`

取得したIssueの総数

## 使用例

```yaml
name: Get Repository Issues
on:
  workflow_dispatch:

jobs:
  get-issues:
    runs-on: ubuntu-latest
    steps:
      - name: Get Repository Issues
        uses: ./
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
        
      - name: Display Issue Count
        run: echo "Total issues: ${{ steps.get-issues.outputs.issue-count }}"
        
      - name: Save Issues to File
        run: |
          echo '${{ steps.get-issues.outputs.issues }}' > issues.json
```
