//@ts-check
/// <reference path="./types.d.ts" />
import * as core from "@actions/core";

/**
 * 開発生産性の統計分析処理
 * 
 * Issueのメトリクスデータから統計的な分析を行う
 */

/**
 * パーセンタイルを計算（線形補間法）
 * @param {number[]} sortedValues - ソート済み配列
 * @param {number} percentile - パーセンタイル (0-1の間。例: 0.5は中央値、0.9は90パーセンタイル)
 * @returns {number} パーセンタイル値
 */
function calculatePercentile(sortedValues, percentile) {
  const n = sortedValues.length;
  if (n === 0) return 0;
  if (n === 1) return sortedValues[0];
  
  const index = percentile * (n - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;
  
  if (lower === upper) {
    return sortedValues[lower];
  }
  
  return sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight;
}

/**
 * 最頻値を計算
 * @param {number[]} values - 数値配列
 * @returns {number} 最頻値（最も頻繁に出現する値）
 */
function calculateMode(values) {
  const frequency = {};
  let maxFreq = 0;
  let mode = values[0];
  
  values.forEach(val => {
    frequency[val] = (frequency[val] || 0) + 1;
    if (frequency[val] > maxFreq) {
      maxFreq = frequency[val];
      mode = val;
    }
  });
  
  return mode;
}

/**
 * 歪度を計算（サンプル歪度）
 * @param {number[]} values - 数値配列
 * @param {number} mean - 平均値
 * @param {number} stdDev - 標準偏差
 * @param {number} n - サンプルサイズ
 * @returns {number} 歪度（正: 右に長い裾、負: 左に長い裾、0: 対称）
 */
function calculateSkewness(values, mean, stdDev, n) {
  if (stdDev === 0 || n < 3) return 0;
  
  const m3 = values.reduce((sum, val) => 
    sum + Math.pow((val - mean) / stdDev, 3), 0
  );
  
  // サンプル歪度の補正
  return (n / ((n - 1) * (n - 2))) * m3;
}

/**
 * 尖度を計算（超過尖度）
 * @param {number[]} values - 数値配列
 * @param {number} mean - 平均値
 * @param {number} stdDev - 標準偏差
 * @param {number} n - サンプルサイズ
 * @returns {number} 超過尖度（正: 尖った分布、負: 平坦な分布、0: 正規分布）
 */
function calculateKurtosis(values, mean, stdDev, n) {
  if (stdDev === 0 || n < 4) return 0;
  
  const m4 = values.reduce((sum, val) => 
    sum + Math.pow((val - mean) / stdDev, 4), 0
  );
  
  // サンプル尖度の補正（超過尖度 = 尖度 - 3）
  return ((n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3))) * m4 - 
         (3 * Math.pow(n - 1, 2)) / ((n - 2) * (n - 3));
}

/**
 * 記述統計量を計算
 * @param {number[]} values - 数値配列
 * @returns {DescriptiveStatsResult|null} 統計量
 */
function calculateStats(values) {
  if (!values || values.length === 0) {
    return null;
  }
  
  const sorted = [...values].sort((a, b) => a - b);
  const n = values.length;
  
  // 平均値
  const mean = values.reduce((sum, val) => sum + val, 0) / n;
  
  // 分散と標準偏差
  const variance = values.reduce((sum, val) => 
    sum + Math.pow(val - mean, 2), 0
  ) / n;
  const stdDev = Math.sqrt(variance);
  
  // 中央値（線形補間）
  const median = calculatePercentile(sorted, 0.5);
  
  // 四分位点
  const q1 = calculatePercentile(sorted, 0.25);
  const q3 = calculatePercentile(sorted, 0.75);
  const iqr = q3 - q1;
  
  // パーセンタイル
  const p90 = calculatePercentile(sorted, 0.90);
  const p95 = calculatePercentile(sorted, 0.95);
  
  // 変動係数
  const cv = mean !== 0 ? stdDev / mean : 0;
  
  // 歪度
  const skewness = calculateSkewness(values, mean, stdDev, n);
  
  // 尖度（超過尖度）
  const kurtosis = calculateKurtosis(values, mean, stdDev, n);
  
  // 最頻値
  const mode = calculateMode(values);
  
  return {
    count: n,
    mean: mean,
    median: median,
    mode: mode,
    std_dev: stdDev,
    variance: variance,
    min: sorted[0],
    max: sorted[n - 1],
    q1: q1,
    q3: q3,
    p90: p90,
    p95: p95,
    iqr: iqr,
    cv: cv,
    skewness: skewness,
    kurtosis: kurtosis
  };
}

