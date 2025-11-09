import type { ReactElement } from 'react';
import { useState, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { useColorMode } from '@docusaurus/theme-common';
import type {
  Issue,
  StatisticsData,
  MetricKey,
  PeriodOption,
  DistributionChartType,
  CorrelationChartType,
} from './types';
import {
  METRICS,
  PERIOD_OPTIONS,
  generateTimeSeriesData,
  generateSegmentData,
  formatNumber,
  filterIssuesByPeriod,
  calculateLeadTime,
  calculateCycleTime,
  calculateReviewTime,
  calculateComplexity,
  performMultipleRegression,
  extractMetricValues,
  type MultipleRegressionResult,
} from './utils';
import styles from './styles.module.css';

interface TrendAnalysisProps {
  issues: Issue[];
  statistics: StatisticsData | null;
  palette: {
    text: string;
    axis: string;
    splitLine: string;
    colors: string[];
  };
}

export function TrendAnalysis({ issues, statistics, palette }: TrendAnalysisProps): ReactElement {
  const [metric, setMetric] = useState<MetricKey>('leadTime');
  const [period, setPeriod] = useState<PeriodOption>('30d');

  const chartData = useMemo(() => {
    return generateTimeSeriesData(issues, metric, period);
  }, [issues, metric, period]);

  const chartOption = useMemo(() => {
    return {
      color: palette.colors,
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const data = params[0];
          return `${data.name}<br/>${data.seriesName}: ${formatNumber(data.value)}${METRICS[metric].unit}`;
        },
      },
      grid: {
        left: 80,
        right: 40,
        top: 40,
        bottom: 60,
      },
      xAxis: {
        type: 'category',
        data: chartData.map(d => new Date(d.date).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })),
        axisLabel: { color: palette.text },
        axisLine: { lineStyle: { color: palette.axis } },
      },
      yAxis: {
        type: 'value',
        name: `${METRICS[metric].label} (${METRICS[metric].unit})`,
        axisLabel: { color: palette.text },
        axisLine: { lineStyle: { color: palette.axis } },
        splitLine: { lineStyle: { color: palette.splitLine } },
      },
      series: [
        {
          name: METRICS[metric].label,
          type: 'line',
          data: chartData.map(d => d.value),
          smooth: true,
          areaStyle: { opacity: 0.1 },
        },
      ],
      textStyle: { color: palette.text },
    };
  }, [chartData, metric, palette]);

  const stats = statistics?.descriptive[metric];

  return (
    <div className={styles.analysisTab}>
      <div className={styles.analysisControls}>
        <div className={styles.controlGroup}>
          <label>指標:</label>
          <select value={metric} onChange={e => setMetric(e.target.value as MetricKey)}>
            {Object.values(METRICS).map(m => (
              <option key={m.key} value={m.key}>{m.label}</option>
            ))}
          </select>
        </div>
        <div className={styles.controlGroup}>
          <label>期間:</label>
          <select value={period} onChange={e => setPeriod(e.target.value as PeriodOption)}>
            {Object.entries(PERIOD_OPTIONS).map(([key, opt]) => (
              <option key={key} value={key}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.chartArea}>
        <ReactECharts option={chartOption} style={{ height: 400, width: '100%' }} />
      </div>

      <div className={styles.tableArea}>
        <table className={styles.dataTable}>
          <thead>
            <tr>
              <th>統計値</th>
              <th>値</th>
            </tr>
          </thead>
          <tbody>
            {stats && (
              <>
                <tr><td>平均</td><td>{formatNumber(stats.mean)}{METRICS[metric].unit}</td></tr>
                <tr><td>中央値</td><td>{formatNumber(stats.median)}{METRICS[metric].unit}</td></tr>
                <tr><td>P90</td><td>{formatNumber(stats.p90)}{METRICS[metric].unit}</td></tr>
                <tr><td>標準偏差</td><td>{formatNumber(stats.std_dev)}</td></tr>
              </>
            )}
          </tbody>
        </table>
      </div>

      <div className={styles.insightArea}>
        <h4>📊 分析結果</h4>
        <p>
          {METRICS[metric].label}の直近{PERIOD_OPTIONS[period].label}のトレンドを表示しています。
          {stats && chartData.length > 0 && (
            <> 平均は{formatNumber(stats.mean)}{METRICS[metric].unit}、
            中央値は{formatNumber(stats.median)}{METRICS[metric].unit}です。</>
          )}
        </p>
      </div>
    </div>
  );
}

interface DistributionAnalysisProps {
  issues: Issue[];
  statistics: StatisticsData | null;
  palette: any;
}

export function DistributionAnalysis({ issues, statistics, palette }: DistributionAnalysisProps): ReactElement {
  const [metric, setMetric] = useState<MetricKey>('leadTime');
  const [chartType, setChartType] = useState<DistributionChartType>('histogram');
  const [period, setPeriod] = useState<PeriodOption>('30d');
  const [excludeOutliers, setExcludeOutliers] = useState<boolean>(false);

  const chartData = useMemo(() => {
    const data = generateTimeSeriesData(issues, metric, period);
    let values = data.map(d => d.value);

    // 外れ値を除外する場合
    if (excludeOutliers && statistics?.anomalies) {
      const outlierValues = new Set(
        statistics.anomalies.iqrOutliers
          .filter(outlier => outlier.isOutlier)
          .map(outlier => outlier.value)
      );
      values = values.filter(v => !outlierValues.has(v));
    }

    return values;
  }, [issues, metric, period, excludeOutliers, statistics]);

  const chartOption = useMemo(() => {
    if (chartType === 'histogram') {
      const bins = 10;
      const min = Math.min(...chartData);
      const max = Math.max(...chartData);
      const binWidth = (max - min) / bins;
      const histogram = new Array(bins).fill(0);

      chartData.forEach(v => {
        const binIndex = Math.min(Math.floor((v - min) / binWidth), bins - 1);
        histogram[binIndex]++;
      });

      return {
        color: palette.colors,
        tooltip: { trigger: 'axis' },
        grid: { left: 60, right: 40, top: 40, bottom: 60 },
        xAxis: {
          type: 'category',
          data: histogram.map((_, i) => formatNumber(min + i * binWidth)),
          axisLabel: { color: palette.text },
        },
        yAxis: {
          type: 'value',
          axisLabel: { color: palette.text },
          splitLine: { lineStyle: { color: palette.splitLine } },
        },
        series: [{
          type: 'bar',
          data: histogram,
          itemStyle: { borderRadius: [4, 4, 0, 0] },
        }],
      };
    } else {
      // Boxplot
      const sorted = [...chartData].sort((a, b) => a - b);
      const q1 = sorted[Math.floor(sorted.length * 0.25)];
      const median = sorted[Math.floor(sorted.length * 0.5)];
      const q3 = sorted[Math.floor(sorted.length * 0.75)];
      const min = sorted[0];
      const max = sorted[sorted.length - 1];

      return {
        tooltip: { trigger: 'item' },
        grid: { left: 100, right: 40, top: 40, bottom: 60 },
        xAxis: {
          type: 'value',
          axisLabel: { color: palette.text },
          splitLine: { lineStyle: { color: palette.splitLine } },
        },
        yAxis: {
          type: 'category',
          data: [METRICS[metric].label],
          axisLabel: { color: palette.text },
        },
        series: [{
          type: 'boxplot',
          data: [[min, q1, median, q3, max]],
        }],
      };
    }
  }, [chartData, chartType, metric, palette]);

  return (
    <div className={styles.analysisTab}>
      <div className={styles.analysisControls}>
        <div className={styles.controlGroup}>
          <label>指標:</label>
          <select value={metric} onChange={e => setMetric(e.target.value as MetricKey)}>
            {Object.values(METRICS).map(m => (
              <option key={m.key} value={m.key}>{m.label}</option>
            ))}
          </select>
        </div>
        <div className={styles.controlGroup}>
          <label>グラフ種類:</label>
          <select value={chartType} onChange={e => setChartType(e.target.value as DistributionChartType)}>
            <option value="histogram">ヒストグラム</option>
            <option value="boxplot">箱ひげ図</option>
          </select>
        </div>
        <div className={styles.controlGroup}>
          <label>期間:</label>
          <select value={period} onChange={e => setPeriod(e.target.value as PeriodOption)}>
            {Object.entries(PERIOD_OPTIONS).map(([key, opt]) => (
              <option key={key} value={key}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div className={styles.controlGroup}>
          <label>
            <input
              type="checkbox"
              checked={excludeOutliers}
              onChange={e => setExcludeOutliers(e.target.checked)}
              style={{ marginRight: '0.5rem' }}
            />
            外れ値を除外
          </label>
        </div>
      </div>

      <div className={styles.chartArea}>
        <ReactECharts option={chartOption} style={{ height: 400, width: '100%' }} />
      </div>

      <div className={styles.insightArea}>
        <h4>📊 分析結果</h4>
        <p>
          {METRICS[metric].label}の分布を{chartType === 'histogram' ? 'ヒストグラム' : '箱ひげ図'}で表示しています。
          {excludeOutliers && ' (外れ値を除外して表示)'}
          {!excludeOutliers && ' データの偏りや外れ値の有無を確認できます。'}
          {excludeOutliers && statistics?.anomalies &&
            ` IQR法により${statistics.anomalies.iqrOutliers.filter(o => o.isOutlier).length}件の外れ値を除外しています。`}
        </p>
      </div>
    </div>
  );
}

interface CorrelationAnalysisProps {
  issues: Issue[];
  statistics: StatisticsData | null;
  palette: any;
}

export function CorrelationAnalysis({ issues, statistics, palette }: CorrelationAnalysisProps): ReactElement {
  const [chartType, setChartType] = useState<CorrelationChartType>('heatmap');
  const [xAxisMetric, setXAxisMetric] = useState<MetricKey>('leadTime');
  const [yAxisMetric, setYAxisMetric] = useState<MetricKey>('cycleTime');

  const correlationMatrix = useMemo(() => {
    if (!statistics) return [];

    const metrics: MetricKey[] = ['leadTime', 'cycleTime', 'reviewTime', 'complexity', 'comments', 'assignees'];
    const matrix: number[][] = [];

    metrics.forEach(m1 => {
      const row: number[] = [];
      metrics.forEach(m2 => {
        if (m1 === m2) {
          row.push(1);
        } else {
          const factor = statistics.correlations.topFactors[m1]?.find(f => f.factor === m2);
          row.push(factor?.correlation || 0);
        }
      });
      matrix.push(row);
    });

    return matrix;
  }, [statistics]);

  // 散布図用データ
  const scatterData = useMemo(() => {
    const xData: number[] = [];
    const yData: number[] = [];

    issues.forEach(issue => {
      let xValue: number | null = null;
      let yValue: number | null = null;

      // X軸データ取得
      switch (xAxisMetric) {
        case 'leadTime':
          xValue = calculateLeadTime(issue);
          break;
        case 'cycleTime':
          xValue = calculateCycleTime(issue);
          break;
        case 'reviewTime':
          xValue = calculateReviewTime(issue);
          break;
        case 'complexity':
          xValue = calculateComplexity(issue);
          break;
        case 'comments':
          xValue = issue.comments;
          break;
        case 'assignees':
          xValue = issue.assignees.length;
          break;
      }

      // Y軸データ取得
      switch (yAxisMetric) {
        case 'leadTime':
          yValue = calculateLeadTime(issue);
          break;
        case 'cycleTime':
          yValue = calculateCycleTime(issue);
          break;
        case 'reviewTime':
          yValue = calculateReviewTime(issue);
          break;
        case 'complexity':
          yValue = calculateComplexity(issue);
          break;
        case 'comments':
          yValue = issue.comments;
          break;
        case 'assignees':
          yValue = issue.assignees.length;
          break;
      }

      if (xValue !== null && yValue !== null) {
        xData.push(xValue);
        yData.push(yValue);
      }
    });

    // 回帰線計算
    const n = xData.length;
    if (n === 0) return { scatter: [], regression: [] };

    const sumX = xData.reduce((a, b) => a + b, 0);
    const sumY = yData.reduce((a, b) => a + b, 0);
    const sumXY = xData.reduce((sum, x, i) => sum + x * yData[i], 0);
    const sumX2 = xData.reduce((sum, x) => sum + x * x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    const minX = Math.min(...xData);
    const maxX = Math.max(...xData);

    return {
      scatter: xData.map((x, i) => [x, yData[i]]),
      regression: [
        [minX, slope * minX + intercept],
        [maxX, slope * maxX + intercept],
      ],
    };
  }, [issues, xAxisMetric, yAxisMetric]);

  const chartOption = useMemo(() => {
    if (chartType === 'scatter') {
      return {
        color: palette.colors,
        tooltip: {
          trigger: 'item',
          formatter: (params: any) => {
            if (params.seriesName === '回帰線') return '';
            return `${METRICS[xAxisMetric].label}: ${params.value[0].toFixed(2)}<br/>` +
                   `${METRICS[yAxisMetric].label}: ${params.value[1].toFixed(2)}`;
          },
        },
        visualMap: null, // ヒートマップのvisualMapを削除
        grid: { left: 80, right: 40, top: 40, bottom: 60 },
        xAxis: {
          type: 'value',
          name: METRICS[xAxisMetric].label,
          axisLabel: { color: palette.text },
          splitLine: { lineStyle: { color: palette.splitLine } },
        },
        yAxis: {
          type: 'value',
          name: METRICS[yAxisMetric].label,
          axisLabel: { color: palette.text },
          splitLine: { lineStyle: { color: palette.splitLine } },
        },
        series: [
          {
            name: 'データポイント',
            type: 'scatter',
            data: scatterData.scatter,
            symbolSize: 8,
          },
          {
            name: '回帰線',
            type: 'line',
            data: scatterData.regression,
            lineStyle: { color: palette.colors[1], width: 2 },
            symbol: 'none',
            smooth: false,
          },
        ],
      };
    } else {
      // ヒートマップ
      const metrics = ['leadTime', 'cycleTime', 'reviewTime', 'complexity', 'comments', 'assignees'];
      const labels = metrics.map(m => METRICS[m as MetricKey].label);

      const data: any[] = [];
      correlationMatrix.forEach((row, i) => {
        row.forEach((val, j) => {
          data.push([j, i, val.toFixed(2)]);
        });
      });

      return {
        tooltip: {
          position: 'top',
          formatter: (params: any) => {
            return `${labels[params.data[0]]} × ${labels[params.data[1]]}<br/>相関係数: ${params.data[2]}`;
          },
        },
        grid: { left: 100, top: 80, right: 40, bottom: 60 },
        xAxis: {
          type: 'category',
          data: labels,
          axisLabel: { color: palette.text, rotate: 45 },
        },
        yAxis: {
          type: 'category',
          data: labels,
          axisLabel: { color: palette.text },
        },
        visualMap: {
          min: -1,
          max: 1,
          calculable: true,
          orient: 'horizontal',
          left: 'center',
          top: 10,
          textStyle: { color: palette.text },
        },
        series: [{
          type: 'heatmap',
          data,
          label: { show: true, color: palette.text },
        }],
      };
    }
  }, [chartType, correlationMatrix, scatterData, xAxisMetric, yAxisMetric, palette]);

  return (
    <div className={styles.analysisTab}>
      <div className={styles.analysisControls}>
        <div className={styles.controlGroup}>
          <label>グラフ種類:</label>
          <select value={chartType} onChange={e => setChartType(e.target.value as CorrelationChartType)}>
            <option value="heatmap">ヒートマップ</option>
            <option value="scatter">散布図</option>
          </select>
        </div>
        {chartType === 'scatter' && (
          <>
            <div className={styles.controlGroup}>
              <label>横軸:</label>
              <select value={xAxisMetric} onChange={e => setXAxisMetric(e.target.value as MetricKey)}>
                {Object.values(METRICS).map(m => (
                  <option key={m.key} value={m.key}>{m.label}</option>
                ))}
              </select>
            </div>
            <div className={styles.controlGroup}>
              <label>縦軸:</label>
              <select value={yAxisMetric} onChange={e => setYAxisMetric(e.target.value as MetricKey)}>
                {Object.values(METRICS).map(m => (
                  <option key={m.key} value={m.key}>{m.label}</option>
                ))}
              </select>
            </div>
          </>
        )}
      </div>

      <div className={styles.chartArea}>
        <ReactECharts
          option={chartOption}
          notMerge={true}
          style={{ height: 500, width: '100%' }}
        />
      </div>

      <div className={styles.tableArea}>
        <table className={styles.dataTable}>
          <thead>
            <tr>
              <th>指標1</th>
              <th>指標2</th>
              <th>相関係数</th>
              <th>強度</th>
            </tr>
          </thead>
          <tbody>
            {statistics && Object.entries(statistics.correlations.topFactors).map(([metric, factors]) =>
              factors.slice(0, 3).map((factor, i) => (
                <tr key={`${metric}-${i}`}>
                  <td>{METRICS[metric as MetricKey].label}</td>
                  <td>{METRICS[factor.factor as MetricKey].label}</td>
                  <td>{factor.correlation.toFixed(3)}</td>
                  <td>{factor.strength}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className={styles.insightArea}>
        <h4>📊 分析結果</h4>
        {chartType === 'heatmap' ? (
          <p>
            指標間の相関関係をヒートマップで表示しています。
            色が濃いほど相関が強いことを示します。
          </p>
        ) : (
          <p>
            {METRICS[xAxisMetric].label}と{METRICS[yAxisMetric].label}の関係を散布図で表示しています。
            赤い線は回帰線（最小二乗法）を示します。
          </p>
        )}
      </div>
    </div>
  );
}

interface SegmentAnalysisProps {
  issues: Issue[];
  palette: any;
}

export function SegmentAnalysis({ issues, palette }: SegmentAnalysisProps): ReactElement {
  const [metric, setMetric] = useState<MetricKey>('leadTime');
  const [segmentType, setSegmentType] = useState<'label' | 'assignee'>('label');

  const segmentData = useMemo(() => {
    return generateSegmentData(issues, metric, segmentType);
  }, [issues, metric, segmentType]);

  const chartOption = useMemo(() => {
    return {
      color: palette.colors,
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: 150, right: 40, top: 40, bottom: 60 },
      xAxis: {
        type: 'value',
        axisLabel: { color: palette.text },
        splitLine: { lineStyle: { color: palette.splitLine } },
      },
      yAxis: {
        type: 'category',
        data: segmentData.map(d => d.segment).reverse(),
        axisLabel: { color: palette.text },
      },
      series: [{
        name: '平均値',
        type: 'bar',
        data: segmentData.map(d => d.mean).reverse(),
        itemStyle: { borderRadius: [0, 4, 4, 0] },
      }],
    };
  }, [segmentData, palette]);

  return (
    <div className={styles.analysisTab}>
      <div className={styles.analysisControls}>
        <div className={styles.controlGroup}>
          <label>指標:</label>
          <select value={metric} onChange={e => setMetric(e.target.value as MetricKey)}>
            {Object.values(METRICS).map(m => (
              <option key={m.key} value={m.key}>{m.label}</option>
            ))}
          </select>
        </div>
        <div className={styles.controlGroup}>
          <label>セグメント:</label>
          <select value={segmentType} onChange={e => setSegmentType(e.target.value as 'label' | 'assignee')}>
            <option value="label">ラベル</option>
            <option value="assignee">担当者</option>
          </select>
        </div>
      </div>

      <div className={styles.chartArea}>
        <ReactECharts option={chartOption} style={{ height: 400, width: '100%' }} />
      </div>

      <div className={styles.tableArea}>
        <table className={styles.dataTable}>
          <thead>
            <tr>
              <th>{segmentType === 'label' ? 'ラベル' : '担当者'}</th>
              <th>件数</th>
              <th>平均</th>
              <th>中央値</th>
              <th>P90</th>
            </tr>
          </thead>
          <tbody>
            {segmentData.map(d => (
              <tr key={d.segment}>
                <td>{d.segment}</td>
                <td>{d.count}</td>
                <td>{formatNumber(d.mean)}{METRICS[metric].unit}</td>
                <td>{formatNumber(d.median)}{METRICS[metric].unit}</td>
                <td>{formatNumber(d.p90)}{METRICS[metric].unit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={styles.insightArea}>
        <h4>📊 分析結果</h4>
        <p>
          {segmentType === 'label' ? 'ラベル' : '担当者'}別の{METRICS[metric].label}を表示しています。
          セグメント間の差異を確認できます。
        </p>
      </div>
    </div>
  );
}

interface RegressionAnalysisProps {
  issues: Issue[];
  statistics: StatisticsData | null;
  palette: any;
}

export function RegressionAnalysis({ issues, statistics, palette }: RegressionAnalysisProps): ReactElement {
  const [targetMetric, setTargetMetric] = useState<MetricKey>('leadTime');

  // 説明変数（目的変数以外の全指標、ただしreviewTimeは除外）
  const explanatoryMetrics = useMemo(() => {
    // reviewTimeはPR特有の指標なので重回帰分析からは除外
    const allMetrics: MetricKey[] = ['leadTime', 'cycleTime', 'complexity', 'comments', 'assignees'];

    // 多重共線性を回避するため、強い相関がある変数ペアを除外
    // leadTimeとcycleTimeは強い相関があるため、一方が目的変数の場合は他方を除外
    const excludedMetrics = [targetMetric];
    if (targetMetric === 'leadTime') {
      excludedMetrics.push('cycleTime'); // leadTimeが目的変数の場合、cycleTimeを除外
    } else if (targetMetric === 'cycleTime') {
      excludedMetrics.push('leadTime'); // cycleTimeが目的変数の場合、leadTimeを除外
    }

    return allMetrics.filter(m => !excludedMetrics.includes(m));
  }, [targetMetric]);

  // データ診断情報
  const dataDiagnostics = useMemo(() => {
    // 完了済みissue（closed_atがあるissue）をカウント
    const closedIssues = issues.filter(issue => issue.closed_at !== null);
    const openIssues = issues.filter(issue => issue.closed_at === null);

    const { data } = extractMetricValues(issues);
    const requiredSamples = explanatoryMetrics.length + 2;

    return {
      totalIssues: issues.length,
      openIssues: openIssues.length,
      closedIssues: closedIssues.length,
      validSamples: data.length,
      requiredSamples,
    };
  }, [issues, explanatoryMetrics]);

  // 重回帰分析を実行
  const regressionResult = useMemo(() => {
    const result = performMultipleRegression(issues, targetMetric, explanatoryMetrics);
    if (!result) {
      console.log('重回帰分析が実行できませんでした', {
        targetMetric,
        explanatoryMetrics,
        validSamples: dataDiagnostics.validSamples,
      });
    }
    return result;
  }, [issues, targetMetric, explanatoryMetrics, dataDiagnostics]);

  // 係数棒グラフのオプション
  const coefficientChartOption = useMemo(() => {
    if (!regressionResult) return null;

    // 切片以外の係数を取得
    const coeffs = regressionResult.coefficients.filter(c => c.variable !== 'intercept');

    return {
      color: palette.colors,
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
      },
      grid: { left: 120, right: 40, top: 40, bottom: 60 },
      xAxis: {
        type: 'value',
        name: '回帰係数',
        axisLabel: { color: palette.text },
        splitLine: { lineStyle: { color: palette.splitLine } },
      },
      yAxis: {
        type: 'category',
        data: coeffs.map(c => METRICS[c.variable as MetricKey].label),
        axisLabel: { color: palette.text },
      },
      series: [
        {
          type: 'bar',
          data: coeffs.map(c => ({
            value: c.coefficient,
            itemStyle: {
              color: c.coefficient > 0 ? palette.colors[0] : palette.colors[1],
            },
          })),
          label: {
            show: true,
            position: 'right',
            formatter: (params: any) => params.value.toFixed(4),
            color: palette.text,
          },
        },
      ],
    };
  }, [regressionResult, palette]);

  // 寄与率チャート（標準化係数）のオプション
  const contributionChartOption = useMemo(() => {
    if (!regressionResult) return null;

    // 切片以外の係数を取得
    const coeffs = regressionResult.coefficients.filter(c => c.variable !== 'intercept');

    // 絶対値の合計で正規化して寄与率を計算
    const total = coeffs.reduce((sum, c) => sum + Math.abs(c.coefficient), 0);
    const contributions = coeffs.map(c => ({
      variable: c.variable,
      value: total > 0 ? (Math.abs(c.coefficient) / total) * 100 : 0,
    }));

    return {
      color: palette.colors,
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => `${params.name}: ${params.value.toFixed(2)}%`,
      },
      series: [
        {
          type: 'pie',
          radius: ['40%', '70%'],
          label: {
            color: palette.text,
            formatter: (params: any) => `${params.name}\n${params.value.toFixed(1)}%`,
          },
          data: contributions.map(c => ({
            name: METRICS[c.variable as MetricKey].label,
            value: c.value,
          })),
        },
      ],
    };
  }, [regressionResult, palette]);

  return (
    <div className={styles.analysisTab}>
      <div className={styles.analysisControls}>
        <div className={styles.controlGroup}>
          <label>目的変数:</label>
          <select value={targetMetric} onChange={e => setTargetMetric(e.target.value as MetricKey)}>
            {Object.values(METRICS)
              .filter(m => m.key !== 'reviewTime') // reviewTimeは除外
              .map(m => (
                <option key={m.key} value={m.key}>{m.label}</option>
              ))}
          </select>
        </div>
      </div>

      {!regressionResult ? (
        <div className={styles.insightArea}>
          {dataDiagnostics.validSamples >= dataDiagnostics.requiredSamples ? (
            <>
              <h4>⚠️ 多重共線性エラー</h4>
              <p>重回帰分析の計算に失敗しました。これは通常、説明変数間に強い相関がある場合に発生します。</p>

              <h5 style={{ marginTop: '1rem' }}>問題の可能性</h5>
              <p>
                目的変数「{METRICS[targetMetric].label}」と説明変数「{explanatoryMetrics.map(m => METRICS[m].label).join('、')}」の間に
                <strong>多重共線性</strong>（強い相関関係）が存在する可能性があります。
              </p>
              <p>
                <strong>注:</strong> リードタイムとサイクルタイムは多重共線性を回避するため、
                一方が目的変数の場合は他方を自動的に説明変数から除外しています。
              </p>

              <h5 style={{ marginTop: '1rem' }}>データ状況</h5>
              <ul>
                <li><strong>分析に使用可能:</strong> {dataDiagnostics.validSamples}件</li>
                <li><strong>必要なサンプル数:</strong> {dataDiagnostics.requiredSamples}件以上 ✓</li>
              </ul>

              <p style={{ marginTop: '1rem' }}>
                <strong>対処方法:</strong> 別の指標を目的変数として選択してください。
                コンソール（F12キー）で詳細なエラー情報を確認できます。
              </p>
            </>
          ) : (
            <>
              <h4>⚠️ データ不足</h4>
              <p>重回帰分析を実行するには、完了済みのissue/PRが不足しています。</p>

              <h5 style={{ marginTop: '1rem' }}>データ状況</h5>
              <ul>
                <li><strong>総Issue/PR数:</strong> {dataDiagnostics.totalIssues}件</li>
                <li><strong>　├ 完了済み:</strong> {dataDiagnostics.closedIssues}件</li>
                <li><strong>　└ 未完了（分析対象外）:</strong> {dataDiagnostics.openIssues}件</li>
              </ul>

              <h5 style={{ marginTop: '1rem' }}>分析可能性</h5>
              <ul>
                <li><strong>分析に使用可能:</strong> {dataDiagnostics.validSamples}件</li>
                <li><strong>必要なサンプル数:</strong> {dataDiagnostics.requiredSamples}件以上</li>
                <li><strong>不足:</strong> {Math.max(0, dataDiagnostics.requiredSamples - dataDiagnostics.validSamples)}件</li>
              </ul>

              <p style={{ marginTop: '1rem' }}>
                <strong>注意:</strong> 重回帰分析では、リードタイムとサイクルタイムが計算可能なissue/PRのみを使用します。
                これらの指標は完了済み（closed_at が設定されている）issue/PRでのみ計算できます。
              </p>
              <p>
                <strong>使用される説明変数:</strong> {explanatoryMetrics.map(m => METRICS[m].label).join('、')}
              </p>
              <p>
                <small>
                  注: レビュー時間はPR特有の指標のため除外されています。
                  また、リードタイムとサイクルタイムは多重共線性を避けるため、
                  一方が目的変数の場合は他方を説明変数から除外しています。
                </small>
              </p>
            </>
          )}
        </div>
      ) : (
        <>
          {/* 説明変数が少ない場合の警告 */}
          {regressionResult.usedExplanatoryMetrics.length === 1 && (
            <div className={styles.insightArea} style={{ marginBottom: '1rem', background: 'rgba(251, 146, 60, 0.1)', border: '1px solid rgba(251, 146, 60, 0.3)' }}>
              <h4>⚠️ 説明変数不足</h4>
              <p>
                現在、使用可能な説明変数は「{METRICS[regressionResult.usedExplanatoryMetrics[0]].label}」のみです。
                これは重回帰分析ではなく<strong>単回帰分析</strong>になります。
              </p>
              <p>
                <small>
                  他の変数（コメント数、担当者数）は分散が0のため除外されました。
                  より正確な分析を行うには、データの多様性が必要です。
                </small>
              </p>
            </div>
          )}

          {/* 回帰係数と寄与率のグラフを横並びに */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
            {/* 回帰係数の棒グラフ */}
            {coefficientChartOption && (
              <div className={styles.chartArea}>
                <h4 style={{ marginBottom: '1rem' }}>回帰係数</h4>
                <ReactECharts option={coefficientChartOption} style={{ height: 300, width: '100%' }} />
              </div>
            )}

            {/* 寄与率チャート */}
            {contributionChartOption && (
              <div className={styles.chartArea}>
                <h4 style={{ marginBottom: '1rem' }}>寄与率</h4>
                <ReactECharts option={contributionChartOption} style={{ height: 300, width: '100%' }} />
              </div>
            )}
          </div>

          {/* 係数表 */}
          <div className={styles.tableArea}>
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th>変数</th>
                  <th>係数</th>
                  <th>標準誤差</th>
                  <th>t値</th>
                  <th>p値</th>
                  <th>有意性</th>
                </tr>
              </thead>
              <tbody>
                {regressionResult.coefficients.map((coef, idx) => (
                  <tr key={idx}>
                    <td>{coef.variable === 'intercept' ? '切片' : METRICS[coef.variable as MetricKey].label}</td>
                    <td>{coef.coefficient.toFixed(4)}</td>
                    <td>{coef.standardError.toFixed(4)}</td>
                    <td>{coef.tValue.toFixed(3)}</td>
                    <td>{coef.pValue < 0.001 ? '< 0.001' : coef.pValue.toFixed(4)}</td>
                    <td>
                      {coef.pValue < 0.001 && '***'}
                      {coef.pValue >= 0.001 && coef.pValue < 0.01 && '**'}
                      {coef.pValue >= 0.01 && coef.pValue < 0.05 && '*'}
                      {coef.pValue >= 0.05 && ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={styles.insightArea}>
            <h4>📈 分析結果</h4>
            <p>
              {METRICS[targetMetric].label}を目的変数とした重回帰分析の結果です。
            </p>
            <p>
              <strong>サンプル数:</strong> {dataDiagnostics.validSamples}件（完了済みのissue/PR）
            </p>
            <p>
              <strong>決定係数 (R²):</strong> {regressionResult.rSquared.toFixed(4)}
              {' / '}
              <strong>調整済みR²:</strong> {regressionResult.adjustedRSquared.toFixed(4)}
            </p>
            <p>
              <strong>F統計量:</strong> {regressionResult.fStatistic.toFixed(3)}
              {' / '}
              <strong>p値:</strong> {regressionResult.fPValue < 0.001 ? '< 0.001' : regressionResult.fPValue.toFixed(4)}
            </p>
            <p>
              <small>
                有意性: *** p {'<'} 0.001, ** p {'<'} 0.01, * p {'<'} 0.05
              </small>
            </p>
            <p>
              <strong>使用した説明変数:</strong> {regressionResult.usedExplanatoryMetrics.map(m => METRICS[m].label).join('、')}
            </p>
            {regressionResult.usedExplanatoryMetrics.length < explanatoryMetrics.length && (
              <p>
                <small>
                  注: 以下の変数は分散が0または極めて小さいため自動的に除外されました：
                  {explanatoryMetrics
                    .filter(m => !regressionResult.usedExplanatoryMetrics.includes(m))
                    .map(m => METRICS[m].label)
                    .join('、')}
                </small>
              </p>
            )}
            <p>
              <small>
                レビュー時間はPR特有の指標のため除外されています。
                また、リードタイムとサイクルタイムは多重共線性を避けるため、
                一方が目的変数の場合は他方を説明変数から除外しています。
              </small>
            </p>
          </div>
        </>
      )}
    </div>
  );
}
