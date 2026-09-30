import { describe, expect, it } from 'vitest'
import { canAccess, homeFor, normalizeRole, roleAccess, ROLE_LABELS } from '../permissions'

describe('normalizeRole', () => {
  it.each([['admin', 'Admin'], ['FRONT DESK', 'FrontDesk'], ['front_desk', 'FrontDesk'], ['super-admin', 'SuperAdmin'], ['Coach', 'Coach'], ['athlete', 'Athlete']])('%s -> %s', (input, expected) => {
    expect(normalizeRole(input)).toBe(expected)
  })
  it('falls back to Admin only for an empty role, and for unknown text', () => {
    expect(normalizeRole(undefined)).toBe('Admin')
    expect(normalizeRole('wizard')).toBe('Admin')
  })
})

describe('canAccess', () => {
  it('lets the club admin into every operational module but not organizations', () => {
    for (const p of ['/', '/athletes', '/payments', '/analytics', '/intelligence', '/reports', '/users']) expect(canAccess('Admin', p)).toBe(true)
    expect(canAccess('Admin', '/organizations')).toBe(false)
  })
  it('only the super admin manages organizations', () => {
    expect(canAccess('SuperAdmin', '/organizations')).toBe(true)
    for (const r of ['Admin', 'Coach', 'FrontDesk', 'Athlete']) expect(canAccess(r, '/organizations')).toBe(false)
  })
  it('a coach cannot see money, memberships, users or intelligence', () => {
    for (const p of ['/payments', '/memberships', '/users', '/intelligence', '/analytics', '/facilities']) expect(canAccess('Coach', p)).toBe(false)
    for (const p of ['/athletes', '/teams', '/attendance', '/reports']) expect(canAccess('Coach', p)).toBe(true)
  })
  it('front desk handles payments and memberships but not teams, coaches or users', () => {
    for (const p of ['/payments', '/memberships', '/bookings', '/intelligence']) expect(canAccess('FrontDesk', p)).toBe(true)
    for (const p of ['/teams', '/coaches', '/users', '/attendance']) expect(canAccess('FrontDesk', p)).toBe(false)
  })
  it('an athlete reaches only their own space', () => {
    expect(canAccess('Athlete', '/me')).toBe(true)
    for (const p of ['/', '/athletes', '/payments', '/reports', '/users']) expect(canAccess('Athlete', p)).toBe(false)
  })
  it('matches on the first path segment so detail pages inherit access', () => {
    expect(canAccess('Coach', '/athletes/42')).toBe(true)
    expect(canAccess('Coach', '/payments/42')).toBe(false)
  })
  it('every role only lists modules that exist', () => {
    const known = new Set(Object.values(roleAccess).flat())
    for (const list of Object.values(roleAccess)) for (const p of list) expect(known.has(p)).toBe(true)
    expect(Object.keys(roleAccess).sort()).toEqual(Object.keys(ROLE_LABELS).sort())
  })
})

describe('homeFor', () => {
  it('sends each role to a page it may open', () => {
    for (const role of Object.keys(ROLE_LABELS)) expect(canAccess(role, homeFor(role))).toBe(true)
    expect(homeFor('Athlete')).toBe('/me')
    expect(homeFor('SuperAdmin')).toBe('/organizations')
  })
})
