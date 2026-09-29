import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trophy, Users, BarChart3, CalendarCheck } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Button, Input } from '../components/ui'

function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await login(username, password)
      navigate('/')
    } catch {
      setError('Invalid username or password. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const points = [
    { icon: Users, text: 'Manage athletes and teams' },
    { icon: CalendarCheck, text: 'Schedule competitions and facilities' },
    { icon: BarChart3, text: 'Track payments and performance' },
  ]

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
          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <Input label="Username" required value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" />
            <Input label="Password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
            {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <Button type="submit" loading={submitting} className="w-full">Sign In</Button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
