import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TwoStepCard } from '../settings/SecurityCards'
import { authValue } from '../../test/render'
import * as authApi from '../../api/auth'

let auth
vi.mock('../../context/AuthContext', () => ({ useAuth: () => auth }))
vi.mock('../ui/Toast', async (orig) => ({ ...(await orig()), useToast: () => ({ push: vi.fn() }) }))
vi.mock('qrcode', () => ({ default: { toDataURL: vi.fn().mockResolvedValue('data:image/png;base64,AAAA') } }))
vi.mock('../../api/auth', () => ({ startTwoStep: vi.fn(), confirmTwoStep: vi.fn(), stopTwoStep: vi.fn(), setOwnEmail: vi.fn() }))

describe('TwoStepCard', () => {
  beforeEach(() => { vi.clearAllMocks(); auth = authValue({ user: { username: 'mia', mfaEnabled: false }, refreshUser: vi.fn() }) })

  it('walks through setup: key and QR, confirm with a code, then shows recovery codes once', async () => {
    authApi.startTwoStep.mockResolvedValue({ secret: 'ABCDEFGH', otpauthUri: 'otpauth://totp/x' })
    authApi.confirmTwoStep.mockResolvedValue(['AAAAA-BBBBB', 'CCCCC-DDDDD'])
    render(<TwoStepCard />)
    expect(screen.getByText('Off')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /set up/i }))
    expect(await screen.findByText('ABCDEFGH')).toBeInTheDocument()
    expect(screen.getByAltText(/qr code/i)).toHaveAttribute('src', expect.stringContaining('data:image/png'))
    await userEvent.type(screen.getByLabelText(/code from the app/i), '123456')
    await userEvent.click(screen.getByRole('button', { name: /turn on/i }))
    await waitFor(() => expect(authApi.confirmTwoStep).toHaveBeenCalledWith('123456'))
    expect(await screen.findByText('AAAAA-BBBBB')).toBeInTheDocument()
    expect(screen.getByText(/will not be shown again/i)).toBeInTheDocument()
    expect(auth.refreshUser).toHaveBeenCalled()
  })

  it('shows the server message when the confirmation code is wrong', async () => {
    authApi.startTwoStep.mockResolvedValue({ secret: 'ABCDEFGH', otpauthUri: 'otpauth://totp/x' })
    authApi.confirmTwoStep.mockRejectedValue({ response: { status: 400, data: { message: 'That code is not right. Check the time on your phone and try again' } } })
    render(<TwoStepCard />)
    await userEvent.click(screen.getByRole('button', { name: /set up/i }))
    await userEvent.type(await screen.findByLabelText(/code from the app/i), '000000')
    await userEvent.click(screen.getByRole('button', { name: /turn on/i }))
    expect(await screen.findByText(/check the time on your phone/i)).toBeInTheDocument()
  })

  it('turning it off asks for the password and a code', async () => {
    auth = authValue({ user: { username: 'mia', mfaEnabled: true }, refreshUser: vi.fn() })
    authApi.stopTwoStep.mockResolvedValue()
    render(<TwoStepCard />)
    expect(screen.getByText('On')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /^turn off$/i }))
    await userEvent.type(screen.getByLabelText(/^password/i), 'Secret123')
    await userEvent.type(screen.getByLabelText(/current code/i), '654321')
    await userEvent.click(screen.getAllByRole('button', { name: /^turn off$/i }).at(-1))
    await waitFor(() => expect(authApi.stopTwoStep).toHaveBeenCalledWith('Secret123', '654321'))
  })
})