/**
 * 深刻度を計算
 * @param {number} zScore - Zスコア
 * @returns {'critical' | 'high' | 'medium' | 'low'} 深刻度
 * - critical: |zScore| > 3.0
 * - high: |zScore| > 2.0
 * - medium: |zScore| > 1.5
 * - low: それ以外
 */
function calculateSeverity(zScore) {
  const absZ = Math.abs(zScore);
  if (absZ > 3.0) return 'critical';
  if (absZ > 2.0) return 'high';
  if (absZ > 1.5) return 'medium';
  return 'low';
}

/**
 * IQR法による外れ値検出
 * @param {number[]} values - 数値配列
 * @param {number} [multiplier=1.5] - IQRの乗数（デフォルト1.5）
 * @returns {OutlierInfo[]} 外れ値情報の配列
 * 各要素は {index, value, isOutlier, zScore, severity} を含む
 */
function detectOutliersIQR(values, multiplier = 1.5) {
  const stats = calculateStats(values);
  if (!stats) return [];
  
  const lowerBound = stats.q1 - multiplier * stats.iqr;
  const upperBound = stats.q3 + multiplier * stats.iqr;
  
  return values.map((value, index) => {
    const zScore = (value - stats.mean) / stats.std_dev;
    
    return {
      index: index,
      value: value,
      isOutlier: value < lowerBound || value > upperBound,
      zScore: zScore,
      severity: calculateSeverity(zScore)
    };
  });
}

/**
 * Zスコアによる異常検知
 * @param {number[]} values - 数値配列
 * @param {number} [threshold=3.0] - 閾値（デフォルト3.0）
 * @returns {OutlierInfo[]} 外れ値情報の配列
 * 各要素は {index, value, zScore, isOutlier, severity} を含む
 */
function detectOutliersZScore(values, threshold = 3.0) {
  const stats = calculateStats(values);
  if (!stats) return [];
  
  return values.map((value, index) => {
    const zScore = (value - stats.mean) / stats.std_dev;
    const absZ = Math.abs(zScore);
    
    return {
      index: index,
      value: value,
      zScore: zScore,
      isOutlier: absZ > threshold,
      severity: absZ > 3 ? 'critical' : absZ > 2 ? 'high' : 'medium'
    };
  });
}

/**
 * 標準正規分布の累積分布関数
 * @param {number} z - 標準化された値（Zスコア）
 * @returns {number} 累積確率（0から1の間）
 */
function normalCDF(z) {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp(-z * z / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + 
           t * (-1.821256 + t * 1.330274))));
  
  return z > 0 ? 1 - p : p;
}

/**
 * t分布のp値を計算（近似）
 * @param {number} t - t統計量
 * @param {number} df - 自由度（degrees of freedom）
 * @returns {number} p値（0から1の間）
 * 注: 自由度が大きい場合は正規分布で近似
 */
function calculateTTestPValue(t, df) {
  const absT = Math.abs(t);
  
  // 正規分布で近似
  const z = absT;
  const p = 2 * (1 - normalCDF(z));
  return p;
}

/**
 * 相関の強さを解釈
 * @param {number} r - 相関係数の絶対値
 * @returns {'weak' | 'moderate' | 'strong'} 相関の強さ
 * - weak: |r| < 0.3
 * - moderate: 0.3 ≤ |r| < 0.7
 * - strong: |r| ≥ 0.7
 */
function interpretCorrelation(r) {
  if (r < 0.3) return 'weak';
  if (r < 0.7) return 'moderate';
  return 'strong';
}

