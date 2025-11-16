/**
 * ピアソンの積率相関係数を計算します。
 *
 * @param x - 1つ目の数値配列
 * @param y - 2つ目の数値配列
 * @returns `x` と `y` の相関係数（-1 から 1 の範囲）
 * @throws {TypeError} 配列の長さが異なる場合、または要素数が 0 の場合
 */
export function correlationPearson(x, y) {
    if (x.length !== y.length) {
        throw new TypeError("x and y must have the same length");
    }
    const n = x.length;
    if (n === 0) {
        throw new TypeError("x and y must contain at least one element");
    }
    if (n === 1) {
        return 0;
    }
    let sumX = 0;
    let sumY = 0;
    let sumXX = 0;
    let sumYY = 0;
    let sumXY = 0;
    for (let i = 0; i < n; i += 1) {
        const xi = x[i];
        const yi = y[i];
        sumX += xi;
        sumY += yi;
        sumXX += xi * xi;
        sumYY += yi * yi;
        sumXY += xi * yi;
    }
    const numerator = n * sumXY - sumX * sumY;
    const denominatorLeft = n * sumXX - sumX * sumX;
    const denominatorRight = n * sumYY - sumY * sumY;
    if (denominatorLeft === 0 || denominatorRight === 0) {
        return 0;
    }
    const denominator = Math.sqrt(denominatorLeft * denominatorRight);
    return numerator / denominator;
}
export default correlationPearson;
//# sourceMappingURL=index.js.map