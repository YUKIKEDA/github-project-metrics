import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // テスト環境を Node.js に設定
    environment: "node",
    coverage: {
      // カバレッジ取得に V8 ランタイムを利用
      provider: "v8",
      // カバレッジレポートの出力先ディレクトリ
      reportsDirectory: "coverage",
      // 生成するレポート形式。コンソール用の text と HTML を出力
      reporter: ["text", "html"],
      // カバレッジ集計から除外するパス
      exclude: ["dist", "pnpm-lock.yaml"]
    }
  }
});

