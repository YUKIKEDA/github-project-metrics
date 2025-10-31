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

### `project-scope`

**必須** Project取得のスコープを指定します。
- `user`: ユーザーレベルのプロジェクトを取得
- `organization`: 組織レベルのプロジェクトを取得

### `organization-name`

**オプション** `project-scope`が`organization`の場合に、特定の組織名を指定します。必須です。

### `output-path`

**オプション** JSONファイル（`issues.json`と`projects.json`）の出力先ディレクトリを指定します。相対パスを指定した場合、`GITHUB_WORKSPACE`ディレクトリからの相対パスとして扱われます。絶対パスも指定可能です。指定したディレクトリが存在しない場合は自動的に作成されます。未指定の場合、デフォルトで`GITHUB_WORKSPACE`（通常はリポジトリのルートディレクトリ）に出力されます。

**例:**
- `output-path: metrics` → `GITHUB_WORKSPACE/metrics/issues.json`に出力
- `output-path: ./data` → `GITHUB_WORKSPACE/data/issues.json`に出力
- 未指定 → `GITHUB_WORKSPACE/issues.json`に出力

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

### ユーザーレベルのプロジェクトを取得

```yaml
name: Get User Projects
on:
  workflow_dispatch:

jobs:
  get-metrics:
    runs-on: ubuntu-latest
    steps:
      - name: Get User Projects
        uses: ./
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          project-scope: "user"
        
      - name: Display Metrics
        run: |
          echo "Total issues: ${{ steps.get-metrics.outputs.issue-count }}"
          echo "Total projects: ${{ steps.get-metrics.outputs.project-count }}"
          echo "Total tasks: ${{ steps.get-metrics.outputs.total-tasks }}"
        
      # デフォルトではGITHUB_WORKSPACEにissues.jsonとprojects.jsonが自動生成されます
      - name: List Generated Files
        run: |
          ls -la *.json || echo "No JSON files found in workspace"
```

### 特定のディレクトリに出力する

```yaml
name: Get User Projects with Custom Output
on:
  workflow_dispatch:

jobs:
  get-metrics:
    runs-on: ubuntu-latest
    steps:
      - name: Get User Projects
        uses: ./
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          project-scope: "user"
          output-path: "metrics/reports"  # カスタム出力先
      
      - name: Display Metrics
        run: |
          echo "Total issues: ${{ steps.get-metrics.outputs.issue-count }}"
          echo "Total projects: ${{ steps.get-metrics.outputs.project-count }}"
          echo "Total tasks: ${{ steps.get-metrics.outputs.total-tasks }}"
      
      # metrics/reports ディレクトリにissues.jsonとprojects.jsonが生成されます
      - name: List Generated Files
        run: |
          find . -name "*.json" -type f || echo "No JSON files found"
```

### 特定の組織のプロジェクトを取得

```yaml
name: Get Organization Projects
on:
  workflow_dispatch:

jobs:
  get-metrics:
    runs-on: ubuntu-latest
    steps:
      - name: Get Organization Projects
        uses: ./
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          project-scope: "organization"
          organization-name: "my-organization"
        
      - name: Display Metrics
        run: |
          echo "Total issues: ${{ steps.get-metrics.outputs.issue-count }}"
          echo "Total projects: ${{ steps.get-metrics.outputs.project-count }}"
          echo "Total tasks: ${{ steps.get-metrics.outputs.total-tasks }}"
```
