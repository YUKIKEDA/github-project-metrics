import { mean as meanFn } from "../mean/index.js";
export function skewness(values, options = {}) {
    const { mean = meanFn(values), unbiased = true } = options;
    const n = values.length;
    if (n < 2) {
        throw new TypeError("values must contain at least two elements");
    }
    if (unbiased && n < 3) {
        throw new TypeError("unbiased skewness requires at least three elements");
    }
    let sum2 = 0;
    let sum3 = 0;
    for (const value of values) {
        const diff = value - mean;
        const diff2 = diff * diff;
        sum2 += diff2;
        sum3 += diff2 * diff;
    }
    if (sum2 === 0) {
        return 0;
    }
    if (unbiased) {
        const s = Math.sqrt(sum2 / (n - 1));
        if (s === 0) {
            return 0;
        }
        const correction = n / ((n - 1) * (n - 2));
        return correction * (sum3 / (s * s * s));
    }
    const sigma = Math.sqrt(sum2 / n);
    if (sigma === 0) {
        return 0;
    }
    const m3 = sum3 / n;
    return m3 / (sigma * sigma * sigma);
}
export default skewness;
//# sourceMappingURL=index.js.map