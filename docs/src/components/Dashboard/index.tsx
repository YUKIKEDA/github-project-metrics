import type { ReactElement } from "react";
import { useEffect, useMemo, useState } from "react";
import useBaseUrl from "@docusaurus/useBaseUrl";
import Heading from "@theme/Heading";
import { useColorMode } from "@docusaurus/theme-common";
import ReactECharts from "echarts-for-react";
import clsx from "clsx";

import styles from "./styles.module.css";

type Summary = {
  period: string;
  totalCommits: number;
  totalIssues: number;
  totalPullRequests: number;
  activeContributors: number;
};

type MonthlyVelocity = {
  month: string;
  commits: number;
  pullRequests: number;
  issuesClosed: number;
};

type IssueType = {
  type: string;
  count: number;
};

type Language = {
  language: string;
  percentage: number;
};

type Contributor = {
  name: string;
  commits: number;
};

type DashboardData = {
  summary: Summary;
  monthlyVelocity: MonthlyVelocity[];
  issueTypes: IssueType[];
  languageBreakdown: Language[];
  topContributors: Contributor[];
};

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: string;
}): ReactElement {
  return (
    <div className={styles.summaryCard}>
      <span className={styles.summaryValue}>{value}</span>
      <span className={styles.summaryLabel}>{label}</span>
    </div>
  );
}

