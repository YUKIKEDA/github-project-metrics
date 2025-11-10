import arrayMax from "ml-array-max";

export interface MaxOptions {
  fromIndex?: number;
  toIndex?: number;
}

export function max(values: ReadonlyArray<number>, options: MaxOptions = {}): number {
  return arrayMax(values, options);
}

export default max;
