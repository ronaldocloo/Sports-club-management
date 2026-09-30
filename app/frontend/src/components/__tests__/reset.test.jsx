import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ResetPasswordPage from '../../pages/ResetPasswordPage'
import { renderInRouter } from '../../test/render'
import * as authApi from '../../api/auth'

vi.mock('../../api/auth', () => ({ resetPassword: vi.fn() }))

describe('ResetPasswordPage', () => {
  beforeEach(() => vi.clearAllMocks())
  const open = (route = '/reset-password?token=abc123') => renderInRouter(<ResetPasswordPage />, { route })
  const submit = async (pw, confirm = pw) => {
    await userEvent.type(screen.getByLabelText(/^new password/i), pw)
    await userEvent.type(screen.getByLabelText(/confirm new password/i), confirm)
    await userEvent.click(screen.getByRole('button', { name: /set new password/i }))
  }

  it('explains when the link has no token', () => {
    open('/reset-password')
    expect(screen.getByText(/link is incomplete/i)).toBeInTheDocument()
    expect(screen.queryByLabelText(/new password/i)).toBeNull()
  })

  it('holds a weak password back before it reaches the server', async () => {
    open()
    await submit('password1')
    expect(screen.getByText(/too common/i)).toBeInTheDocument()
    expect(authApi.resetPassword).not.toHaveBeenCalled()
  })

  it('needs both boxes to match', async () => {
    open()
    await submit('Sunrise-2026-ok', 'Sunrise-2026-different')
    expect(screen.getByText('Passwords do not match.')).toBeInTheDocument()
    expect(authApi.resetPassword).not.toHaveBeenCalled()
  })

  it('sends the token from the link with the new password, then offers sign in', async () => {
    authApi.resetPassword.mockResolvedValue({})
    open()
    await submit('Sunrise-2026-ok')
    await waitFor(() => expect(authApi.resetPassword).toHaveBeenCalledWith('abc123', 'Sunrise-2026-ok'))
    expect(await screen.findByText('Password changed')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /go to sign in/i })).toHaveAttribute('href', '/login')
  })

  it('shows the server message for an expired link', async () => {
    authApi.resetPassword.mockRejectedValue({ response: { status: 400, data: { message: 'This reset link is invalid or has expired. Ask for a new one' } } })
    open()
    await submit('Sunrise-2026-ok')
    expect(await screen.findByRole('alert')).toHaveTextContent('invalid or has expired')
    expect(screen.queryByText('Password changed')).toBeNull()
  })
})