function useDashboardData(): DashboardData | null {
  const dataUrl = useBaseUrl("/data/dashboard.json");
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    let mounted = true;

    fetch(dataUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to load dashboard data: ${response.status}`);
        }
        return response.json();
      })
      .then((json: DashboardData) => {
        if (mounted) {
          setData(json);
        }
      })
      .catch((error) => {
        console.error(error);
        if (mounted) {
          setData(null);
        }
      });

    return () => {
      mounted = false;
    };
  }, [dataUrl]);

  return data;
}

export default function Dashboard(): ReactElement {
  const data = useDashboardData();
  const { colorMode } = useColorMode();

  const palette = useMemo(() => {
    const isDark = colorMode === "dark";
    return {
      text: isDark ? "#f3f4f6" : "#1f2933",
      subtleText: isDark ? "#cbd5f5" : "#4b5563",
      axis: isDark ? "rgba(243,244,246,0.6)" : "rgba(31,41,51,0.55)",
      splitLine: isDark ? "rgba(148,163,184,0.25)" : "rgba(203,213,225,0.6)",
      colors: isDark
        ? ["#60a5fa", "#f472b6", "#fbbf24", "#2dd4bf", "#a78bfa"]
        : ["#2563eb", "#f97316", "#0ea5e9", "#059669", "#ec4899"],
    };
  }, [colorMode]);

  const velocityOptions = useMemo(() => {
    if (!data) {
      return undefined;
    }

    return {
      color: palette.colors,
      tooltip: {
        trigger: "axis",
      },
      legend: {
        data: ["コミット", "プルリクエスト", "クローズしたIssue"],
        textStyle: {
          color: palette.text,
        },
        bottom: 10,
      },
      grid: {
        top: 60,
        left: 64,
        right: 32,
        bottom: 90,
        containLabel: true,
      },
      xAxis: {
        type: "category",
        boundaryGap: false,
        data: data.monthlyVelocity.map((item) => item.month),
        axisLabel: {
          color: palette.text,
        },
        axisLine: {
          lineStyle: {
            color: palette.axis,
          },
        },
      },
      yAxis: {
        type: "value",
        axisLabel: {
          color: palette.text,
        },
        axisLine: {
          lineStyle: {
            color: palette.axis,
          },
        },
        splitLine: {
          lineStyle: {
            color: palette.splitLine,
          },
        },
      },
      series: [
        {
          name: "コミット",
          type: "line",
          smooth: true,
          areaStyle: {
            opacity: 0.08,
          },
          data: data.monthlyVelocity.map((item) => item.commits),
        },
        {
          name: "プルリクエスト",
          type: "line",
          smooth: true,
          areaStyle: {
            opacity: 0.08,
          },
          data: data.monthlyVelocity.map((item) => item.pullRequests),
        },
        {
          name: "クローズしたIssue",
          type: "bar",
          barWidth: 28,
          emphasis: {
            focus: "series",
          },
          data: data.monthlyVelocity.map((item) => item.issuesClosed),
        },
      ],
      textStyle: {
        color: palette.text,
      },
    };
  }, [data, palette]);

  const issueTypeOptions = useMemo(() => {
    if (!data) {
      return undefined;
    }

    return {
      color: palette.colors,
      tooltip: {
        trigger: "item",
        formatter: "{b}: {c} ({d}%)",
      },
      legend: {
        orient: "vertical",
        right: 12,
        top: "middle",
        textStyle: {
          color: palette.text,
        },
      },
      series: [
        {
          name: "Issue内訳",
          type: "pie",
          radius: ["45%", "72%"],
          center: ["40%", "50%"],
          avoidLabelOverlap: true,
          itemStyle: {
            borderRadius: 6,
            borderColor: "#fff",
            borderWidth: 2,
          },
          label: {
            show: true,
            color: palette.text,
            formatter: "{b}\n{d}%",
          },
          labelLine: {
            smooth: true,
            length: 18,
            lineStyle: {
              color: palette.axis,
            },
          },
          data: data.issueTypes.map((item) => ({
            name: item.type,
            value: item.count,
          })),
        },
      ],
      textStyle: {
        color: palette.text,
      },
    };
  }, [data, palette]);

  const languageOptions = useMemo(() => {
    if (!data) {
      return undefined;
    }

    return {
      color: palette.colors,
      tooltip: {
        trigger: "item",
        formatter: "{b}: {c}%",
      },
      legend: {
        top: 10,
        textStyle: {
          color: palette.text,
        },
      },
      series: [
        {
          name: "言語構成",
          type: "pie",
          radius: ["15%", "70%"],
          roseType: "radius",
          itemStyle: {
            borderRadius: 6,
            borderColor: "rgba(255,255,255,0.7)",
            borderWidth: 1,
          },
          label: {
            show: true,
            color: palette.text,
            formatter: "{b}\n{c}%",
          },
          labelLine: {
            length: 20,
            length2: 10,
            lineStyle: {
              color: palette.axis,
            },
          },
          data: data.languageBreakdown.map((item) => ({
            name: item.language,
            value: item.percentage,
          })),
        },
      ],
      textStyle: {
        color: palette.text,
      },
    };
  }, [data, palette]);

  const contributorOptions = useMemo(() => {
    if (!data) {
      return undefined;
    }

    return {
      color: [palette.colors[0]],
      tooltip: {
        trigger: "axis",
        axisPointer: {
          type: "shadow",
        },
        textStyle: {
          color: palette.text,
        },
      },
      grid: {
        left: 148,
        right: 48,
        bottom: 56,
        top: 40,
        containLabel: true,
      },
      xAxis: {
        type: "value",
        axisLabel: {
          color: palette.text,
        },
        axisLine: {
          lineStyle: {
            color: palette.axis,
          },
        },
        splitLine: {
          lineStyle: {
            color: palette.splitLine,
          },
        },
      },
      yAxis: {
        type: "category",
        data: data.topContributors.map((item) => item.name).reverse(),
        axisLabel: {
          color: palette.text,
          margin: 18,
        },
        axisLine: {
          lineStyle: {
            color: palette.axis,
          },
        },
      },
      series: [
        {
          name: "コミット数",
          type: "bar",
          data: data.topContributors.map((item) => item.commits).reverse(),
          itemStyle: {
            borderRadius: [0, 8, 8, 0],
          },
          label: {
            show: true,
            position: "right",
            formatter: "{c}",
            color: palette.text,
          },
        },
      ],
      textStyle: {
        color: palette.text,
      },
    };
  }, [data, palette]);

  if (!data) {
    return (
      <div className={styles.loadingState}>
        <span>ダッシュボードデータを読み込み中です…</span>
      </div>
    );
  }

  return (
    <div className={clsx("container", styles.dashboard)}>
      <Heading as="h2" className={styles.sectionTitle}>
        プロジェクトダッシュボード
      </Heading>
      <p className={styles.sectionSubtitle}>
        期間: {data.summary.period} / 合計コミット: {data.summary.totalCommits}{" "}
        / プルリクエスト: {data.summary.totalPullRequests} / Issue:{" "}
        {data.summary.totalIssues}
      </p>

      <div className={styles.summaryGrid}>
        <SummaryCard
          label="合計コミット"
          value={data.summary.totalCommits.toLocaleString()}
        />
        <SummaryCard
          label="クローズ済みIssue"
          value={data.summary.totalIssues.toLocaleString()}
        />
        <SummaryCard
          label="マージ済みPR"
          value={data.summary.totalPullRequests.toLocaleString()}
        />
        <SummaryCard
          label="アクティブコントリビューター"
          value={data.summary.activeContributors.toLocaleString()}
        />
      </div>

      <div className={styles.chartGrid}>
        <div className={styles.chartPanel}>
          <Heading as="h3">開発スループット</Heading>
          <ReactECharts
            option={velocityOptions}
            style={{ height: 360, width: "100%" }}
          />
        </div>
        <div className={styles.chartPanel}>
          <Heading as="h3">Issue内訳</Heading>
          <ReactECharts
            option={issueTypeOptions}
            style={{ height: 360, width: "100%" }}
          />
        </div>
        <div className={styles.chartPanel}>
          <Heading as="h3">主要言語の構成</Heading>
          <ReactECharts
            option={languageOptions}
            style={{ height: 360, width: "100%" }}
          />
        </div>
        <div className={styles.chartPanel}>
          <Heading as="h3">トップコントリビューター</Heading>
          <ReactECharts
            option={contributorOptions}
            style={{ height: 360, width: "100%" }}
          />
        </div>
      </div>
    </div>
  );
}
