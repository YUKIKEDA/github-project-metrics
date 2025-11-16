import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@github-project-metrics/ghpm-issues": resolve(
        __dirname,
        "packages/ghpm-issues/src/index.ts",
      ),
      "@github-project-metrics/ghpm-statistics": resolve(
        __dirname,
        "packages/ghpm-statistics/src/index.ts",
      ),
      "@github-project-metrics/ghpm-metrics": resolve(
        __dirname,
        "packages/ghpm-metrics/src/index.ts",
      ),
      "@github-project-metrics/ghpm-metrics-statistics": resolve(
        __dirname,
        "packages/ghpm-metrics-statistics/src/index.ts",
      ),
    },
  },
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
      exclude: ["dist", "pnpm-lock.yaml"],
    },
  },
});
