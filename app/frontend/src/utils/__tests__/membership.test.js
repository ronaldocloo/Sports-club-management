import { describe, expect, it } from 'vitest'
import { membershipStatus } from '../membership'

const inDays = (n) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10)

describe('membershipStatus', () => {
  it('is Active when far from expiry', () => {
    expect(membershipStatus({ expiry: inDays(90) })).toMatchObject({ key: 'Active', tone: 'green' })
  })
  it('warns when expiry is within 30 days', () => {
    const s = membershipStatus({ expiry: inDays(10) })
    expect(s.key).toBe('Expiring')
    expect(s.tone).toBe('amber')
    expect(s.label).toMatch(/^Expires in \d+ days$/)
  })
  it('is Expired once the end date has passed', () => {
    expect(membershipStatus({ expiry: inDays(-3) })).toMatchObject({ key: 'Expired', tone: 'red' })
  })
  it('an explicit Suspended or Expired status wins over dates', () => {
    expect(membershipStatus({ expiry: inDays(90), status: 'Suspended' }).key).toBe('Suspended')
    expect(membershipStatus({ expiry: inDays(90), status: 'Expired' }).key).toBe('Expired')
  })
  it('an unpaid signup with no status is Pending', () => {
    expect(membershipStatus({ expiry: inDays(90), payment: 'Pending' }).key).toBe('Pending')
    expect(membershipStatus({ expiry: inDays(90), payment: 'Pending', status: 'Active' }).key).toBe('Active')
  })
})