/**
 * ピアソンの相関係数を計算
 * @param {number[]} x - 第1変数の値の配列
 * @param {number[]} y - 第2変数の値の配列
 * @returns {CorrelationResult|null} 相関分析結果
 * - r: 相関係数（-1から1の間）
 * - rSquared: 決定係数（寄与率）
 * - tStatistic: t統計量
 * - pValue: p値
 * - significant: 統計的有意性（p < 0.05）
 * - strength: 相関の強さ
 * - sampleSize: サンプルサイズ
 * サンプルサイズが3未満の場合は null を返す
 */
function calculateCorrelation(x, y) {
  const n = Math.min(x.length, y.length);
  
  if (n < 3) {
    return null; // サンプルサイズ不足
  }
  
  // 平均値
  const meanX = x.reduce((a, b) => a + b, 0) / n;
  const meanY = y.reduce((a, b) => a + b, 0) / n;
  
  // 共分散と分散
  let covariance = 0;
  let varX = 0;
  let varY = 0;
  
  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    covariance += dx * dy;
    varX += dx * dx;
    varY += dy * dy;
  }
  
  // 相関係数
  const r = covariance / Math.sqrt(varX * varY);
  
  // t検定
  const tStat = r * Math.sqrt((n - 2) / (1 - r * r));
  const pValue = calculateTTestPValue(tStat, n - 2);
  
  return {
    r: r,
    rSquared: r * r,
    tStatistic: tStat,
    pValue: pValue,
    significant: pValue < 0.05,
    strength: interpretCorrelation(Math.abs(r)),
    sampleSize: n
  };
}

/**
 * 目的変数と相関する上位要因を抽出
 * @param {Object<string, number[]>} variables - 変数のオブジェクト（変数名をキー、値の配列を値とする）
 * @param {string} [targetVar='leadTime'] - 目的変数名（デフォルト: 'leadTime'）
 * @returns {TopFactor[]} 上位要因の配列（相関の強さで降順ソート）
 * 各要素は {factor, correlation, absCorrelation, pValue, strength, rSquared} を含む
 * 統計的に有意（p < 0.05）な要因のみを含む
 */
function findTopFactors(variables, targetVar = 'leadTime') {
  /** @type {TopFactor[]} */
  const factors = [];
  
  for (const [varName, values] of Object.entries(variables)) {
    if (varName === targetVar) continue;
    
    const corr = calculateCorrelation(variables[targetVar], values);
    
    if (corr && corr.significant) {
      factors.push({
        factor: varName,
        correlation: corr.r,
        absCorrelation: Math.abs(corr.r),
        pValue: corr.pValue,
        strength: corr.strength,
        rSquared: corr.rSquared
      });
    }
  }
  
  // 相関の強さ（絶対値）でソート
  return factors.sort((a, b) => b.absCorrelation - a.absCorrelation);
}

/**
 * Issueデータからメトリクスを抽出
 * @param {Issue[]} issues - Issue配列
 * @returns {ExtractedMetrics} 抽出されたメトリクスデータ
 * - leadTimes: リードタイム（日数）の配列
 * - cycleTimes: サイクルタイム（日数）の配列
 * - reviewTimes: レビュー時間（日数）の配列
 * - complexities: 複雑度（ラベル数）の配列
 * - comments: コメント数の配列
 * - assignees: 担当者数の配列
 * 注: クローズされていないIssueは除外される
 */
