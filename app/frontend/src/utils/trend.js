// Least-squares straight line through y values at x = 0, 1, 2 ... (mirrors the backend's Trend class).
export function linearFit(y) {
  const n = y.length
  if (n === 0) return { slope: 0, intercept: 0, residualStd: 0, n: 0, predict: () => 0 }
  if (n === 1) return { slope: 0, intercept: y[0], residualStd: 0, n: 1, predict: () => y[0] }
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0
  y.forEach((v, i) => { sumX += i; sumY += v; sumXY += i * v; sumXX += i * i })
  const denom = n * sumXX - sumX * sumX
  const slope = denom === 0 ? 0 : (n * sumXY - sumX * sumY) / denom
  const intercept = (sumY - slope * sumX) / n
  const sse = y.reduce((s, v, i) => s + (v - (intercept + slope * i)) ** 2, 0)
  const residualStd = n > 2 ? Math.sqrt(sse / (n - 2)) : 0
  return { slope, intercept, residualStd, n, predict: (x) => intercept + slope * x }
}

export const mean = (v) => (v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0)

export function stdDev(v) {
  if (v.length < 2) return 0
  const m = mean(v)
  return Math.sqrt(v.reduce((s, d) => s + (d - m) ** 2, 0) / (v.length - 1))
}
