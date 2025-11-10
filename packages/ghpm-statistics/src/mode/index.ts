import arrayMode from "ml-array-mode";

export function mode(values: ReadonlyArray<number>): number {
  return arrayMode(values);
}

export default mode;
