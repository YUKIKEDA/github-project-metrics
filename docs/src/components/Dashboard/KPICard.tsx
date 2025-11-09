import type { ReactElement } from 'react';
import clsx from 'clsx';
import type { KPIData, MetricInfo } from './types';
import { METRICS, formatNumber, formatPercent } from './utils';
import styles from './styles.module.css';

interface KPICardProps {
  data: KPIData;
}

export function KPICard({ data }: KPICardProps): ReactElement {
  const metricInfo: MetricInfo = METRICS[data.metric];
  const isIncreased = data.change > 0;
  const isDecreased = data.change < 0;

  // 増加が良いか悪いかを判断
  const isGoodChange =
    metricInfo.interpretation === 'lower_better'
      ? isDecreased
      : metricInfo.interpretation === 'higher_better'
      ? isIncreased
      : null;

  const hasAnomalies = data.anomalies.length > 0;
  const criticalAnomalies = data.anomalies.filter(a => a.severity === 'critical');

  return (
    <div className={styles.kpiCard}>
      <div className={styles.kpiHeader}>
        <h3 className={styles.kpiTitle}>{metricInfo.label}</h3>
        {hasAnomalies && (
          <span
            className={clsx(
              styles.anomalyBadge,
              criticalAnomalies.length > 0 && styles.anomalyBadgeCritical
            )}
            title={data.anomalies.map(a => a.message).join('\n')}
          >
            ⚠
          </span>
        )}
      </div>

      <div className={styles.kpiMainContent}>
        <div className={styles.kpiLeft}>
          <div className={styles.kpiValue}>
            {formatNumber(data.currentValue)}
            <span className={styles.kpiUnit}>{metricInfo.unit}</span>
          </div>
        </div>

        <div className={styles.kpiCenter}>
          <div
            className={clsx(
              styles.kpiChange,
              isGoodChange === true && styles.kpiChangeGood,
              isGoodChange === false && styles.kpiChangeBad
            )}
          >
            {isIncreased && <span className={styles.kpiChangeIcon}>↑</span>}
            {isDecreased && <span className={styles.kpiChangeIcon}>↓</span>}
            <span className={styles.kpiChangeValue}>
              {Math.abs(data.change).toFixed(1)}{metricInfo.unit}
            </span>
            <span className={styles.kpiChangePercent}>
              ({formatPercent(data.changePercent)})
            </span>
          </div>
          <div className={styles.kpiPeriod}>vs {data.previousPeriod}</div>
        </div>

        <div className={styles.kpiRight}>
          <div className={styles.kpiPeriodCurrent}>{data.currentPeriod}</div>
        </div>
      </div>

      {data.stats && (
        <div className={styles.kpiStats}>
          <div className={styles.kpiStatRow}>
            <span className={styles.kpiStatLabel}>件数:</span>
            <span className={styles.kpiStatValue}>{data.stats.count}</span>
          </div>
          <div className={styles.kpiStatRow}>
            <span className={styles.kpiStatLabel}>平均:</span>
            <span className={styles.kpiStatValue}>{formatNumber(data.stats.mean)}</span>
          </div>
          <div className={styles.kpiStatRow}>
            <span className={styles.kpiStatLabel}>中央:</span>
            <span className={styles.kpiStatValue}>{formatNumber(data.stats.median)}</span>
          </div>
          <div className={styles.kpiStatRow}>
            <span className={styles.kpiStatLabel}>最頻:</span>
            <span className={styles.kpiStatValue}>{formatNumber(data.stats.mode)}</span>
          </div>
          <div className={styles.kpiStatRow}>
            <span className={styles.kpiStatLabel}>標準偏差:</span>
            <span className={styles.kpiStatValue}>{formatNumber(data.stats.std_dev)}</span>
          </div>
          <div className={styles.kpiStatRow}>
            <span className={styles.kpiStatLabel}>分散:</span>
            <span className={styles.kpiStatValue}>{formatNumber(data.stats.variance)}</span>
          </div>
          <div className={styles.kpiStatRow}>
            <span className={styles.kpiStatLabel}>最小:</span>
            <span className={styles.kpiStatValue}>{formatNumber(data.stats.min)}</span>
          </div>
          <div className={styles.kpiStatRow}>
            <span className={styles.kpiStatLabel}>Q1:</span>
            <span className={styles.kpiStatValue}>{formatNumber(data.stats.q1)}</span>
          </div>
          <div className={styles.kpiStatRow}>
            <span className={styles.kpiStatLabel}>Q3:</span>
            <span className={styles.kpiStatValue}>{formatNumber(data.stats.q3)}</span>
          </div>
          <div className={styles.kpiStatRow}>
            <span className={styles.kpiStatLabel}>最大:</span>
            <span className={styles.kpiStatValue}>{formatNumber(data.stats.max)}</span>
          </div>
          <div className={styles.kpiStatRow}>
            <span className={styles.kpiStatLabel}>P90:</span>
            <span className={styles.kpiStatValue}>{formatNumber(data.stats.p90)}</span>
          </div>
          <div className={styles.kpiStatRow}>
            <span className={styles.kpiStatLabel}>P95:</span>
            <span className={styles.kpiStatValue}>{formatNumber(data.stats.p95)}</span>
          </div>
          <div className={styles.kpiStatRow}>
            <span className={styles.kpiStatLabel}>IQR:</span>
            <span className={styles.kpiStatValue}>{formatNumber(data.stats.iqr)}</span>
          </div>
          <div className={styles.kpiStatRow}>
            <span className={styles.kpiStatLabel}>CV:</span>
            <span className={styles.kpiStatValue}>{formatNumber(data.stats.cv)}</span>
          </div>
          <div className={styles.kpiStatRow}>
            <span className={styles.kpiStatLabel}>歪度:</span>
            <span className={styles.kpiStatValue}>{formatNumber(data.stats.skewness)}</span>
          </div>
          <div className={styles.kpiStatRow}>
            <span className={styles.kpiStatLabel}>尖度:</span>
            <span className={styles.kpiStatValue}>{formatNumber(data.stats.kurtosis)}</span>
          </div>
        </div>
      )}

      {hasAnomalies && (
        <div className={styles.kpiAnomalies}>
          {data.anomalies.map((anomaly, index) => (
            <div
              key={index}
              className={clsx(
                styles.kpiAnomaly,
                anomaly.severity === 'critical' && styles.kpiAnomalyCritical,
                anomaly.severity === 'high' && styles.kpiAnomalyHigh,
                anomaly.severity === 'medium' && styles.kpiAnomalyMedium
              )}
            >
              {anomaly.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface ThroughputCardProps {
  value: number;
  previousValue: number;
  currentPeriod: string;
  previousPeriod: string;
}

export function ThroughputCard({
  value,
  previousValue,
  currentPeriod,
  previousPeriod,
}: ThroughputCardProps): ReactElement {
  const change = value - previousValue;
  const changePercent = previousValue !== 0 ? (change / previousValue) * 100 : 0;
  const isIncreased = change > 0;
  const isDecreased = change < 0;

  return (
    <div className={styles.kpiCard}>
      <div className={styles.kpiHeader}>
        <h3 className={styles.kpiTitle}>スループット</h3>
        <span className={styles.kpiSubtitle}>（直近2週間のクローズ件数）</span>
      </div>

      <div className={styles.kpiMainContent}>
        <div className={styles.kpiLeft}>
          <div className={styles.kpiValue}>
            {value}
            <span className={styles.kpiUnit}>件</span>
          </div>
        </div>

        <div className={styles.kpiCenter}>
          <div
            className={clsx(
              styles.kpiChange,
              isIncreased && styles.kpiChangeGood,
              isDecreased && styles.kpiChangeBad
            )}
          >
            {isIncreased && <span className={styles.kpiChangeIcon}>↑</span>}
            {isDecreased && <span className={styles.kpiChangeIcon}>↓</span>}
            <span className={styles.kpiChangeValue}>{Math.abs(change)}件</span>
            <span className={styles.kpiChangePercent}>
              ({formatPercent(changePercent)})
            </span>
          </div>
          <div className={styles.kpiPeriod}>vs {previousPeriod}</div>
        </div>

        <div className={styles.kpiRight}>
          <div className={styles.kpiPeriodCurrent}>{currentPeriod}</div>
        </div>
      </div>

      <div className={styles.kpiStats}>
        <div className={styles.kpiStatRow}>
          <span className={styles.kpiStatLabel}>2期間平均:</span>
          <span className={styles.kpiStatValue}>
            {formatNumber((value + previousValue) / 2)}件
          </span>
        </div>
      </div>
    </div>
  );
}
