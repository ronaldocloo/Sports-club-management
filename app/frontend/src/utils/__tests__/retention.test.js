import { describe, expect, it } from 'vitest'
import { scoreRetention } from '../retention'

// These mirror the backend's RetentionScorerTest case for case, so the demo and the real API agree.
const base = { daysToMembershipEnd: 100, membershipActive: true, recentAttendance: null, earlierAttendance: null, noRecentAttendance: false, outstandingBalance: 0, membershipAgeDays: 100, hasRenewedBefore: false }
const score = (o) => scoreRetention({ ...base, ...o })

describe('scoreRetention (parity with the backend)', () => {
  it('a healthy loyal member scores zero and needs no action', () => {
    const r = score({ daysToMembershipEnd: 200, recentAttendance: 95, earlierAttendance: 92, membershipAgeDays: 400, hasRenewedBefore: true })
    expect(r.score).toBe(0)
    expect(r.band).toBe('Low')
    expect(r.action).toBe('No action needed')
  })
  it('an ended membership is the strongest single signal', () => {
    const r = score({ daysToMembershipEnd: -45, membershipActive: false })
    expect(r.score).toBe(40)
    expect(r.band).toBe('Medium')
    expect(r.factors[0].label).toContain('ended 45 days ago')
  })
  it('no membership scores as Medium (35)', () => {
    expect(score({ daysToMembershipEnd: null, membershipActive: false, membershipAgeDays: 0 }).score).toBe(35)
  })
  it('closer expiry scores higher', () => {
    const s = (d) => score({ daysToMembershipEnd: d }).score
    expect(s(7)).toBeGreaterThan(s(25))
    expect(s(25)).toBeGreaterThan(s(50))
    expect(s(50)).toBeGreaterThan(s(120))
    expect(s(120)).toBe(0)
  })
  it('low and falling attendance stacks: 25 + 15 + 10', () => {
    const r = score({ recentAttendance: 40, earlierAttendance: 80, noRecentAttendance: true })
    expect(r.score).toBe(50)
    expect(r.factors.map((f) => f.points)).toEqual([25, 15, 10])
    expect(r.action).toBe('Check in with the athlete about training')
  })
  it('a balance only counts on established memberships', () => {
    expect(score({ outstandingBalance: 60, membershipAgeDays: 10 }).score).toBe(0)
    expect(score({ outstandingBalance: 60, membershipAgeDays: 60 }).score).toBe(10)
    expect(score({ outstandingBalance: 250, membershipAgeDays: 60 }).score).toBe(15)
  })
  it('loyalty lowers the score but never below zero', () => {
    expect(score({ daysToMembershipEnd: 10, membershipAgeDays: 400, hasRenewedBefore: true }).score).toBe(30 - 15 - 5)
    expect(score({ daysToMembershipEnd: 200, recentAttendance: 100, earlierAttendance: 100, membershipAgeDays: 800, hasRenewedBefore: true }).score).toBe(0)
  })
  it('is capped at 100 and the High band starts at 60', () => {
    const r = score({ daysToMembershipEnd: -10, membershipActive: false, recentAttendance: 10, earlierAttendance: 90, noRecentAttendance: true, outstandingBalance: 500, membershipAgeDays: 90 })
    expect(r.score).toBeLessThanOrEqual(100)
    expect(r.band).toBe('High')
  })
  it('band boundaries', () => {
    const a = score({ daysToMembershipEnd: 5, recentAttendance: 45 })
    expect(a.score).toBe(55)
    expect(a.band).toBe('Medium')
    const b = score({ daysToMembershipEnd: 5, recentAttendance: 45, noRecentAttendance: true })
    expect(b.score).toBe(65)
    expect(b.band).toBe('High')
    expect(score({ daysToMembershipEnd: null, membershipActive: false, membershipAgeDays: 0 }).band).toBe('Medium')
    expect(score({ daysToMembershipEnd: 25 }).band).toBe('Low')
  })
  it('every point is explained by a factor', () => {
    const r = score({ daysToMembershipEnd: 10, recentAttendance: 60, earlierAttendance: 80, noRecentAttendance: true, outstandingBalance: 120, membershipAgeDays: 200 })
    expect(r.factors.reduce((s, f) => s + f.points, 0)).toBe(r.score)
  })
})
