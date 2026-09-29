import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Check, Search } from 'lucide-react'
import { getAuditLog } from '../api/operations'
import { changePassword } from '../api/auth'
import { errorMessage, USE_MOCKS } from '../api/client'
import { passwordError } from '../utils/passwordPolicy'
import useAsync from '../hooks/useAsync'
import { getCurrentOrganization, renameCurrentOrganization } from '../api/organizations'
import { useOrganization } from '../context/OrganizationContext'
import { useAuth } from '../context/AuthContext'
import { ROLE_LABELS, normalizeRole } from '../utils/permissions'
import { Badge, Button, Card, CardHeader, EmptyState, Input, PageHeader, TableSkeleton, Tabs, useToast } from '../components/ui'
import { formatDate } from '../utils/format'

const plans = [
  { name: 'Starter', blurb: 'For small clubs', features: ['Athletes, teams and coaches', 'Memberships', 'Basic dashboard'] },
  { name: 'Professional', blurb: 'For growing organizations', features: ['Everything in Starter', 'Payments and facilities', 'Competitions and fixtures', 'Analytics, reports and notifications'] },
  { name: 'Enterprise', blurb: 'For large organizations', features: ['Everything in Professional', 'Multiple branches', 'Custom roles and API access', 'Advanced analytics and dedicated support'] },
]

function OrganizationTab() {
  const { push } = useToast()
  const { refresh } = useOrganization()
  const { data: org, status } = useAsync(getCurrentOrganization)
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { if (org) setName(org.name) }, [org])

  async function save(e) {
    e.preventDefault()
    if (!name.trim()) return setError('Organization name is required.')
    setSaving(true)
    try {
      await renameCurrentOrganization(name.trim())
      await refresh()
      push('Organization settings saved')
    } catch (e2) {
      setError(errorMessage(e2))
    } finally {
      setSaving(false)
    }
  }

  if (status === 'loading') return <TableSkeleton rows={3} />
  if (!org) return <Card><div className="p-6"><EmptyState title="No organization selected" description="Choose an organization from the top bar to edit its settings." /></div></Card>

  return (
    <Card>
      <CardHeader title="Organization" subtitle="Shown in the sidebar and on reports." />
      <form onSubmit={save} noValidate className="grid gap-4 p-5 sm:grid-cols-2">
        <Input label="Organization name" required value={name} onChange={(e) => { setName(e.target.value); setError('') }} error={error} />
        <div><p className="mb-1.5 text-sm font-medium text-gray-700">Plan</p><p className="flex items-center gap-2 py-2.5 text-sm text-gray-900"><Badge tone="blue">{org.plan}</Badge> <span className="text-xs text-gray-500">Status: {org.status}</span></p></div>
        <div className="flex items-end justify-end sm:col-span-2"><Button type="submit" loading={saving}>Save changes</Button></div>
      </form>
    </Card>
  )
}

function ProfileTab() {
  const { user } = useAuth()
  const { push } = useToast()
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' })
  const [errors, setErrors] = useState({})
  const set = (k) => (e) => setPw((s) => ({ ...s, [k]: e.target.value }))
  const [saving, setSaving] = useState(false)
  async function change(e) {
    e.preventDefault()
    const err = {}
    if (!pw.current) err.current = 'Enter your current password.'
    if (passwordError(pw.next, user?.username)) err.next = passwordError(pw.next, user?.username)
    else if (pw.next === pw.current) err.next = 'Choose a password different from the current one.'
    if (pw.confirm !== pw.next) err.confirm = 'Passwords do not match.'
    setErrors(err)
    if (Object.keys(err).length) return
    if (USE_MOCKS) { push('Password updated (demo: not sent to the server)'); setPw({ current: '', next: '', confirm: '' }); return }
    setSaving(true)
    try {
      await changePassword(pw.current, pw.next)
      push('Password updated')
      setPw({ current: '', next: '', confirm: '' })
    } catch (e2) {
      setErrors({ submit: errorMessage(e2) })
    } finally {
      setSaving(false)
    }
  }
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader title="My profile" />
        <dl className="space-y-3 p-5 text-sm">
          <div className="flex justify-between"><dt className="text-gray-500">Name</dt><dd className="font-medium text-gray-900">{user?.fullName || user?.username}</dd></div>
          <div className="flex justify-between"><dt className="text-gray-500">Username</dt><dd className="font-medium text-gray-900">{user?.username}</dd></div>
          <div className="flex justify-between"><dt className="text-gray-500">Role</dt><dd><Badge tone="blue">{ROLE_LABELS[normalizeRole(user?.role)]}</Badge></dd></div>
        </dl>
      </Card>
      <Card>
        <CardHeader title="Change password" />
        <form onSubmit={change} noValidate className="space-y-4 p-5">
          <Input label="Current password" type="password" required value={pw.current} onChange={set('current')} error={errors.current} autoComplete="current-password" />
          <Input label="New password" type="password" required value={pw.next} onChange={set('next')} error={errors.next} autoComplete="new-password" />
          <Input label="Confirm new password" type="password" required value={pw.confirm} onChange={set('confirm')} error={errors.confirm} autoComplete="new-password" />
          {errors.submit && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{errors.submit}</p>}
          <div className="flex justify-end"><Button type="submit" loading={saving}>Update password</Button></div>
        </form>
      </Card>
    </div>
  )
}

