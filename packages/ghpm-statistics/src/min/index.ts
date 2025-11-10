import arrayMin from "ml-array-min";

export interface MinOptions {
  fromIndex?: number;
  toIndex?: number;
}

export function min(values: ReadonlyArray<number>, options: MinOptions = {}): number {
  return arrayMin(values, options);
}

export default min;
