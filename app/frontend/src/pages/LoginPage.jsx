import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Trophy, Users, BarChart3, CalendarCheck } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Button, Input, Modal } from '../components/ui'
import { canAccess, homeFor } from '../utils/permissions'
import { errorMessage } from '../api/client'

function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { login, user, sessionExpired } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from
  const [forgot, setForgot] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const signedIn = await login(username, password)
      navigate(from && canAccess(signedIn.role, from.split('?')[0]) ? from : homeFor(signedIn.role), { replace: true })
    } catch (e) {
      setError(e?.response?.status === 401 ? 'Invalid username or password. If you are sure they are right, your account may be deactivated.' : errorMessage(e, 'We could not sign you in. Please try again.'))
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
            {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <Button type="submit" loading={submitting} className="w-full">Sign In</Button>
            <button type="button" onClick={() => { setSent(false); setForgot(true) }} className="block w-full text-center text-sm font-medium text-blue-600 hover:text-blue-700">Forgot password?</button>
          </form>
        </div>
      </div>
      <Modal open={forgot} onClose={() => setForgot(false)} title="Reset your password"
        footer={<Button variant="secondary" onClick={() => setForgot(false)}>Close</Button>}>
        {sent ? (
          <p className="text-sm text-gray-600">If an account exists for that email, reset instructions will be sent. (Password reset is not connected to the backend yet.)</p>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); setSent(true) }} className="space-y-4">
            <Input label="Email" type="email" required autoComplete="email" />
            <Button type="submit">Send reset link</Button>
          </form>
        )}
      </Modal>
    </div>
  )
}

export default LoginPage
