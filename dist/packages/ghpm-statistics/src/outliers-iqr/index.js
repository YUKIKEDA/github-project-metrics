import { percentile } from "../percentile/index.js";
export function outliersIQR(values, options = {}) {
    if (values.length === 0) {
        return [];
    }
    const { multiplier = 1.5, sorted = false, quartiles } = options;
    if (!Number.isFinite(multiplier) || multiplier < 0) {
        throw new RangeError("multiplier must be a finite number greater than or equal to 0");
    }
    let q1;
    let q3;
    if (quartiles) {
        ({ q1, q3 } = quartiles);
    }
    else {
        q1 = percentile(values, 25, { sorted });
        q3 = percentile(values, 75, { sorted });
    }
    const iqr = q3 - q1;
    if (iqr === 0 && multiplier > 0) {
        return [];
    }
    const lowerBound = q1 - multiplier * iqr;
    const upperBound = q3 + multiplier * iqr;
    const results = [];
    values.forEach((value, index) => {
        if (value < lowerBound || value > upperBound) {
            results.push({ index, value });
        }
    });
    return results;
}
export default outliersIQR;
//# sourceMappingURL=index.js.map