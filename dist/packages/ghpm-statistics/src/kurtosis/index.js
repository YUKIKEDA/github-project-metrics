import { mean as meanFn } from "../mean/index.js";
export function kurtosis(values, options = {}) {
    const { mean = meanFn(values), unbiased = true, excess = true } = options;
    const n = values.length;
    if (n < 2) {
        throw new TypeError("values must contain at least two elements");
    }
    if (unbiased && n < 4) {
        throw new TypeError("unbiased kurtosis requires at least four elements");
    }
    let sum2 = 0;
    let sum4 = 0;
    for (const value of values) {
        const diff = value - mean;
        const diff2 = diff * diff;
        sum2 += diff2;
        sum4 += diff2 * diff2;
    }
    if (sum2 === 0) {
        return 0;
    }
    if (unbiased) {
        const s2 = sum2 / (n - 1);
        if (s2 === 0) {
            return 0;
        }
        const s4 = s2 * s2;
        const term = sum4 / s4;
        const coefficient = (n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3));
        const correction = (3 * (n - 1) * (n - 1)) / ((n - 2) * (n - 3));
        const g2 = coefficient * term - correction;
        return excess ? g2 : g2 + 3;
    }
    const sigma2 = sum2 / n;
    if (sigma2 === 0) {
        return 0;
    }
    const m4 = sum4 / n;
    const kurt = m4 / (sigma2 * sigma2);
    return excess ? kurt - 3 : kurt;
}
export default kurtosis;
//# sourceMappingURL=index.js.map