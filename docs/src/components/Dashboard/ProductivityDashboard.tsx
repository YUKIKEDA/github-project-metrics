import type { ReactElement } from "react";
import { useEffect, useMemo, useState } from "react";
import useBaseUrl from "@docusaurus/useBaseUrl";
import Heading from "@theme/Heading";
import { useColorMode } from "@docusaurus/theme-common";
import clsx from "clsx";
import type { Issue, StatisticsData, MetricKey, TabKey } from "./types";
import { KPICard, ThroughputCard } from "./KPICard";
import {
  TrendAnalysis,
  DistributionAnalysis,
  CorrelationAnalysis,
  SegmentAnalysis,
  RegressionAnalysis,
} from "./AnalysisTabs";
import {
  extractProjects,
  filterIssuesByProject,
  calculateKPIData,
  calculateThroughput,
} from "./utils";
import styles from "./styles.module.css";

function useProductivityData() {
  const issuesUrl = useBaseUrl("/data/issues.json");
  const statsUrl = useBaseUrl("/data/statistics.json");
  const [issues, setIssues] = useState<Issue[] | null>(null);
  const [statistics, setStatistics] = useState<StatisticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    Promise.all([
      fetch(issuesUrl).then((res) => (res.ok ? res.json() : [])),
      fetch(statsUrl).then((res) => (res.ok ? res.json() : null)),
    ])
      .then(([issuesData, statsData]) => {
        if (mounted) {
          setIssues(issuesData);
          setStatistics(statsData);
          setLoading(false);
        }
      })
      .catch((error) => {
        console.error("Failed to load data:", error);
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [issuesUrl, statsUrl]);

  return { issues, statistics, loading };
}

export default function ProductivityDashboard(): ReactElement {
  const { issues, statistics, loading } = useProductivityData();
  const { colorMode } = useColorMode();
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<TabKey>("trend");

  const palette = useMemo(() => {
    const isDark = colorMode === "dark";
    return {
      text: isDark ? "#f3f4f6" : "#1f2933",
      subtleText: isDark ? "#cbd5f5" : "#4b5563",
      axis: isDark ? "rgba(243,244,246,0.6)" : "rgba(31,41,51,0.55)",
      splitLine: isDark ? "rgba(148,163,184,0.25)" : "rgba(203,213,225,0.6)",
      colors: isDark
        ? ["#60a5fa", "#f472b6", "#fbbf24", "#2dd4bf", "#a78bfa", "#fb923c"]
        : ["#2563eb", "#f97316", "#0ea5e9", "#059669", "#ec4899", "#f59e0b"],
    };
  }, [colorMode]);

  const projects = useMemo(() => {
    if (!issues) return [];
    return extractProjects(issues);
  }, [issues]);

  const filteredIssues = useMemo(() => {
    if (!issues) return [];
    return filterIssuesByProject(issues, selectedProject);
  }, [issues, selectedProject]);

  const kpiMetrics: MetricKey[] = [
    "leadTime",
    "cycleTime",
    "reviewTime",
    "complexity",
    "comments",
  ];

  const kpiData = useMemo(() => {
    return kpiMetrics
      .map((metric) => calculateKPIData(filteredIssues, statistics, metric))
      .filter((d): d is NonNullable<typeof d> => d !== null);
  }, [filteredIssues, statistics]);

  const throughputData = useMemo(() => {
    const now = new Date();
    const twoWeeksAgo = new Date(now);
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const fourWeeksAgo = new Date(now);
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

    const current = filteredIssues.filter((issue) => {
      if (!issue.closed_at) return false;
      const closedDate = new Date(issue.closed_at);
      return closedDate >= twoWeeksAgo && closedDate <= now;
    }).length;

    const previous = filteredIssues.filter((issue) => {
      if (!issue.closed_at) return false;
      const closedDate = new Date(issue.closed_at);
      return closedDate >= fourWeeksAgo && closedDate < twoWeeksAgo;
    }).length;

    return {
      current,
      previous,
      currentPeriod: `${twoWeeksAgo.toLocaleDateString(
        "ja-JP"
      )} 〜 ${now.toLocaleDateString("ja-JP")}`,
      previousPeriod: `${fourWeeksAgo.toLocaleDateString(
        "ja-JP"
      )} 〜 ${twoWeeksAgo.toLocaleDateString("ja-JP")}`,
    };
  }, [filteredIssues]);

  if (loading) {
    return (
      <div className={styles.loadingState}>
        <span>ダッシュボードデータを読み込み中です…</span>
      </div>
    );
  }

  if (!issues || issues.length === 0) {
    return (
      <div className={styles.loadingState}>
        <span>データが見つかりませんでした。</span>
      </div>
    );
  }

  return (
    <div className={clsx("container", styles.dashboard)}>
      <div className={styles.dashboardHeader}>
        <div className={styles.projectSelector}>
          <label htmlFor="project-select">プロジェクトの選択:</label>
          <select
            id="project-select"
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className={styles.projectSelect}
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.kpiSection}>
        <h3 className={styles.subsectionTitle}>プロジェクト生産性 指標</h3>
        <div className={styles.kpiGrid}>
          {kpiData.map((data) => (
            <KPICard key={data.metric} data={data} />
          ))}
          <ThroughputCard
            value={throughputData.current}
            previousValue={throughputData.previous}
            currentPeriod={throughputData.currentPeriod}
            previousPeriod={throughputData.previousPeriod}
          />
        </div>
      </div>

      <div className={styles.analysisSection}>
        <h3 className={styles.subsectionTitle}>プロジェクト生産性分析</h3>

        <div className={styles.tabContainer}>
          <div className={styles.tabButtons}>
            <button
              className={clsx(
                styles.tabButton,
                activeTab === "trend" && styles.tabButtonActive
              )}
              onClick={() => setActiveTab("trend")}
            >
              トレンド分析
            </button>
            <button
              className={clsx(
                styles.tabButton,
                activeTab === "distribution" && styles.tabButtonActive
              )}
              onClick={() => setActiveTab("distribution")}
            >
              分布分析
            </button>
            <button
              className={clsx(
                styles.tabButton,
                activeTab === "correlation" && styles.tabButtonActive
              )}
              onClick={() => setActiveTab("correlation")}
            >
              相関分析
            </button>
            <button
              className={clsx(
                styles.tabButton,
                activeTab === "segment" && styles.tabButtonActive
              )}
              onClick={() => setActiveTab("segment")}
            >
              セグメント分析
            </button>
            <button
              className={clsx(
                styles.tabButton,
                activeTab === "regression" && styles.tabButtonActive
              )}
              onClick={() => setActiveTab("regression")}
            >
              重回帰分析
            </button>
          </div>

          <div className={styles.tabContent}>
            {activeTab === "trend" && (
              <TrendAnalysis
                issues={filteredIssues}
                statistics={statistics}
                palette={palette}
              />
            )}
            {activeTab === "distribution" && (
              <DistributionAnalysis
                issues={filteredIssues}
                statistics={statistics}
                palette={palette}
              />
            )}
            {activeTab === "correlation" && (
              <CorrelationAnalysis
                issues={filteredIssues}
                statistics={statistics}
                palette={palette}
              />
            )}
            {activeTab === "segment" && (
              <SegmentAnalysis issues={filteredIssues} palette={palette} />
            )}
            {activeTab === "regression" && (
              <RegressionAnalysis issues={filteredIssues} statistics={statistics} palette={palette} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
