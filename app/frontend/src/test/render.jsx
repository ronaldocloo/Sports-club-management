import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'

// The pieces of AuthContext the components read, so tests can pick who is signed in.
export function authValue(overrides = {}) {
  return { user: null, loading: false, sessionExpired: false, login: vi.fn(), logout: vi.fn(), demoMode: false, switchDemoRole: vi.fn(), ...overrides }
}

export function renderInRouter(ui, { route = '/', ...options } = {}) {
  return render(<MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>, options)
}
