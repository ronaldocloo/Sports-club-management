import { useEffect, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Trophy, Users, BarChart3, CalendarCheck } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Button, Input, Modal } from '../components/ui'
import { canAccess, homeFor } from '../utils/permissions'
import { errorMessage } from '../api/client'
import { forgotPassword, getCapabilities } from '../api/auth'

function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [needCode, setNeedCode] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { login, user, sessionExpired } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from
  const [forgot, setForgot] = useState(false)
  const [sent, setSent] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetBusy, setResetBusy] = useState(false)
  const [resetError, setResetError] = useState('')
  const [canReset, setCanReset] = useState(null)

  // Only offer email reset if the server can actually send it.
  useEffect(() => { if (forgot && canReset === null) getCapabilities().then((c) => setCanReset(!!c.passwordResetByEmail)) }, [forgot, canReset])

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const signedIn = needCode ? await login(username, password, code.trim()) : await login(username, password)
      navigate(from && canAccess(signedIn.role, from.split('?')[0]) ? from : homeFor(signedIn.role), { replace: true })
    } catch (e) {
      if (e?.response?.data?.error === 'MFA_REQUIRED') { setNeedCode(true); setError(''); return }
      if (needCode && e?.response?.status === 401) { setError('That code was not accepted. Use the current code from your authenticator app, or one of your recovery codes.'); return }
      setError(e?.response?.status === 401 ? 'Invalid username or password. After several wrong attempts an account is locked for 15 minutes, and deactivated accounts cannot sign in.' : errorMessage(e, 'We could not sign you in. Please try again.'))
    } finally {
      setSubmitting(false)
    }
  }

  const points = [
    { icon: Users, text: 'Manage athletes and teams' },
    { icon: CalendarCheck, text: 'Schedule competitions and facilities' },
    { icon: BarChart3, text: 'Track payments and performance' },
  ]

  if (user && !submitting) return <Navigate to={from || homeFor(user.role)} replace />

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 p-12 text-white lg:flex">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/15"><Trophy size={20} /></div>
          <span className="text-lg font-bold">Sports Club</span>
        </div>
        <div>
          <h1 className="text-4xl font-bold leading-tight">The operating system<br />for modern sports organizations.</h1>
          <ul className="mt-8 space-y-4">
            {points.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-blue-50">
                <Icon size={18} /> {text}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-sm text-blue-100">© 2026 Sports Platform</p>
      </div>

      <div className="flex items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-sm">
          <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
          <p className="mt-1 text-sm text-gray-500">Sign in to your organization</p>
          {sessionExpired && !error && (
            <p role="status" className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">Your session has ended. Please sign in again.</p>
          )}
          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <Input label="Username" required value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" />
            <Input label="Password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
            {needCode && (
              <Input label="Authentication code" required value={code} onChange={(e) => setCode(e.target.value)} autoComplete="one-time-code" inputMode="numeric" autoFocus
                hint="The 6-digit code from your authenticator app. Lost your phone? Enter one of your recovery codes instead." />
            )}
            {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <Button type="submit" loading={submitting} className="w-full">Sign In</Button>
            <button type="button" onClick={() => { setSent(false); setForgot(true) }} className="block w-full text-center text-sm font-medium text-blue-600 hover:text-blue-700">Forgot password?</button>
          </form>
        </div>
      </div>
      <Modal open={forgot} onClose={() => setForgot(false)} title="Reset your password"
        footer={<Button variant="secondary" onClick={() => setForgot(false)}>Close</Button>}>
        {canReset === false ? (
          <p className="text-sm text-gray-600">This server is not set up to send email, so passwords cannot be reset from here. Ask an administrator of your organization to set a new password for you.</p>
        ) : sent ? (
          <p role="status" className="text-sm text-gray-600">If that address belongs to an account, a reset link is on its way. It works once and expires in an hour.</p>
        ) : (
          <form onSubmit={async (e) => {
            e.preventDefault()
            setResetBusy(true); setResetError('')
            try { await forgotPassword(resetEmail.trim()); setSent(true) } catch (err) { setResetError(errorMessage(err, "We couldn't send that request. Please try again.")) } finally { setResetBusy(false) }
          }} className="space-y-4">
            <Input label="Email" type="email" required autoComplete="email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} hint="The email address saved on your account." />
            {resetError && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{resetError}</p>}
            <Button type="submit" loading={resetBusy} disabled={canReset === null}>Send reset link</Button>
          </form>
        )}
      </Modal>
    </div>
  )
}

export default LoginPage