function PreferencesTab() {
  const { push } = useToast()
  const [prefs, setPrefs] = useState({ membership: true, payments: true, competitions: true, facilities: false, email: true })
  const rows = [['membership', 'Membership expiry alerts'], ['payments', 'Payment received or failed'], ['competitions', 'Competition reminders'], ['facilities', 'Facility booking updates'], ['email', 'Also send by email']]
  return (
    <Card>
      <CardHeader title="Notification preferences" />
      <ul className="divide-y divide-gray-100">
        {rows.map(([k, label]) => (
          <li key={k} className="flex items-center justify-between px-5 py-4">
            <span className="text-sm text-gray-800">{label}</span>
            <button role="switch" aria-checked={prefs[k]} aria-label={label}
              onClick={() => { setPrefs((p) => ({ ...p, [k]: !p[k] })); push('Preference updated') }}
              className={`relative h-6 w-11 rounded-full transition-colors ${prefs[k] ? 'bg-blue-600' : 'bg-gray-300'}`}>
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${prefs[k] ? 'left-[22px]' : 'left-0.5'}`} />
            </button>
          </li>
        ))}
      </ul>
    </Card>
  )
}

function SubscriptionTab() {
  const { organization } = useOrganization()
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((p) => {
          const current = p.name === organization?.plan
          return (
            <Card key={p.name} className={`p-5 ${current ? 'border-blue-300 ring-1 ring-blue-200' : ''}`}>
              <div className="flex items-center justify-between"><h3 className="text-base font-semibold text-gray-900">{p.name}</h3>{current && <Badge tone="blue">Current plan</Badge>}</div>
              <p className="mt-1 text-sm text-gray-500">{p.blurb}</p>
              <ul className="mt-4 space-y-2 text-sm text-gray-700">
                {p.features.map((f) => <li key={f} className="flex gap-2"><Check size={15} className="mt-0.5 shrink-0 text-emerald-500" /> {f}</li>)}
              </ul>
            </Card>
          )
        })}
      </div>
      <p className="text-xs text-gray-500">Plan tiers are illustrative. Pricing has not been researched or validated.</p>
    </div>
  )
}

function AuditTab() {
  const { data, status } = useAsync(getAuditLog)
  const [q, setQ] = useState('')
  const [kind, setKind] = useState('All')
  const auditLog = useMemo(() => data || [], [data])
  const kinds = ['All', ...new Set(auditLog.map((a) => a.kind))]
  const rows = useMemo(() => auditLog.filter((a) => (kind === 'All' || a.kind === kind) && `${a.actor} ${a.action} ${a.target}`.toLowerCase().includes(q.toLowerCase().trim())), [auditLog, q, kind])
  if (status === 'ready' && auditLog.length === 0) {
    return (
      <Card>
        <CardHeader title="Audit log" subtitle="Who changed what, and when." />
        <div className="p-6"><EmptyState title="Audit logging isn't enabled yet" description="The server doesn't record an audit trail yet. Entries will appear here once it does." /></div>
      </Card>
    )
  }
  return (
    <Card>
      <CardHeader title="Audit log" subtitle="Who changed what, and when." />
      <div className="flex flex-col gap-3 border-b border-gray-100 p-4 sm:flex-row">
        <div className="relative flex-1"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search audit log" placeholder="Search actions" className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none" /></div>
        <select value={kind} onChange={(e) => setKind(e.target.value)} aria-label="Filter by type" className="rounded-lg border border-gray-200 px-3 py-2 text-sm capitalize">{kinds.map((k) => <option key={k}>{k}</option>)}</select>
      </div>
      {rows.length === 0 ? <div className="p-6"><EmptyState title="No matching entries" description="Try changing your search or filter." /></div> : (
        <ul className="divide-y divide-gray-100">
          {rows.map((a) => (
            <li key={a.id} className="flex flex-col gap-1 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-gray-800">{a.text ? a.text : (<><span className="font-medium">{a.actor}</span> {a.action} <span className="font-medium">{a.target}</span></>)}</p>
              <p className="shrink-0 text-xs text-gray-500">{formatDate(a.time, { day: 'numeric', month: 'short' })}, {new Date(a.time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

function SettingsPage() {
  const { user, demoMode } = useAuth()
  const role = normalizeRole(user?.role)
  const isAdmin = role === 'Admin' || role === 'SuperAdmin'
  const [params, setParams] = useSearchParams()

  const tabs = [
    ...(isAdmin ? [{ value: 'organization', label: 'Organization' }] : []),
    { value: 'profile', label: 'Profile' },
    { value: 'notifications', label: 'Notifications' },
    ...(isAdmin ? [{ value: 'subscription', label: 'Subscription' }, { value: 'audit', label: 'Audit log' }] : []),
  ]
  const requested = params.get('tab')
  const tab = tabs.some((t) => t.value === requested) ? requested : tabs[0].value

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="System" title="Settings" description="Organization, account and subscription settings." />
      {demoMode && <p className="rounded-lg bg-amber-50 px-4 py-2 text-sm text-amber-800">Demo mode: changes on this page are not saved to a server.</p>}
      <Tabs tabs={tabs} value={tab} onChange={(t) => setParams({ tab: t })} />
      {tab === 'organization' && <OrganizationTab />}
      {tab === 'profile' && <ProfileTab />}
      {tab === 'notifications' && <PreferencesTab />}
      {tab === 'subscription' && <SubscriptionTab />}
      {tab === 'audit' && <AuditTab />}
    </div>
  )
}

export default SettingsPage
