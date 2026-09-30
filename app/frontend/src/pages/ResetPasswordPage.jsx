import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { KeyRound } from 'lucide-react'
import { resetPassword } from '../api/auth'
import { errorMessage } from '../api/client'
import { passwordError } from '../utils/passwordPolicy'
import { Button, Input } from '../components/ui'

// Opened from the link in the reset email: /reset-password?token=...
function ResetPasswordPage() {
  const [params] = useSearchParams()
  const token = params.get('token') || ''
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)

  async function submit(e) {
    e.preventDefault()
    const err = {}
    if (passwordError(password)) err.password = passwordError(password)
    if (confirm !== password) err.confirm = 'Passwords do not match.'
    setErrors(err)
    if (Object.keys(err).length) return
    setSaving(true)
    try {
      await resetPassword(token, password)
      setDone(true)
    } catch (e2) {
      setErrors({ submit: errorMessage(e2, "We couldn't reset your password. Please ask for a new link.") })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-6 py-12">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-100">
        <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><KeyRound size={20} /></div>
        {done ? (
          <>
            <h1 className="text-2xl font-bold text-gray-900">Password changed</h1>
            <p role="status" className="mt-2 text-sm text-gray-600">You can now sign in with your new password. You have been signed out everywhere else.</p>
            <Link to="/login" className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700">Go to sign in</Link>
          </>
        ) : !token ? (
          <>
            <h1 className="text-2xl font-bold text-gray-900">This link is incomplete</h1>
            <p className="mt-2 text-sm text-gray-600">Open the full link from your email, or ask for a new one from the sign-in page.</p>
            <Link to="/login" className="mt-6 block text-center text-sm font-medium text-blue-600 hover:text-blue-700">Back to sign in</Link>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-gray-900">Choose a new password</h1>
            <p className="mt-1 text-sm text-gray-500">At least 8 characters, with a letter and a number.</p>
            <form onSubmit={submit} noValidate className="mt-6 space-y-4">
              <Input label="New password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password} autoComplete="new-password" />
              <Input label="Confirm new password" type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} error={errors.confirm} autoComplete="new-password" />
              {errors.submit && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{errors.submit}</p>}
              <Button type="submit" loading={saving} className="w-full">Set new password</Button>
            </form>
            <Link to="/login" className="mt-4 block text-center text-sm font-medium text-blue-600 hover:text-blue-700">Back to sign in</Link>
          </>
        )}
      </div>
    </div>
  )
}

export default ResetPasswordPage
