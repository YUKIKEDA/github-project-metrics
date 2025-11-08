# GitHub Project Metrics

GitHubのIssueやProjectの情報を取得してチームの生産性を計測するためのGitHubアクションです。

📖 **ドキュメント**: [GitHub Pages](https://YUKIKEDA.github.io/github-project-metrics/)で詳細なドキュメントを公開しています。

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

### `debug-json`

**オプション** `true` に設定すると、生データの出力や詳細ログ（整形済み JSON のダンプなど）を有効にします。デフォルトは `false` です。

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
```

## 生成される JSON データの構造

アクション実行後は `output-path`（未指定時はリポジトリルート）に `issues.json` と `statistics.json` が生成されます。以下は主なフィールド構成です。

### `issues.json`

配列要素（各 Issue）は以下のフィールドを含みます。

| フィールド | 型 | 説明 |
| --- | --- | --- |
| `number` | number | Issue 番号 |
| `title` | string | Issue タイトル |
| `state` | `"open"` / `"closed"` | 状態 |
| `created_at`, `updated_at`, `closed_at` | string | 各日時 (ISO8601) |
| `user` | object or null | 作成者情報（`login`, `id`） |
| `assignees` | object[] | アサイン情報（`login`, `id`） |
| `labels` | object[] | ラベル（`name`, `color`） |
| `milestone` | object or null | マイルストーン（`title`, `state`） |
| `comments` | number | コメント数 |
| `body` | string or null | 本文 |
| `pull_request` | boolean | PR であれば `true` |
| `draft` | boolean | PR がドラフトなら `true` |
| `events` | object[] | Issue イベント。代表的なフィールド: `id`, `event`, `created_at`, `actor`, `assignee`, `label`, `milestone`, `rename`, `requested_reviewer`, `requested_team`, `commit_id`, `commit_url` など |
| `projects` | object[] | Project 情報（下表参照） |

**`projects` 内部の構造**

| フィールド | 型 | 説明 |
| --- | --- | --- |
| `projectId` | string | Project ID |
| `projectTitle` | string | Project タイトル |
| `projectNumber` | number | Project 番号 |
| `projectUrl` | string | Project URL |
| `fieldValues` | object[] | カスタムフィールド値（下表参照） |

**`fieldValues` 内部の構造**

| フィールド | 型 | 説明 |
| --- | --- | --- |
| `field` | object | GitHub API が返すフィールドメタ情報（ID 等） |
| `fieldName` | string | フィールド名（例: `Status`, `Iteration`, `Start Date` など） |
| `value` | string \| number \| null | 基本値（SingleSelect/ Text/ Number/ Date などに対応） |
| `iteration` | object or null | イテレーション値（`iterationId`, `title`, `startDate`, `duration`） |
| `milestone` | object or null | Milestone 値（`id`, `title`, `description`, `dueOn`） |
| `users` | object[] or null | User 値（`id`, `login` の配列） |

### `statistics.json`

`performStatisticalAnalysis` の結果が格納されます。主な構造は以下の通りです。

| フィールド | 型 | 説明 |
| --- | --- | --- |
| `descriptive` | object | 記述統計量 |
| `descriptive.leadTime` 等 | object | `count`, `mean`, `median`, `p90`, `std_dev` などの統計値 |
| `anomalies` | object | 外れ値・異常検知の結果 |
| `anomalies.iqrOutliers` / `anomalies.zScoreOutliers` | object[] | `index`, `value`, `isOutlier`, `zScore`, `severity` など |
| `anomalies.patterns` | object[] | 異常パターン（`type`, `severity`, `metric`, `current`, `baseline`, `increase_pct` 等） |
| `correlations` | object | 相関分析の結果 |
| `correlations.topFactors` | object | 各メトリクスごとに相関要因を配列で保持（要素は `factor`, `correlation`, `absCorrelation`, `pValue`, `strength`, `rSquared` など） |

`debug-json` を `true` にすると、整形済みデータの JSON がログにも出力され、詳細な調査が容易になります（大量ログになる点に注意してください）。
