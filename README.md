# GitHub Project Metrics

GitHubのIssueやProjectの情報を取得してチームの生産性を計測するためのGitHubアクションです。

## 機能

- リポジトリの全Issueを取得（オープン・クローズ済み両方、プルリクエストも含む）
- Issueの詳細情報（作成者、アサイン、ラベル、マイルストーンなど）を取得
- Issueが属しているProject情報も自動で取得・統合
- Project内のカスタムフィールド値（Status、Iteration、Dateなど）を取得
- ページネーション対応で大量のデータも効率的に処理
- JSON形式で構造化されたデータを出力（IssueデータにProject情報を統合）

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

**オプション** JSONファイル（`issues.json`）の出力先ディレクトリを指定します。相対パスを指定した場合、`GITHUB_WORKSPACE`ディレクトリからの相対パスとして扱われます。絶対パスも指定可能です。指定したディレクトリが存在しない場合は自動的に作成されます。未指定の場合、デフォルトで`GITHUB_WORKSPACE`（通常はリポジトリのルートディレクトリ）に出力されます。

**例:**
- `output-path: metrics` → `GITHUB_WORKSPACE/metrics/issues.json`に出力
- `output-path: ./data` → `GITHUB_WORKSPACE/data/issues.json`に出力
- 未指定 → `GITHUB_WORKSPACE/issues.json`に出力

## Outputs

### `issues`

JSON形式で取得したIssueデータの配列（Project情報統合済み）。各Issueには以下の情報が含まれます：
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
- `events`: Issueイベントの配列（ステータス変更、ラベル変更、アサイニーなど）
- `projects`: このIssueが属しているProject情報の配列（複数のProjectに属している可能性がある）
  - `projectId`: Project ID
  - `projectTitle`: Projectタイトル
  - `projectNumber`: Project番号
  - `projectUrl`: Project URL
  - `fieldValues`: このIssueのProject内でのカスタムフィールド値の配列
    - `field`: フィールド情報（ID、名前）
    - `fieldName`: フィールド名（Status、Iteration、Start Date、End Date、Estimationなど）
    - `value`: フィールド値（SingleSelectの場合は選択肢名、Textの場合はテキスト、Numberの場合は数値、Dateの場合は日時文字列）
    - `iteration`: イテレーションフィールド値（Iterationフィールドの場合）
    - `milestone`: マイルストーンフィールド値（Milestoneフィールドの場合）
    - `users`: ユーザーフィールド値（Userフィールドの場合）

### `issue-count`

取得したIssueの総数

> **注意**: Projectデータは、Issueデータに統合されており、`issues.json`内の各Issueの`projects`フィールドから取得できます。独立した`projects.json`ファイルは生成されません。

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
        
      # デフォルトではGITHUB_WORKSPACEにissues.jsonが自動生成されます（Project情報も統合されています）
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
      
      # metrics/reports ディレクトリにissues.jsonが生成されます（Project情報も統合されています）
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
