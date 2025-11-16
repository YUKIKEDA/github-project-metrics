import { mean as meanFn } from "../mean/index.js";
import { standardDeviation as standardDeviationFn } from "../standard-deviation/index.js";
export function outliersZScore(values, options = {}) {
    if (values.length === 0) {
        return [];
    }
    const { threshold = 3, mean = meanFn(values), standardDeviation } = options;
    if (!Number.isFinite(threshold) || threshold <= 0) {
        throw new RangeError("threshold must be a finite number greater than 0");
    }
    const sigma = standardDeviation ??
        standardDeviationFn(values, {
            mean,
            unbiased: false,
        });
    if (sigma === 0) {
        return [];
    }
    const results = [];
    values.forEach((value, index) => {
        const zScore = (value - mean) / sigma;
        if (Math.abs(zScore) > threshold) {
            results.push({ index, value, zScore });
        }
    });
    return results;
}
export default outliersZScore;
//# sourceMappingURL=index.js.map