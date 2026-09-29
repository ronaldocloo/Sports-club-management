import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes, useLocation } from 'react-router-dom'
import RequireAuth from '../auth/RequireAuth'
import LoginPage from '../../pages/LoginPage'
import { renderInRouter, authValue } from '../../test/render'

let auth
vi.mock('../../context/AuthContext', () => ({ useAuth: () => auth }))

function Where() { const l = useLocation(); return <p>at {l.pathname}{l.state?.from ? ` (from ${l.state.from})` : ''}</p> }

describe('RequireAuth', () => {
  const tree = (
    <Routes>
      <Route path="/login" element={<Where />} />
      <Route path="/athletes" element={<RequireAuth><p>secret roster</p></RequireAuth>} />
    </Routes>
  )
  beforeEach(() => { auth = authValue() })

  it('sends a signed-out visitor to login and remembers where they were going', () => {
    renderInRouter(tree, { route: '/athletes?tab=2' })
    expect(screen.getByText('at /login (from /athletes?tab=2)')).toBeInTheDocument()
    expect(screen.queryByText('secret roster')).toBeNull()
  })
  it('shows a spinner, not the page, while the session is being checked', () => {
    auth = authValue({ loading: true })
    renderInRouter(tree, { route: '/athletes' })
    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument()
    expect(screen.queryByText('secret roster')).toBeNull()
  })
  it('lets a signed-in user through', () => {
    auth = authValue({ user: { username: 'a', role: 'Admin' } })
    renderInRouter(tree, { route: '/athletes' })
    expect(screen.getByText('secret roster')).toBeInTheDocument()
  })
})

describe('LoginPage', () => {
  beforeEach(() => { auth = authValue() })
  const page = () => renderInRouter(<Routes><Route path="/login" element={<LoginPage />} /><Route path="*" element={<Where />} /></Routes>, { route: '/login' })

  it('requires both fields and signs in with what was typed', async () => {
    auth.login.mockResolvedValue({ role: 'Admin' })
    page()
    await userEvent.type(screen.getByLabelText(/username/i), 'admin')
    await userEvent.type(screen.getByLabelText(/password/i), 'Secret123')
    await userEvent.click(screen.getByRole('button', { name: 'Sign In' }))
    expect(auth.login).toHaveBeenCalledWith('admin', 'Secret123')
    await waitFor(() => expect(screen.getByText('at /')).toBeInTheDocument())
  })
  it('a wrong password explains the lockout rule without saying which part was wrong', async () => {
    auth.login.mockRejectedValue({ response: { status: 401 } })
    page()
    await userEvent.type(screen.getByLabelText(/username/i), 'admin')
    await userEvent.type(screen.getByLabelText(/password/i), 'nope')
    await userEvent.click(screen.getByRole('button', { name: 'Sign In' }))
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Invalid username or password')
    expect(alert).toHaveTextContent('15 minutes')
  })
  it('too many requests shows the server message', async () => {
    auth.login.mockRejectedValue({ response: { status: 429, data: { message: 'Too many requests. Try again in 30 seconds.' } } })
    page()
    await userEvent.type(screen.getByLabelText(/username/i), 'x')
    await userEvent.type(screen.getByLabelText(/password/i), 'y')
    await userEvent.click(screen.getByRole('button', { name: 'Sign In' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Try again in 30 seconds')
  })
  it('tells the user when a session ended', () => {
    auth = authValue({ sessionExpired: true })
    page()
    expect(screen.getByRole('status')).toHaveTextContent('Your session has ended')
  })
  it('an athlete signing in lands on their own page, not the dashboard', async () => {
    auth.login.mockResolvedValue({ role: 'Athlete' })
    page()
    await userEvent.type(screen.getByLabelText(/username/i), 'kofi')
    await userEvent.type(screen.getByLabelText(/password/i), 'Secret123')
    await userEvent.click(screen.getByRole('button', { name: 'Sign In' }))
    await waitFor(() => expect(screen.getByText('at /me')).toBeInTheDocument())
  })
})
