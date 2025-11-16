export function median(values, options = {}) {
    if (values.length === 0) {
        throw new TypeError("values must contain at least one element");
    }
    const { sorted = false } = options;
    const data = sorted ? Array.from(values) : Array.from(values).sort((a, b) => a - b);
    const mid = Math.floor(data.length / 2);
    if (data.length % 2 === 0) {
        return (data[mid - 1] + data[mid]) / 2;
    }
    return data[mid];
}
export default median;
//# sourceMappingURL=index.js.map