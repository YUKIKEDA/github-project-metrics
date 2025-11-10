import arrayVariance from "ml-array-variance";

export interface VarianceOptions {
  unbiased?: boolean;
  mean?: number;
}

export function variance(values: ReadonlyArray<number>, options: VarianceOptions = {}): number {
  return arrayVariance(values, options);
}

export default variance;