function extractMetrics(issues) {
  const leadTimes = [];
  const cycleTimes = [];
  const reviewTimes = [];
  const complexities = [];
  const comments = [];
  const assignees = [];

  issues.forEach(issue => {
    // クローズされていないIssueはスキップ
    if (!issue.closed_at) return;
    
    const created = new Date(issue.created_at);
    const closed = new Date(issue.closed_at);
    
    // リードタイム（作成からクローズまでの日数）
    const leadTime = (closed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
    
    // サイクルタイム（更新からクローズまでの日数、またはリードタイム全体）
    const cycleTime = leadTime;
    
    // レビュー時間（簡易的にサイクルタイムを使用）
    const reviewTime = cycleTime;
    
    // 複雑度（ラベル数を使用）
    const complexity = issue.labels.length;
    
    // コメント数
    const numComments = issue.comments || 0;
    
    // 担当者数
    const numAssignees = issue.assignees.length || 0;
    
    leadTimes.push(leadTime);
    cycleTimes.push(cycleTime);
    reviewTimes.push(reviewTime);
    complexities.push(complexity);
    comments.push(numComments);
    assignees.push(numAssignees);
  });

  return {
    leadTimes,
    cycleTimes,
    reviewTimes,
    complexities,
    comments,
    assignees
  };
}

/**
 * 完全な統計分析を実行
 * @param {Issue[]} issues - Issue配列
 * @returns {StatisticalAnalysisResults} 分析結果
 */
function performFullAnalysis(issues) {
  /** @type {StatisticalAnalysisResults} */
  const results = {
    descriptive: {
      leadTime: null,
      cycleTime: null,
      reviewTime: null,
      complexity: null,
      comments: null,
      assignees: null
    },
    anomalies: {
      outliers: [],
      patterns: []
    },
    correlations: {
      topFactors: []
    }
  };

  // メトリクスの抽出
  const metrics = extractMetrics(issues);
  
  core.info(`統計分析対象: ${metrics.leadTimes.length}件のクローズ済みIssue`);

  // 1. 記述統計
  core.info('Step 1: 記述統計量を計算中...');
  results.descriptive = {
    leadTime: calculateStats(metrics.leadTimes),
    cycleTime: calculateStats(metrics.cycleTimes),
    reviewTime: calculateStats(metrics.reviewTimes),
    complexity: calculateStats(metrics.complexities),
    comments: calculateStats(metrics.comments),
    assignees: calculateStats(metrics.assignees)
  };

  // 2. 異常検知
  core.info('Step 2: 異常検知を実行中...');
  const leadTimeOutliers = detectOutliersIQR(metrics.leadTimes);
  results.anomalies.outliers = leadTimeOutliers.filter(o => o.isOutlier);

  // 3. 相関分析
  core.info('Step 3: 相関分析を実行中...');
  const variables = {
    leadTime: metrics.leadTimes,
    cycleTime: metrics.cycleTimes,
    reviewTime: metrics.reviewTimes,
    complexity: metrics.complexities,
    comments: metrics.comments,
    assignees: metrics.assignees
  };
  
  results.correlations.topFactors = findTopFactors(variables, 'leadTime');

  core.info('統計分析が完了しました');
  return results;
}

/**
 * 統計分析を実行して結果を返す
 * @param {Issue[]} issues - Issue配列
 * @returns {StatisticalAnalysisResults} 分析結果
 */
export function performStatisticalAnalysis(issues) {
  return performFullAnalysis(issues);
}

/**
 * 統計分析結果から簡易サマリーを生成
 * @param {StatisticalAnalysisResults} analysisResults - 分析結果
 * @returns {string} サマリーテキスト
 */
export function generateAnalysisSummary(analysisResults) {
  let summary = '## 📊 統計分析結果\n\n';
  
  // 記述統計
  if (analysisResults.descriptive.leadTime) {
    const lt = analysisResults.descriptive.leadTime;
    summary += '### リードタイム統計\n\n';
    summary += `| 指標 | 値 |\n`;
    summary += `|------|-----|\n`;
    summary += `| サンプル数 | ${lt.count} |\n`;
    summary += `| 平均 | ${lt.mean.toFixed(2)}日 |\n`;
    summary += `| 中央値 | ${lt.median.toFixed(2)}日 |\n`;
    summary += `| 標準偏差 | ${lt.std_dev.toFixed(2)}日 |\n`;
    summary += `| P90 | ${lt.p90.toFixed(2)}日 |\n`;
    summary += `| P95 | ${lt.p95.toFixed(2)}日 |\n\n`;
  }
  
  // 異常検知
  summary += `### 異常検知結果\n\n`;
  summary += `- 検出された外れ値: ${analysisResults.anomalies.outliers.length}件\n\n`;
  
  // 相関分析
  if (analysisResults.correlations.topFactors.length > 0) {
    summary += `### リードタイムと相関する要因（上位5件）\n\n`;
    summary += `| 要因 | 相関係数 | 強度 |\n`;
    summary += `|------|---------|------|\n`;
    analysisResults.correlations.topFactors.slice(0, 5).forEach(factor => {
      summary += `| ${factor.factor} | ${factor.correlation.toFixed(3)} | ${factor.strength} |\n`;
    });
    summary += `\n`;
  }
  
  return summary;
}
