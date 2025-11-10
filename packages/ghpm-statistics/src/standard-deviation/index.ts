import arrayStandardDeviation from "ml-array-standard-deviation";

export interface StandardDeviationOptions {
  unbiased?: boolean;
  mean?: number;
}

export function standardDeviation(
  values: ReadonlyArray<number>,
  options: StandardDeviationOptions = {},
): number {
  return arrayStandardDeviation(values, options);
}

export default standardDeviation;
