import { describe, expect, it } from 'vitest'
import { monthLabel, presetRange, rangePresets } from '../ranges'

const days = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000)

describe('date range presets', () => {
  it('each preset spans the number of days its label promises (inclusive)', () => {
    expect(days(...Object.values(presetRange('30d')))).toBe(29)
    expect(days(...Object.values(presetRange('90d')))).toBe(89)
    expect(days(...Object.values(presetRange('12m')))).toBe(364)
    expect(days(...Object.values(presetRange('2y')))).toBe(729)
  })
  it('all end today and start before they end', () => {
    for (const p of rangePresets) {
      const { from, to } = p.range()
      expect(from <= to).toBe(true)
      expect(to).toBe(presetRange('30d').to)
    }
  })
  it('stay inside the server limits (800 days for analytics, 5 years for reports)', () => {
    for (const p of rangePresets) {
      const { from, to } = p.range()
      expect(days(from, to)).toBeLessThanOrEqual(800)
    }
  })
  it('falls back to the first preset for an unknown key', () => {
    expect(presetRange('nope')).toEqual(presetRange('30d'))
  })
})

describe('monthLabel', () => {
  it('turns a year-month into a short label', () => {
    expect(monthLabel('2026-03')).toBe('Mar 26')
    expect(monthLabel('2025-12')).toBe('Dec 25')
  })
})
