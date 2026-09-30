import { useState } from 'react'
import QRCode from 'qrcode'
import { Copy, ShieldCheck } from 'lucide-react'
import { confirmTwoStep, setOwnEmail, startTwoStep, stopTwoStep } from '../../api/auth'
import { errorMessage } from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import { Badge, Button, Card, CardHeader, Input, useToast } from '../ui'

// The address password-reset links are sent to.
export function EmailCard() {
  const { user, refreshUser } = useAuth()
  const { push } = useToast()
  const [email, setEmail] = useState(user?.email || '')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function save(e) {
    e.preventDefault()
    if (email && !/^\S+@\S+\.\S+$/.test(email)) return setError('Enter a valid email address.')
    setSaving(true)
    try {
      await setOwnEmail(email.trim())
      await refreshUser()
      push(email.trim() ? 'Email saved' : 'Email removed')
    } catch (e2) {
      setError(errorMessage(e2, "We couldn't save your email."))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader title="Email address" subtitle="Used only to send you a link if you forget your password." />
      <form onSubmit={save} noValidate className="space-y-4 p-5">
        <Input label="Email" type="email" value={email} onChange={(e) => { setEmail(e.target.value); setError('') }} error={error} autoComplete="email" />
        <div className="flex justify-end"><Button type="submit" loading={saving}>Save email</Button></div>
      </form>
    </Card>
  )
}

// Turn two-step sign-in (an authenticator app) on or off.
export function TwoStepCard() {
  const { user, refreshUser } = useAuth()
  const { push } = useToast()
  const on = !!user?.mfaEnabled
  const [setup, setSetup] = useState(null)          // { secret, qr }
  const [code, setCode] = useState('')
  const [recovery, setRecovery] = useState(null)    // shown once, right after turning it on
  const [disabling, setDisabling] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function begin() {
    setBusy(true); setError('')
    try {
      const { secret, otpauthUri } = await startTwoStep()
      setSetup({ secret, qr: await QRCode.toDataURL(otpauthUri, { margin: 1, width: 200 }) })
    } catch (e) {
      setError(errorMessage(e, "We couldn't start setup."))
    } finally { setBusy(false) }
  }

  async function confirm(e) {
    e.preventDefault()
    setBusy(true); setError('')
    try {
      setRecovery(await confirmTwoStep(code.trim()))
      setSetup(null); setCode('')
      await refreshUser()
    } catch (e2) {
      setError(errorMessage(e2, 'That code was not accepted.'))
    } finally { setBusy(false) }
  }

  async function turnOff(e) {
    e.preventDefault()
    setBusy(true); setError('')
    try {
      await stopTwoStep(password, code.trim())
      setDisabling(false); setPassword(''); setCode('')
      await refreshUser()
      push('Two-step sign-in is off')
    } catch (e2) {
      setError(errorMessage(e2, "We couldn't turn it off."))
    } finally { setBusy(false) }
  }

  const copy = async (text) => { try { await navigator.clipboard.writeText(text); push('Copied') } catch { /* clipboard unavailable */ } }

  return (
    <Card>
      <CardHeader title="Two-step sign-in" subtitle="Ask for a code from an authenticator app as well as your password."
        action={<Badge tone={on ? 'green' : 'gray'}>{on ? 'On' : 'Off'}</Badge>} />
      <div className="space-y-4 p-5 text-sm">
        {recovery && (
          <div role="status" className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <p className="font-semibold text-amber-900">Save your recovery codes now</p>
            <p className="mt-1 text-amber-800">Each works once if you lose your phone. They will not be shown again.</p>
            <ul className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1 font-mono text-sm text-gray-900">{recovery.map((c) => <li key={c}>{c}</li>)}</ul>
            <div className="mt-3 flex gap-2">
              <Button size="sm" variant="secondary" icon={Copy} onClick={() => copy(recovery.join('\n'))}>Copy</Button>
              <Button size="sm" onClick={() => setRecovery(null)}>I have saved them</Button>
            </div>
          </div>
        )}

        {!on && !setup && !recovery && (
          <div className="flex items-center justify-between gap-4">
            <p className="text-gray-600">Protects your account even if someone learns your password.</p>
            <Button icon={ShieldCheck} onClick={begin} loading={busy} className="shrink-0 whitespace-nowrap">Set up</Button>
          </div>
        )}

        {setup && (
          <form onSubmit={confirm} noValidate className="space-y-4">
            <ol className="list-decimal space-y-1 pl-5 text-gray-700">
              <li>Open an authenticator app (Google Authenticator, Microsoft Authenticator, 1Password…).</li>
              <li>Scan this code, or enter the key by hand.</li>
              <li>Type the 6-digit code it shows.</li>
            </ol>
            <div className="flex flex-wrap items-center gap-4">
              <img src={setup.qr} alt="QR code to add this account to an authenticator app" width={160} height={160} className="rounded-lg border border-gray-200" />
              <div className="min-w-0"><p className="text-xs text-gray-500">Key</p><p className="break-all font-mono text-sm text-gray-900">{setup.secret}</p></div>
            </div>
            <Input label="Code from the app" required value={code} onChange={(e) => { setCode(e.target.value); setError('') }} inputMode="numeric" autoComplete="one-time-code" error={error} />
            <div className="flex justify-end gap-2"><Button variant="secondary" type="button" onClick={() => { setSetup(null); setCode(''); setError('') }}>Cancel</Button><Button type="submit" loading={busy}>Turn on</Button></div>
          </form>
        )}

        {on && !disabling && !recovery && (
          <div className="flex items-center justify-between gap-4">
            <p className="text-gray-600">You will be asked for a code each time you sign in.</p>
            <Button variant="secondary" className="shrink-0 whitespace-nowrap" onClick={() => { setDisabling(true); setError('') }}>Turn off</Button>
          </div>
        )}

        {on && disabling && (
          <form onSubmit={turnOff} noValidate className="space-y-4">
            <Input label="Password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
            <Input label="Current code (or a recovery code)" required value={code} onChange={(e) => setCode(e.target.value)} autoComplete="one-time-code" error={error} />
            <div className="flex justify-end gap-2"><Button variant="secondary" type="button" onClick={() => { setDisabling(false); setError('') }}>Cancel</Button><Button variant="danger" type="submit" loading={busy}>Turn off</Button></div>
          </form>
        )}
        {error && !setup && !disabling && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-red-700">{error}</p>}
      </div>
    </Card>
  )
}
