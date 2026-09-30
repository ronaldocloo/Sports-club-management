import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import Sidebar from '../layout/Sidebar'
import { renderInRouter, authValue } from '../../test/render'

let auth
vi.mock('../../context/AuthContext', () => ({ useAuth: () => auth }))
vi.mock('../../context/OrganizationContext', () => ({ useOrganization: () => ({ organization: { name: 'Test FC' } }) }))

const linksFor = (role) => {
  auth = authValue({ user: { role, username: 'u' } })
  renderInRouter(<Sidebar mobileOpen onClose={() => {}} />)
  return screen.getAllByRole('link').map((a) => a.textContent.trim()).filter(Boolean)
}

describe('Sidebar role filtering', () => {
  it('coach sees teaching pages and no money pages', () => {
    const links = linksFor('Coach')
    expect(links).toEqual(expect.arrayContaining(['Athletes', 'Teams', 'Attendance', 'Reports']))
    for (const hidden of ['Payments', 'Memberships', 'Users', 'Intelligence', 'Organizations']) expect(links).not.toContain(hidden)
  })
  it('front desk sees payments but not coaches or users', () => {
    const links = linksFor('FrontDesk')
    expect(links).toEqual(expect.arrayContaining(['Payments', 'Memberships', 'Bookings']))
    for (const hidden of ['Coaches', 'Users', 'Teams']) expect(links).not.toContain(hidden)
  })
  it('athlete sees only their own pages', () => {
    const links = linksFor('Athlete')
    expect(links).toContain('My Profile')
    for (const hidden of ['Athletes', 'Payments', 'Analytics', 'Users']) expect(links).not.toContain(hidden)
  })
  it('only the super admin sees Organizations', () => {
    expect(linksFor('SuperAdmin')).toContain('Organizations')
  })
  it('the club admin sees analytics and intelligence', () => {
    expect(linksFor('Admin')).toEqual(expect.arrayContaining(['Analytics', 'Intelligence', 'Users']))
  })
})
