import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AthleteForm from '../athletes/AthleteForm'
import CoachForm from '../coaches/CoachForm'

vi.mock('../../api/sports', () => ({ getSports: () => Promise.resolve([{ id: 1, name: 'Football' }, { id: 2, name: 'Basketball' }]) }))

const teams = [{ teamId: 1, teamName: 'Alpha FC', sport: 'Football' }, { teamId: 2, teamName: 'Hoops', sport: 'Basketball' }]

describe('AthleteForm', () => {
  let onSubmit, onClose
  beforeEach(() => { onSubmit = vi.fn().mockResolvedValue(); onClose = vi.fn() })
  const open = (props = {}) => render(<AthleteForm open teams={teams} onSubmit={onSubmit} onClose={onClose} {...props} />)

  it('does not submit an empty form and lists what is missing', async () => {
    open()
    await userEvent.click(screen.getByRole('button', { name: 'Add Athlete' }))
    expect(onSubmit).not.toHaveBeenCalled()
    for (const msg of ['First name is required.', 'Last name is required.', 'Date of birth is required.', 'Select a gender.', 'Phone number is required.']) {
      expect(screen.getByText(msg)).toBeInTheDocument()
    }
  })
  it('rejects a future birth date and a malformed email', async () => {
    open()
    await userEvent.type(screen.getByLabelText(/first name/i), 'Ama')
    await userEvent.type(screen.getByLabelText(/last name/i), 'Mensah')
    await userEvent.type(screen.getByLabelText(/date of birth/i), '2999-01-01')
    await userEvent.selectOptions(screen.getByLabelText(/gender/i), 'Female')
    await userEvent.type(screen.getByLabelText(/phone/i), '0244000000')
    await userEvent.type(screen.getByLabelText(/email/i), 'not-an-email')
    await userEvent.click(screen.getByRole('button', { name: 'Add Athlete' }))
    expect(screen.getByText('Date of birth must be in the past.')).toBeInTheDocument()
    expect(screen.getByText('Enter a valid email address.')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })
  it('submits a valid athlete with the chosen team, then closes', async () => {
    open()
    await userEvent.type(screen.getByLabelText(/first name/i), 'Ama')
    await userEvent.type(screen.getByLabelText(/last name/i), 'Mensah')
    await userEvent.type(screen.getByLabelText(/date of birth/i), '2004-05-06')
    await userEvent.selectOptions(screen.getByLabelText(/gender/i), 'Female')
    await userEvent.type(screen.getByLabelText(/phone/i), '0244000000')
    await userEvent.selectOptions(screen.getByLabelText(/^sport/i), 'Football')
    await userEvent.selectOptions(screen.getByLabelText(/^team/i), '1')
    await userEvent.click(screen.getByRole('button', { name: 'Add Athlete' }))
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    expect(onSubmit.mock.calls[0][0]).toMatchObject({ firstName: 'Ama', lastName: 'Mensah', dateOfBirth: '2004-05-06', gender: 'Female', teamId: 1, team: 'Alpha FC' })
    await waitFor(() => expect(onClose).toHaveBeenCalled())
  })
  it('only offers teams that play the chosen sport', async () => {
    open()
    await userEvent.selectOptions(screen.getByLabelText(/^sport/i), 'Basketball')
    const options = [...screen.getByLabelText(/^team/i).querySelectorAll('option')].map((o) => o.textContent)
    expect(options).toContain('Hoops')
    expect(options).not.toContain('Alpha FC')
  })
  it('shows the server message when saving fails and stays open', async () => {
    onSubmit.mockRejectedValue({ response: { status: 400, data: { message: 'Phone already in use' } } })
    open({ athlete: { firstName: 'Ama', lastName: 'Mensah', dateOfBirth: '2004-05-06', gender: 'Female', phone: '0244000000', sport: 'Football' } })
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Phone already in use')
    expect(onClose).not.toHaveBeenCalled()
  })
  it('editing pre-fills the form', () => {
    open({ athlete: { firstName: 'Kofi', lastName: 'Boateng', dateOfBirth: '2001-02-03', gender: 'Male', phone: '0200000000' } })
    expect(screen.getByLabelText(/first name/i)).toHaveValue('Kofi')
    expect(screen.getByRole('dialog', { name: 'Edit athlete' })).toBeInTheDocument()
  })
})

describe('CoachForm', () => {
  it('validates required fields, email format and experience range', async () => {
    const onSubmit = vi.fn()
    render(<CoachForm open onClose={() => {}} onSubmit={onSubmit} />)
    const submit = screen.getAllByRole('button').find((b) => /add coach|save|create/i.test(b.textContent))
    await userEvent.click(submit)
    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.getByText('First name is required.')).toBeInTheDocument()
    expect(screen.getByText('Please select a sport.')).toBeInTheDocument()
    expect(screen.getByText('Email is required.')).toBeInTheDocument()
    await userEvent.type(screen.getByLabelText(/email/i), 'bad')
    await userEvent.type(screen.getByLabelText(/experience/i), '99')
    await userEvent.click(submit)
    expect(screen.getByText('Enter a valid email address.')).toBeInTheDocument()
    expect(screen.getByText('Enter a value between 0 and 60.')).toBeInTheDocument()
  })
  it('loads the organization\'s sports into the sport list', async () => {
    render(<CoachForm open onClose={() => {}} onSubmit={() => {}} />)
    expect(await screen.findByRole('option', { name: 'Basketball' })).toBeInTheDocument()
  })
})
