# Website

This website is built using [Docusaurus](https://docusaurus.io/), a modern static website generator.

このリポジトリは **ルートが pnpm ワークスペース** になっているため、
ドキュメントサイトも pnpm で管理します。

## Installation

ルートディレクトリで依存関係をインストールします:

```bash
pnpm install
```

## Local Development

ルートから docs パッケージを指定して起動します:

```bash
pnpm --filter docs start
```

もしくは `docs/` ディレクトリに移動して実行しても構いません:

```bash
cd docs
pnpm start
```

このコマンドはローカル開発サーバーを起動し、ブラウザを開きます。
ほとんどの変更はサーバーの再起動なしに自動で反映されます。

## Build

```bash
pnpm --filter docs build
```

`build` ディレクトリに静的ファイルが生成され、任意の静的ホスティングサービスで配信できます。

## Deployment (GitHub Pages)

GitHub Pages へデプロイする場合は、Docusaurus の `deploy` スクリプトを pnpm 経由で呼び出します。

SSH を使う場合:

```bash
pnpm --filter docs deploy --env USE_SSH=true
```

SSH を使わない場合:

```bash
pnpm --filter docs deploy --env GIT_USER=<Your GitHub username>
```

このコマンドはビルドを実行し、`gh-pages` ブランチに push して GitHub Pages に公開します。
