/**
 * 与えられた配列を順位付けします。値が同じ場合は平均順位を割り当てます。
 *
 * @param values - 順位付け対象の配列
 * @returns 各要素に対応する順位を格納した配列
 */
function rank(values) {
    const indexed = values.map((value, index) => ({ value, index }));
    indexed.sort((a, b) => a.value - b.value);
    const ranks = new Array(values.length);
    let i = 0;
    while (i < indexed.length) {
        let j = i;
        while (j + 1 < indexed.length && indexed[j + 1].value === indexed[i].value) {
            j += 1;
        }
        const averageRank = (i + j) / 2 + 1;
        for (let k = i; k <= j; k += 1) {
            ranks[indexed[k].index] = averageRank;
        }
        i = j + 1;
    }
    return ranks;
}
/**
 * スピアマンの順位相関係数を計算します。
 *
 * @param x - 1つ目の数値配列
 * @param y - 2つ目の数値配列
 * @returns `x` と `y` の順位相関係数（-1 から 1 の範囲）
 * @throws {TypeError} 配列の長さが異なる場合、または要素数が 0 の場合
 */
export function correlationSpearman(x, y) {
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
    const rankX = rank(x);
    const rankY = rank(y);
    let sumDiffSquared = 0;
    for (let i = 0; i < n; i += 1) {
        const diff = rankX[i] - rankY[i];
        sumDiffSquared += diff * diff;
    }
    const numerator = 6 * sumDiffSquared;
    const denominator = n * (n * n - 1);
    return 1 - numerator / denominator;
}
export default correlationSpearman;
//# sourceMappingURL=index.js.map