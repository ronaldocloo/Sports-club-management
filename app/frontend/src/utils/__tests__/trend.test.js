import { describe, expect, it } from 'vitest'
import { linearFit, mean, stdDev } from '../trend'

describe('linearFit', () => {
  it('recovers an exact straight line with zero error', () => {
    const f = linearFit([100, 200, 300, 400, 500, 600])
    expect(f.slope).toBeCloseTo(100)
    expect(f.intercept).toBeCloseTo(100)
    expect(f.residualStd).toBeCloseTo(0)
    expect(f.predict(6)).toBeCloseTo(700)
    expect(f.predict(8)).toBeCloseTo(900)
  })
  it('matches the backend on a noisy series (same numbers as TrendTest)', () => {
    const f = linearFit([10, 14, 11, 17, 15])
    expect(f.slope).toBeCloseTo(1.3)
    expect(f.intercept).toBeCloseTo(10.8)
    expect(f.residualStd).toBeGreaterThan(0)
  })
  it('handles flat, single and empty input without NaN', () => {
    expect(linearFit([5, 5, 5]).slope).toBe(0)
    expect(linearFit([7]).predict(3)).toBe(7)
    expect(linearFit([]).predict(3)).toBe(0)
    expect(Number.isNaN(linearFit([1, 2]).residualStd)).toBe(false)
  })
})

describe('mean and stdDev', () => {
  it('compute sample statistics', () => {
    expect(mean([2, 4, 6])).toBe(4)
    expect(mean([])).toBe(0)
    expect(stdDev([2, 4, 4, 4, 5, 5, 7, 9])).toBeCloseTo(2.138, 3)
    expect(stdDev([3])).toBe(0)
  })
})
