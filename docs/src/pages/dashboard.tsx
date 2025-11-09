import type { ReactNode } from "react";
import Layout from "@theme/Layout";
import Heading from "@theme/Heading";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import Dashboard from "@site/src/components/Dashboard";

export default function DashboardPage(): ReactNode {
  const { siteConfig } = useDocusaurusContext();

  return (
    <Layout
      title={`${siteConfig.title} ダッシュボード`}
      description="GitHub プロジェクトメトリクスのダッシュボードを表示します。"
    >
      <main className="margin-vert--lg">
        <div className="container">
          <Heading as="h1" className="margin-bottom--md">
            プロジェクトダッシュボード
          </Heading>
          <Dashboard />
        </div>
      </main>
    </Layout>
  );
}
