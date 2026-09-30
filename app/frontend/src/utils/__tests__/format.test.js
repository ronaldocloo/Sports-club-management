import { describe, expect, it } from 'vitest'
import { formatDate, formatMoney } from '../format'

describe('formatMoney', () => {
  it('uses cedis with thousands separators', () => {
    expect(formatMoney(1234.5)).toBe('GH₵1,234.5')
    expect(formatMoney(0)).toBe('GH₵0')
    expect(formatMoney('250')).toBe('GH₵250')
  })
  it('puts the minus sign before the currency', () => {
    expect(formatMoney(-90)).toBe('-GH₵90')
  })
  it('accepts another currency', () => {
    expect(formatMoney(5, '$')).toBe('$5')
  })
})

describe('formatDate', () => {
  it('formats as day month year', () => {
    expect(formatDate('2026-03-05T12:00:00')).toBe('5 Mar 2026')
  })
  it('accepts custom options', () => {
    expect(formatDate('2026-03-05T12:00:00', { month: 'long' })).toBe('March')
  })
})
