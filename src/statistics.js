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
 * Abramowitz and Stegun の近似式を使用
 * @param {number} z - 標準化された値（Zスコア）
 * @returns {number} 累積確率（0から1の間）
 */
function normalCDF(z) {
  // Abramowitz and Stegun の近似式の係数
  const RATIONAL_APPROX_COEFF = 0.2316419;
  const NORMALIZATION_CONST = 0.3989423; // 1/√(2π)
  const POLY_COEFFS = [0.3193815, -0.3565638, 1.781478, -1.821256, 1.330274];
  
  const t = 1 / (1 + RATIONAL_APPROX_COEFF * Math.abs(z));
  const d = NORMALIZATION_CONST * Math.exp(-z * z / 2);
  const p = d * t * (POLY_COEFFS[0] + t * (POLY_COEFFS[1] + t * (POLY_COEFFS[2] + 
           t * (POLY_COEFFS[3] + t * POLY_COEFFS[4]))));
  
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
 * パターンベースの異常検知
 * @param {Object} currentMetrics - 現在のメトリクスの記述統計量
 * @param {Object} historicalMetrics - 過去のメトリクスの記述統計量
 * @returns {PatternAnomaly[]} 検出された問題の配列
 */
function detectPatternAnomalies(currentMetrics, historicalMetrics) {
  // 異常検知の閾値
  const CRITICAL_INCREASE_THRESHOLD = 1.5; // 急増と判断する閾値（1.5倍）
  const HIGH_INCREASE_THRESHOLD = 1.3; // 高い増加と判断する閾値（1.3倍）
  const CV_UNPREDICTABILITY_THRESHOLD = 1.0; // 変動係数の予測可能性低下閾値（1.0）
  
  /** @type {PatternAnomaly[]} */
  const problems = [];
  
  if (!historicalMetrics || !currentMetrics) {
    // 過去データがない場合は、現在データのみで簡易検知
    return detectPatternAnomaliesFromCurrentOnly(currentMetrics);
  }
  
  // 1. メトリクスの急増（CRITICAL_INCREASE_THRESHOLD倍以上）
  if (currentMetrics.leadTime && historicalMetrics.leadTime && 
      currentMetrics.leadTime.p90 > historicalMetrics.leadTime.p90 * CRITICAL_INCREASE_THRESHOLD) {
    const increaseRatio = currentMetrics.leadTime.p90 / historicalMetrics.leadTime.p90;
    problems.push({
      type: 'lead_time_spike',
      severity: 'critical',
      metric: 'lead_time_p90',
      current: currentMetrics.leadTime.p90,
      baseline: historicalMetrics.leadTime.p90,
      increase_pct: (increaseRatio - 1) * 100,
      message: `リードタイムP90が過去平均の${(increaseRatio * 100).toFixed(0)}%に増加（${currentMetrics.leadTime.p90.toFixed(2)}日 → ${historicalMetrics.leadTime.p90.toFixed(2)}日）`
    });
  }
  
  // 2. 平均値の急増（CRITICAL_INCREASE_THRESHOLD倍以上）
  if (currentMetrics.leadTime && historicalMetrics.leadTime && 
      currentMetrics.leadTime.mean > historicalMetrics.leadTime.mean * CRITICAL_INCREASE_THRESHOLD) {
    const increaseRatio = currentMetrics.leadTime.mean / historicalMetrics.leadTime.mean;
    problems.push({
      type: 'lead_time_mean_spike',
      severity: 'high',
      metric: 'lead_time_mean',
      current: currentMetrics.leadTime.mean,
      baseline: historicalMetrics.leadTime.mean,
      increase_pct: (increaseRatio - 1) * 100,
      message: `リードタイム平均が過去平均の${(increaseRatio * 100).toFixed(0)}%に増加（${currentMetrics.leadTime.mean.toFixed(2)}日 → ${historicalMetrics.leadTime.mean.toFixed(2)}日）`
    });
  }
  
  // 3. 変動係数の増加（予測困難性）
  if (currentMetrics.cycleTime && historicalMetrics.cycleTime) {
    if (currentMetrics.cycleTime.cv > CV_UNPREDICTABILITY_THRESHOLD) {
      problems.push({
        type: 'inconsistent_velocity',
        severity: 'medium',
        metric: 'cycle_time_variability',
        current: currentMetrics.cycleTime.cv,
        cv: currentMetrics.cycleTime.cv,
        message: `変動係数が${CV_UNPREDICTABILITY_THRESHOLD}を超過（${currentMetrics.cycleTime.cv.toFixed(2)}）。予測可能性が低下しています`
      });
    }
    if (currentMetrics.cycleTime.cv > historicalMetrics.cycleTime.cv * CRITICAL_INCREASE_THRESHOLD) {
      problems.push({
        type: 'increasing_variability',
        severity: 'high',
        metric: 'cycle_time_variability_increase',
        current: currentMetrics.cycleTime.cv,
        baseline: historicalMetrics.cycleTime.cv,
        increase_pct: ((currentMetrics.cycleTime.cv / historicalMetrics.cycleTime.cv) - 1) * 100,
        message: `変動係数が過去の${(currentMetrics.cycleTime.cv / historicalMetrics.cycleTime.cv).toFixed(1)}倍に増加。予測可能性がさらに低下しています`
      });
    }
  }
  
  // 4. サイクルタイムの増加
  if (currentMetrics.cycleTime && historicalMetrics.cycleTime && 
      currentMetrics.cycleTime.mean > historicalMetrics.cycleTime.mean * HIGH_INCREASE_THRESHOLD) {
    const increaseRatio = currentMetrics.cycleTime.mean / historicalMetrics.cycleTime.mean;
    problems.push({
      type: 'cycle_time_increase',
      severity: 'high',
      metric: 'cycle_time_mean',
      current: currentMetrics.cycleTime.mean,
      baseline: historicalMetrics.cycleTime.mean,
      increase_pct: (increaseRatio - 1) * 100,
      message: `サイクルタイム平均が過去平均の${(increaseRatio * 100).toFixed(0)}%に増加（${currentMetrics.cycleTime.mean.toFixed(2)}日 → ${historicalMetrics.cycleTime.mean.toFixed(2)}日）`
    });
  }
  
  return problems;
}

/**
 * 現在データのみからパターン異常を検知（過去データがない場合）
 * @param {Object} descriptive - 現在のメトリクスの記述統計量
 * @returns {PatternAnomaly[]} 検出された問題の配列
 */
function detectPatternAnomaliesFromCurrentOnly(descriptive) {
  // 異常検知の閾値
  const CV_UNPREDICTABILITY_THRESHOLD = 1.0; // 変動係数の予測可能性低下閾値（1.0）
  const SKEWNESS_THRESHOLD = 2.0; // 歪度の非対称分布閾値（2.0）
  const EXTREME_TASK_RATIO_THRESHOLD = 3.0; // P95が平均の何倍以上で極端なタスクと判断するか（3.0倍）
  
  /** @type {PatternAnomaly[]} */
  const problems = [];
  
  // 変動係数がCV_UNPREDICTABILITY_THRESHOLDを超える場合（予測可能性低下）
  if (descriptive.cycleTime && descriptive.cycleTime.cv > CV_UNPREDICTABILITY_THRESHOLD) {
    problems.push({
      type: 'inconsistent_velocity',
      severity: 'medium',
      metric: 'cycle_time_variability',
      current: descriptive.cycleTime.cv,
      cv: descriptive.cycleTime.cv,
      message: `変動係数が${CV_UNPREDICTABILITY_THRESHOLD}を超過（${descriptive.cycleTime.cv.toFixed(2)}）。予測可能性が低下しています`
    });
  }
  
  if (descriptive.leadTime && descriptive.leadTime.cv > CV_UNPREDICTABILITY_THRESHOLD) {
    problems.push({
      type: 'inconsistent_lead_time',
      severity: 'medium',
      metric: 'lead_time_variability',
      current: descriptive.leadTime.cv,
      cv: descriptive.leadTime.cv,
      message: `リードタイムの変動係数が${CV_UNPREDICTABILITY_THRESHOLD}を超過（${descriptive.leadTime.cv.toFixed(2)}）。予測可能性が低下しています`
    });
  }
  
  // 歪度が大きい場合（非対称分布）
  if (descriptive.leadTime && Math.abs(descriptive.leadTime.skewness) > SKEWNESS_THRESHOLD) {
    problems.push({
      type: 'skewed_distribution',
      severity: 'medium',
      metric: 'lead_time_distribution',
      current: descriptive.leadTime.skewness,
      message: `リードタイムの分布が非対称です（歪度: ${descriptive.leadTime.skewness.toFixed(2)}）。${descriptive.leadTime.skewness > 0 ? '右側に長い裾' : '左側に長い裾'}があります`
    });
  }
  
  // P95が平均のEXTREME_TASK_RATIO_THRESHOLD倍以上の場合（極端に長いタスクが存在）
  if (descriptive.leadTime && descriptive.leadTime.p95 > descriptive.leadTime.mean * EXTREME_TASK_RATIO_THRESHOLD) {
    const ratio = descriptive.leadTime.p95 / descriptive.leadTime.mean;
    problems.push({
      type: 'extreme_tasks',
      severity: 'high',
      metric: 'lead_time_p95_vs_mean',
      current: descriptive.leadTime.p95,
      baseline: descriptive.leadTime.mean,
      increase_pct: (ratio - 1) * 100,
      message: `P95が平均の${ratio.toFixed(1)}倍です。極端に長いタスクが存在しています`
    });
  }
  
  return problems;
}

/**
 * 複雑度を計算（GitHub ProjectのEstimationフィールドを使用）
 * @param {Issue} issue - Issueオブジェクト
 * @returns {number} 複雑度スコア（見積もり時間に基づいて分類された数値）
 * 
 * 計算方法:
 * - Issueが属している全てのProjectから"Estimation"フィールドを検索
 * - 見積もり時間（時間単位）に基づいて複雑度を分類:
 *   - 0-40時間以下: Low (10)
 *   - 40時間超-80時間以下: Middle (20)
 *   - 80時間超: High (30)
 * - Estimationフィールドが存在しない、または値が設定されていない場合は0を返す
 * 
 * 注: 10の倍数を使用することで、後で中間値（例：LowとMiddleの間に15など）を追加する際の拡張性を確保
 */
function calculateComplexity(issue) {
  // 複雑度分類の閾値（時間単位）
  const MIDDLE_THRESHOLD = 40;  // Middleの開始閾値（40時間超）
  const HIGH_THRESHOLD = 80;    // Highの開始閾値（80時間超）
  
  // 複雑度スコア（10の倍数を使用して拡張性を確保）
  const COMPLEXITY_LOW = 10;    // Low
  const COMPLEXITY_MIDDLE = 20; // Middle
  const COMPLEXITY_HIGH = 30;   // High
  
  // Issueが属している全てのProjectからEstimationフィールドを検索
  if (!issue.projects || issue.projects.length === 0) {
    return 0;
  }
  
  // 全てのProjectのfieldValuesからEstimationフィールドを探す
  for (const project of issue.projects) {
    if (!project.fieldValues || project.fieldValues.length === 0) {
      continue;
    }
    
    // Estimationフィールドを検索
    const estimationField = project.fieldValues.find(
      fieldValue => fieldValue.fieldName === 'Estimation' || fieldValue.fieldName === 'estimation'
    );
    
    if (estimationField && estimationField.value !== null && estimationField.value !== undefined) {
      // 数値として扱う
      const hours = typeof estimationField.value === 'number' 
        ? estimationField.value 
        : parseFloat(estimationField.value);
      
      // 有効な数値の場合のみ分類
      if (!isNaN(hours) && isFinite(hours) && hours >= 0) {
        // 見積もり時間に基づいて複雑度を分類
        if (hours > HIGH_THRESHOLD) {
          return COMPLEXITY_HIGH; // High
        } else if (hours > MIDDLE_THRESHOLD) {
          return COMPLEXITY_MIDDLE; // Middle
        } else {
          return COMPLEXITY_LOW; // Low（40時間以下）
        }
      }
    }
  }
  
  // Estimationフィールドが見つからない、または値が設定されていない場合は0を返す
  return 0;
}

/**
 * Issueデータからメトリクスを抽出
 * @param {Issue[]} issues - Issue配列
 * @param {Date|null} [cutoffDate=null] - 分割基準日（この日以前を過去期間とする。nullの場合は全期間）
 * @returns {ExtractedMetrics} 抽出されたメトリクスデータ
 * - leadTimes: リードタイム（日数）の配列
 * - cycleTimes: サイクルタイム（日数）の配列
 * - reviewTimes: レビュー時間（日数）の配列
 * - complexities: 複雑度スコアの配列
 * - comments: コメント数の配列
 * - assignees: 担当者数の配列
 * 注: クローズされていないIssueは除外される
 */
function extractMetrics(issues, cutoffDate = null) {
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
    
    // 分割基準日が指定されている場合、その日より後のIssueは除外（過去期間の抽出時）
    if (cutoffDate && closed.getTime() > cutoffDate.getTime()) return;
    
    // リードタイム（作成からクローズまでの日数）
    const leadTime = (closed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
    
    // サイクルタイム（作業開始からクローズまでの日数）
    // 最初のassignedイベント、またはupdated_atからクローズまで
    let cycleStartTime = created;
    const assignedEvent = issue.events?.find(e => e.event === 'assigned');
    if (assignedEvent) {
      cycleStartTime = new Date(assignedEvent.created_at);
    } else if (issue.updated_at) {
      // assignedイベントがない場合、最初の更新時点を作業開始と仮定
      const updated = new Date(issue.updated_at);
      // 作成直後の更新は除外（作成日時との差が1時間未満）
      if (updated.getTime() - created.getTime() > 60 * 60 * 1000) {
        cycleStartTime = updated;
      }
    }
    const cycleTime = (closed.getTime() - cycleStartTime.getTime()) / (1000 * 60 * 60 * 24);
    
    // レビュー時間（PRの場合、レビュー開始からクローズ/マージまでの日数）
    let reviewTime = 0;
    if (issue.pull_request) {
      // レビュー開始時点を探す
      const reviewStartEvent = issue.events?.find(e => 
        e.event === 'review_requested' || e.event === 'ready_for_review'
      );
      if (reviewStartEvent) {
        const reviewStart = new Date(reviewStartEvent.created_at);
        reviewTime = (closed.getTime() - reviewStart.getTime()) / (1000 * 60 * 60 * 24);
      } else {
        // レビューイベントがない場合、PR作成からクローズまで（簡易計算）
        reviewTime = leadTime;
      }
    }
    
    // 複雑度（複数の要因を組み合わせて計算）
    const complexity = calculateComplexity(issue);
    
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
 * 統計分析を実行して結果を返す
 * @param {Issue[]} issues - Issue配列
 * @returns {StatisticalAnalysisResults} 分析結果
 */
export function performStatisticalAnalysis(issues) {
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
      iqrOutliers: [],
      zScoreOutliers: [],
      patterns: []
    },
    correlations: {
      topFactors: {
        leadTime: [],
        cycleTime: [],
        reviewTime: [],
        complexity: [],
        comments: [],
        assignees: []
      }
    }
  };

  // クローズ済みIssueをクローズ日時でソート（古い順）
  /** @type {Issue[]} */
  const closedIssues = issues
    .filter(issue => issue.closed_at !== null)
    .sort((a, b) => {
      // closed_atはnullでないことが保証されている（filter済み）
      const dateA = new Date(/** @type {string} */ (a.closed_at)).getTime();
      const dateB = new Date(/** @type {string} */ (b.closed_at)).getTime();
      return dateA - dateB;
    });
  
  if (closedIssues.length === 0) {
    core.warning('クローズ済みIssueが存在しないため、統計分析をスキップします');
    return results;
  }

  //TODO: 分析期間をユーザーが指定できるようにする
  
  // 期間を分割（過去50%と現在50%）
  const cutoffIndex = Math.floor(closedIssues.length / 2);
  const historicalIssues = closedIssues.slice(0, cutoffIndex);
  const currentIssues = closedIssues.slice(cutoffIndex);
  
  // 分割基準日を計算（現在期間の最初のIssueのクローズ日）
  const cutoffDate = currentIssues.length > 0 && currentIssues[0].closed_at
    ? new Date(currentIssues[0].closed_at) 
    : null;
  
  // メトリクスの抽出
  // 過去期間: cutoffDateより前のIssue
  const historicalMetrics = cutoffDate 
    ? extractMetrics(issues.filter(issue => 
        issue.closed_at && new Date(issue.closed_at).getTime() < cutoffDate.getTime()
      ), cutoffDate)
    : extractMetrics(historicalIssues);
  
  // 現在期間: cutoffDate以降のIssue
  const currentMetrics = cutoffDate
    ? extractMetrics(issues.filter(issue => 
        issue.closed_at && new Date(issue.closed_at).getTime() >= cutoffDate.getTime()
      ))
    : extractMetrics(currentIssues);
  
  // 全期間のメトリクス（記述統計用）
  const allMetrics = extractMetrics(closedIssues);
  
  const historicalCount = historicalMetrics.leadTimes.length;
  const currentCount = currentMetrics.leadTimes.length;
  core.info(`統計分析対象: ${closedIssues.length}件のクローズ済みIssue（過去: ${historicalCount}件、現在: ${currentCount}件）`);

  // 1. 記述統計（全期間）
  core.info('Step 1: 記述統計量を計算中...');
  results.descriptive = {
    leadTime: calculateStats(allMetrics.leadTimes),
    cycleTime: calculateStats(allMetrics.cycleTimes),
    reviewTime: calculateStats(allMetrics.reviewTimes),
    complexity: calculateStats(allMetrics.complexities),
    comments: calculateStats(allMetrics.comments),
    assignees: calculateStats(allMetrics.assignees)
  };

  // 2. 異常検知
  core.info('Step 2: 異常検知を実行中...');
  const iqrOutliers = detectOutliersIQR(allMetrics.leadTimes);
  const zScoreOutliers = detectOutliersZScore(allMetrics.leadTimes);
  results.anomalies.iqrOutliers = iqrOutliers.filter(o => o.isOutlier);
  results.anomalies.zScoreOutliers = zScoreOutliers.filter(o => o.isOutlier);
  
  // パターンベース異常検知（過去データと現在データを比較）
  core.info('Step 2.5: パターンベース異常検知を実行中...');
  const currentDescriptive = {
    leadTime: calculateStats(currentMetrics.leadTimes),
    cycleTime: calculateStats(currentMetrics.cycleTimes),
    reviewTime: calculateStats(currentMetrics.reviewTimes),
    complexity: calculateStats(currentMetrics.complexities),
    comments: calculateStats(currentMetrics.comments),
    assignees: calculateStats(currentMetrics.assignees)
  };
  
  const historicalDescriptive = {
    leadTime: calculateStats(historicalMetrics.leadTimes),
    cycleTime: calculateStats(historicalMetrics.cycleTimes),
    reviewTime: calculateStats(historicalMetrics.reviewTimes),
    complexity: calculateStats(historicalMetrics.complexities),
    comments: calculateStats(historicalMetrics.comments),
    assignees: calculateStats(historicalMetrics.assignees)
  };
  
  results.anomalies.patterns = detectPatternAnomalies(currentDescriptive, historicalDescriptive);

  // 3. 相関分析
  core.info('Step 3: 相関分析を実行中...');
  const variables = {
    leadTime: allMetrics.leadTimes,
    cycleTime: allMetrics.cycleTimes,
    reviewTime: allMetrics.reviewTimes,
    complexity: allMetrics.complexities,
    comments: allMetrics.comments,
    assignees: allMetrics.assignees
  };
  
  // 全ての目的変数に対して相関分析を実行
  const targetVariables = ['leadTime', 'cycleTime', 'reviewTime', 'complexity', 'comments', 'assignees'];
  for (const targetVar of targetVariables) {
    results.correlations.topFactors[targetVar] = findTopFactors(variables, targetVar);
  }

  core.info('統計分析が完了しました');
  return results;
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
  summary += `- IQR法で検出された外れ値: ${analysisResults.anomalies.iqrOutliers.length}件\n`;
  summary += `- Zスコア法で検出された外れ値: ${analysisResults.anomalies.zScoreOutliers.length}件\n`;
  summary += `- 検出されたパターン異常: ${analysisResults.anomalies.patterns.length}件\n\n`;
  
  // パターンベース異常検知の詳細
  if (analysisResults.anomalies.patterns.length > 0) {
    summary += `#### パターン異常の詳細\n\n`;
    analysisResults.anomalies.patterns.forEach((pattern, index) => {
      const severityIcon = pattern.severity === 'critical' ? '🔴' : 
                          pattern.severity === 'high' ? '🟠' : 
                          pattern.severity === 'medium' ? '🟡' : '🟢';
      summary += `${index + 1}. **${severityIcon} ${pattern.type}** (${pattern.severity})\n`;
      summary += `   - メトリクス: ${pattern.metric}\n`;
      summary += `   - 現在値: ${pattern.current.toFixed(2)}\n`;
      if (pattern.baseline !== undefined) {
        summary += `   - ベースライン: ${pattern.baseline.toFixed(2)}\n`;
      }
      if (pattern.increase_pct !== undefined) {
        summary += `   - 増加率: ${pattern.increase_pct.toFixed(1)}%\n`;
      }
      summary += `   - ${pattern.message}\n\n`;
    });
  }
  
  // 相関分析
  const targetVariableLabels = {
    leadTime: 'リードタイム',
    cycleTime: 'サイクルタイム',
    reviewTime: 'レビュー時間',
    complexity: '複雑度',
    comments: 'コメント数',
    assignees: '担当者数'
  };
  
  for (const [targetVar, factors] of Object.entries(analysisResults.correlations.topFactors)) {
    if (factors.length > 0) {
      summary += `### ${targetVariableLabels[targetVar]}と相関する要因（上位5件）\n\n`;
      summary += `| 要因 | 相関係数 | 強度 |\n`;
      summary += `|------|---------|------|\n`;
      factors.slice(0, 5).forEach(factor => {
        summary += `| ${factor.factor} | ${factor.correlation.toFixed(3)} | ${factor.strength} |\n`;
      });
      summary += `\n`;
    }
  }
  
  return summary;
}
