import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import OrganizationsPage from '../../pages/OrganizationsPage'
import { renderInRouter } from '../../test/render'
import * as orgApi from '../../api/organizations'

vi.mock('../../api/organizations', () => ({ getOrganizations: vi.fn(), createOrganization: vi.fn(), updateOrganization: vi.fn() }))
vi.mock('../../context/OrganizationContext', () => ({ useOrganization: () => ({ activeId: null, switchTo: vi.fn() }) }))

const org = { organizationId: 7, name: 'Old Name', slug: 'old-name', plan: 'Starter', status: 'Active', athleteCount: 3, userCount: 2, createdAt: '2026-01-01T00:00:00' }

describe('Organizations page', () => {
  beforeEach(() => { vi.clearAllMocks(); orgApi.getOrganizations.mockResolvedValue([org]) })

  async function openRename() {
    renderInRouter(<OrganizationsPage />)
    await userEvent.click(await screen.findByRole('button', { name: 'Actions for Old Name' }))
    await userEvent.click(await screen.findByText('Rename'))
  }

  it('renames an organization from the row menu and shows the new name', async () => {
    orgApi.updateOrganization.mockResolvedValue({ ...org, name: 'New Name' })
    await openRename()
    const input = screen.getByLabelText(/organization name/i)
    expect(input).toHaveValue('Old Name')
    await userEvent.clear(input)
    await userEvent.type(input, '  New Name  ')
    await userEvent.click(screen.getByRole('button', { name: 'Save name' }))
    await waitFor(() => expect(orgApi.updateOrganization).toHaveBeenCalledWith(org, { name: 'New Name' }))
    expect(await screen.findByText('New Name')).toBeInTheDocument()
  })

  it('refuses an empty name without calling the server', async () => {
    await openRename()
    await userEvent.clear(screen.getByLabelText(/organization name/i))
    await userEvent.click(screen.getByRole('button', { name: 'Save name' }))
    expect(screen.getByText('Organization name is required.')).toBeInTheDocument()
    expect(orgApi.updateOrganization).not.toHaveBeenCalled()
  })

  it('shows the server message when the name is taken', async () => {
    orgApi.updateOrganization.mockRejectedValue({ response: { status: 400, data: { message: 'An organization with this name already exists' } } })
    await openRename()
    await userEvent.type(screen.getByLabelText(/organization name/i), ' 2')
    await userEvent.click(screen.getByRole('button', { name: 'Save name' }))
    expect(await screen.findByText(/already exists/i)).toBeInTheDocument()
  })
})
