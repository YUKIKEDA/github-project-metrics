import MLR from 'ml-regression-multivariate-linear';
import type { IssueMetricsRecord } from '../metrics/type';
import type {
  MetricKey,
  RegressionAnalysisResult,
  RegressionConfig,
  RegressionSummary,
} from './type';
import { computeMean, computeSampleVariance } from './descriptive';

interface PreparedDataset {
  matrixX: number[][];
  vectorY: number[];
  sampleIndices: number[];
}

/**
 * 指定した目的変数と説明変数で重回帰分析を実行する。
 *
 * @param metrics 回帰分析の対象となる Issue メトリクス集合
 * @param config 目的変数や説明変数を含む設定
 * @returns 回帰係数および残差統計などを含む分析結果
 */
export function performRegressionAnalysis(
  metrics: Record<number, IssueMetricsRecord> | IssueMetricsRecord[],
  config: RegressionConfig,
): RegressionAnalysisResult {
  validateRegressionConfig(config);

  const records = Array.isArray(metrics) ? metrics : Object.values(metrics);
  const dataset = prepareRegressionDataset(records, config);

  if (dataset.vectorY.length <= config.predictors.length) {
    throw new Error('Not enough samples to fit regression model');
  }

  const regression = fitRegressionModel(dataset, config);
  const summary = buildRegressionSummary(dataset, config, regression);

  return {
    summary,
    diagnostics: {
      conditionNumber: null,
    },
  };
}

/**
 * 回帰設定の妥当性を検証する。
 *
 * @param config 目的変数と説明変数の設定
 */
function validateRegressionConfig(config: RegressionConfig): void {
  if (config.predictors.length === 0) {
    throw new Error('At least one predictor is required');
  }
  if (config.predictors.includes(config.target)) {
    throw new Error('Target metric cannot be included in predictors');
  }
}

/**
 * 回帰分析用に X 行列と y ベクトルを構築する。
 *
 * @param records 対象となるメトリクスレコード配列
 * @param config 回帰設定
 * @returns 行列 X・ベクトル y・サンプルインデックスを含むデータセット
 */
function prepareRegressionDataset(records: IssueMetricsRecord[], config: RegressionConfig): PreparedDataset {
  const matrixX: number[][] = [];
  const vectorY: number[] = [];
  const sampleIndices: number[] = [];

  for (const record of records) {
    const targetResult = record.metrics[config.target];
    if (targetResult?.status !== 'success') {
      continue;
    }

    const predictors = config.predictors.map((key) => record.metrics[key]);
    if (predictors.some((result) => result?.status !== 'success')) {
      continue;
    }

    const row: number[] = predictors.map((result) => (result as { status: 'success'; value: number }).value);

    matrixX.push(row);
    vectorY.push(targetResult.value);
    sampleIndices.push(record.issue.number);
  }

  return {
    matrixX,
    vectorY,
    sampleIndices,
  };
}

/**
 * `ml-regression-multivariate-linear` を用いて回帰モデルを学習する。
 *
 * @param dataset 回帰用データセット
 * @param config 回帰設定
 * @returns 学習済み回帰モデル
 */
function fitRegressionModel(dataset: PreparedDataset, config: RegressionConfig) {
  const includeIntercept = config.includeIntercept ?? true;
  const outputs = dataset.vectorY.map((value) => [value]);

  return new MLR(dataset.matrixX, outputs, { intercept: includeIntercept });
}

/**
 * 回帰係数と残差からサマリー情報を構築する。
 *
 * @param dataset 回帰用データセット
 * @param config 回帰設定
 * @param regression 学習済み回帰モデル
 * @returns 回帰サマリー
 */
function buildRegressionSummary(
  dataset: PreparedDataset,
  config: RegressionConfig,
  regression: any,
): RegressionSummary {
  const includeIntercept = config.includeIntercept ?? true;

  const predictionsRaw = regression.predict(dataset.matrixX);
  const predictions = normalizePredictions(predictionsRaw);

  const residuals = dataset.vectorY.map((value, index) => value - predictions[index]);
  const residualMeanValue = computeMean(residuals);
  const residualVariance = residualMeanValue !== null ? computeSampleVariance(residuals, residualMeanValue) : null;
  const residualStd = residualVariance !== null ? Math.sqrt(residualVariance) : null;
  const residualMin = residuals.length > 0 ? Math.min(...residuals) : null;
  const residualMax = residuals.length > 0 ? Math.max(...residuals) : null;

  const yMeanValue = computeMean(dataset.vectorY) ?? 0;
  const ssTotal = dataset.vectorY.reduce((acc, value) => acc + (value - yMeanValue) ** 2, 0);
  const ssResidual = residuals.reduce((acc, value) => acc + value ** 2, 0);
  const rSquared = ssTotal !== 0 ? 1 - ssResidual / ssTotal : null;

  const predictorCount = config.predictors.length + (includeIntercept ? 1 : 0);
  const n = dataset.vectorY.length;
  const adjustedRSquared = rSquared !== null ? 1 - ((1 - rSquared) * (n - 1)) / (n - predictorCount) : null;

  const coefficientVector = extractCoefficientVector(regression.weights, includeIntercept);
  const coefficientsMap: Partial<Record<MetricKey | 'intercept', number>> = {};
  let index = 0;
  if (includeIntercept) {
    coefficientsMap.intercept = coefficientVector[index] ?? 0;
    index += 1;
  }
  for (const predictor of config.predictors) {
    coefficientsMap[predictor] = coefficientVector[index] ?? 0;
    index += 1;
  }

  return {
    config,
    sampleSize: dataset.vectorY.length,
    coefficients: coefficientsMap,
    rSquared,
    adjustedRSquared,
    residualStandardError: residualStd,
    residuals: {
      mean: residualMeanValue,
      variance: residualVariance,
      standardDeviation: residualStd,
      min: residualMin,
      max: residualMax,
    },
  };
}

/**
 * ライブラリの `predict` 出力を一次元配列へ正規化する。
 *
 * @param predictions `predict` からの戻り値
 * @returns 一次元配列に正規化された予測値
 */
function normalizePredictions(predictions: unknown): number[] {
  if (Array.isArray(predictions)) {
    if (predictions.length === 0) {
      return [];
    }
    if (Array.isArray(predictions[0])) {
      return (predictions as number[][]).map((row) => row[0]);
    }
    return predictions as number[];
  }
  return [predictions as number];
}

/**
 * 重回帰モデルの重み行列から係数ベクトルを抽出する。
 *
 * @param weights ライブラリが保持する重み表現
 * @param includeIntercept 切片を含めているかどうか
 * @returns 係数を一次元配列で表したもの（先頭が切片）
 */
function extractCoefficientVector(weights: unknown, includeIntercept: boolean): number[] {
  if (!weights) {
    return [];
  }

  const asMatrix = (weights as { to2DArray?: () => number[][]; data?: number[][] });
  let matrixArray: number[][] = [];
  if (typeof asMatrix.to2DArray === 'function') {
    matrixArray = asMatrix.to2DArray();
  } else if (Array.isArray(asMatrix)) {
    matrixArray = asMatrix as unknown as number[][];
  } else if (Array.isArray(asMatrix.data)) {
    matrixArray = asMatrix.data as number[][];
  }

  if (matrixArray.length === 0) {
    return [];
  }

  const column = matrixArray.map((row) => row[0] ?? 0);
  if (!includeIntercept) {
    return column;
  }
  return column;
}
