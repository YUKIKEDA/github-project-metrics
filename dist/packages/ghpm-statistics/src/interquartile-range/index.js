import { percentile } from "../percentile/index.js";
export function interquartileRange(values, options = {}) {
    const q1 = percentile(values, 25, options);
    const q3 = percentile(values, 75, options);
    return q3 - q1;
}
export default interquartileRange;
//# sourceMappingURL=index.js.map