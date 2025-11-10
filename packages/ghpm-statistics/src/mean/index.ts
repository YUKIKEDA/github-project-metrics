import arrayMean from "ml-array-mean";

export function mean(values: ReadonlyArray<number>): number {
  return arrayMean(values);
}

export default mean;
