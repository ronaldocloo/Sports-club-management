import { describe, expect, it } from 'vitest'
import { athletesOf, directoryOf, membershipKey, profileOf, slotFromLabel, slotLabel } from '../realData'

const day = (n) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10)

const raw = {
  sports: [{ sportId: 1, sportName: 'Football' }],
  coaches: [{ coachId: 1, firstName: 'Ken', lastName: 'Coach' }],
  teams: [{ teamId: 1, teamName: 'Alpha FC', sportId: 1, coachId: 1 }],
  athletes: [
    { athleteId: 1, firstName: 'Ama', lastName: 'Mensah', dateOfBirth: '2004-05-06', gender: 'Female' },
    { athleteId: 2, firstName: 'Kofi', lastName: 'Boateng', dateOfBirth: '2001-01-01', gender: 'Male' },
    { athleteId: 3, firstName: 'Yaw', lastName: 'Free', dateOfBirth: '2000-01-01', gender: 'Male' },
  ],
  rosters: [
    { teamId: 1, athleteId: 1, position: 'Striker', isActive: true, dateJoined: '2025-01-01' },
    { teamId: 1, athleteId: 2, position: 'Keeper', isActive: false, dateJoined: '2024-01-01' },
  ],
  membershipTypes: [{ typeId: 1, typeName: 'Monthly' }],
  memberships: [
    { membershipId: 1, athleteId: 1, typeId: 1, startDate: day(-5), endDate: day(10), status: 'Active' },
    { membershipId: 2, athleteId: 2, typeId: 1, startDate: day(-100), endDate: day(-40), status: 'Active' },
  ],
  payments: [{ paymentId: 1, membershipId: 1, amount: 100, status: 'Completed' }, { paymentId: 2, membershipId: 2, amount: 100, status: 'Failed' }],
  teamCompetitions: [], competitions: [], facilities: [], bookings: [],
}

describe('membershipKey', () => {
  it('derives status from the end date and explicit status', () => {
    expect(membershipKey({ status: 'Active', endDate: day(90) })).toBe('Active')
    expect(membershipKey({ status: 'Active', endDate: day(10) })).toBe('Expiring')
    expect(membershipKey({ status: 'Active', endDate: day(-1) })).toBe('Expired')
    expect(membershipKey({ status: 'Suspended', endDate: day(90) })).toBe('Suspended')
    expect(membershipKey({ status: 'Expired', endDate: day(90) })).toBe('Expired')
  })
})

describe('athlete joins', () => {
  it('attaches team, sport and position from the roster', () => {
    const a = athletesOf(raw).find((x) => x.athleteId === 1)
    expect(a).toMatchObject({ teamName: 'Alpha FC', sport: 'Football', position: 'Striker', rosterActive: true })
  })
  it('an athlete on no roster has no team but is still listed', () => {
    const a = athletesOf(raw).find((x) => x.athleteId === 3)
    expect(a).toMatchObject({ teamId: null, teamName: null, sport: null })
  })
  it('the directory shows membership state and marks inactive roster spots', () => {
    const d = directoryOf(raw)
    expect(d.find((x) => x.athleteId === 1)).toMatchObject({ name: 'Ama Mensah', membership: 'Expiring', status: 'Active', hasRoster: true })
    expect(d.find((x) => x.athleteId === 2)).toMatchObject({ membership: 'Expired', status: 'Inactive' })
    expect(d.find((x) => x.athleteId === 3)).toMatchObject({ membership: null, hasRoster: false })
  })
  it('calculates age from the date of birth', () => {
    const age = directoryOf(raw).find((x) => x.athleteId === 1).age
    expect(age).toBeGreaterThanOrEqual(21)
  })
})

describe('profileOf', () => {
  it('joins coach, membership and payment state', () => {
    const p = profileOf(raw, 1)
    expect(p.coachName).toBe('Ken Coach')
    expect(p.membership).toMatchObject({ type: 'Monthly', payment: 'Paid' })
  })
  it('a membership with no completed or pending payment is overdue', () => {
    expect(profileOf(raw, 2).membership.payment).toBe('Overdue')
  })
  it('unassigned athletes say so, and unknown ids give null', () => {
    expect(profileOf(raw, 3)).toMatchObject({ teamName: 'Unassigned', coachName: 'Unassigned', membership: null })
    expect(profileOf(raw, 999)).toBeNull()
  })
})

describe('booking slots', () => {
  it('labels and parses slots both ways', () => {
    expect(slotLabel('SLOT_08_10')).toBe('08:00')
    expect(slotFromLabel('08:00')).toBe('SLOT_08_10')
    expect(slotFromLabel('06:00')).toBe('SLOT_06_08')
    expect(slotFromLabel(slotLabel('SLOT_20_22'))).toBe('SLOT_20_22')
  })
})
