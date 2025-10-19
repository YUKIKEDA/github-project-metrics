# GitHub Project Metrics

GitHubのIssueやProjectの情報を取得してチームの生産性を計測するためのGitHubアクションです。

## 機能

- リポジトリの全Issueを取得（オープン・クローズ済み両方、プルリクエストも含む）
- Issueの詳細情報（作成者、アサイン、ラベル、マイルストーンなど）を取得
- リポジトリの全Project（v2）を取得
- Project内の全タスク（Issue、Pull Request、Draft Issue）を取得
- Projectのカスタムフィールド値も取得
- ページネーション対応で大量のデータも効率的に処理
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

### `projects`

JSON形式で取得したProjectデータの配列。各Projectには以下の情報が含まれます：
- `id`: Project ID
- `title`: Projectタイトル
- `number`: Project番号
- `url`: Project URL
- `createdAt`: 作成日時
- `updatedAt`: 更新日時
- `closedAt`: クローズ日時
- `shortDescription`: 短い説明
- `items`: Project内のタスク配列
- `totalItems`: タスク総数

各タスク（item）には以下の情報が含まれます：
- `id`: タスクID
- `type`: タスクタイプ（ISSUE、PULL_REQUEST、DRAFT_ISSUE）
- `content`: タスクの内容（Issue、Pull Request、Draft Issueの詳細）
- `fieldValues`: Projectのカスタムフィールド値

### `project-count`

取得したProjectの総数

### `total-tasks`

全Projectのタスク総数

## 使用例

```yaml
name: Get Repository Metrics
on:
  workflow_dispatch:

jobs:
  get-metrics:
    runs-on: ubuntu-latest
    steps:
      - name: Get Repository Metrics
        uses: ./
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
        
      - name: Display Metrics
        run: |
          echo "Total issues: ${{ steps.get-metrics.outputs.issue-count }}"
          echo "Total projects: ${{ steps.get-metrics.outputs.project-count }}"
          echo "Total tasks: ${{ steps.get-metrics.outputs.total-tasks }}"
        
      - name: Save Data to Files
        run: |
          echo '${{ steps.get-metrics.outputs.issues }}' > issues.json
          echo '${{ steps.get-metrics.outputs.projects }}' > projects.json
```
