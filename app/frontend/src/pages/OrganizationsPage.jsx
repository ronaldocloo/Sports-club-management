import { useEffect, useState } from 'react'
import { Landmark, Plus } from 'lucide-react'
import { createOrganization, getOrganizations, updateOrganization } from '../api/organizations'
import { errorMessage } from '../api/client'
import { passwordError } from '../utils/passwordPolicy'
import { useOrganization } from '../context/OrganizationContext'
import useAsync from '../hooks/useAsync'
import { Badge, Button, Card, EmptyState, ErrorState, Input, Modal, PageHeader, RowMenu, Select, TableSkeleton, useToast } from '../components/ui'
import { formatDate } from '../utils/format'

const statusTone = { Active: 'green', Trial: 'amber', Suspended: 'red' }
const plans = ['Starter', 'Professional', 'Enterprise']

function OrgModal({ open, onClose, onSave }) {
  const empty = { name: '', plan: 'Starter', adminUsername: '', adminPassword: '' }
  const [v, setV] = useState(empty)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const set = (k) => (e) => setV((s) => ({ ...s, [k]: e.target.value }))
  const close = () => { setV(empty); setErrors({}); onClose() }

  async function submit(e) {
    e.preventDefault()
    const err = {}
    if (!v.name.trim()) err.name = 'Organization name is required.'
    if (!/^[a-z0-9._-]{3,}$/i.test(v.adminUsername)) err.adminUsername = 'Use at least 3 letters, numbers, dots or dashes.'
    if (passwordError(v.adminPassword, v.adminUsername)) err.adminPassword = passwordError(v.adminPassword, v.adminUsername)
    setErrors(err)
    if (Object.keys(err).length) return
    setSaving(true)
    try {
      await onSave({ ...v, name: v.name.trim() })
      close()
    } catch (e2) {
      setErrors({ submit: errorMessage(e2, "We couldn't create this organization.") })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={close} title="New organization"
      footer={<><Button variant="secondary" onClick={close}>Cancel</Button><Button type="submit" form="org-form" loading={saving}>Create Organization</Button></>}>
      <form id="org-form" onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2"><Input label="Organization name" required value={v.name} onChange={set('name')} error={errors.name} /></div>
        <div className="sm:col-span-2"><Select label="Plan" options={plans} value={v.plan} onChange={set('plan')} /></div>
        <p className="text-xs text-gray-500 sm:col-span-2">This creates the organization's first administrator, who can then add the rest of the team.</p>
        <Input label="Admin username" required value={v.adminUsername} onChange={set('adminUsername')} error={errors.adminUsername} autoComplete="off" />
        <Input label="Admin password" required type="password" value={v.adminPassword} onChange={set('adminPassword')} error={errors.adminPassword} autoComplete="new-password" />
        {errors.submit && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 sm:col-span-2">{errors.submit}</p>}
      </form>
    </Modal>
  )
}

function RenameModal({ org, onClose, onSave }) {
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const current = org?.name || ''
  const value = name
  useEffect(() => { if (org) { setName(org.name); setError('') } }, [org])

  async function submit(e) {
    e.preventDefault()
    const trimmed = value.trim()
    if (!trimmed) { setError('Organization name is required.'); return }
    if (trimmed === current) { onClose(); return }
    setSaving(true)
    try {
      await onSave(org, trimmed)
      setName(''); setError(''); onClose()
    } catch (e2) {
      setError(errorMessage(e2, "We couldn't rename this organization."))
    } finally {
      setSaving(false)
    }
  }

  const close = () => { setName(''); setError(''); onClose() }
  return (
    <Modal open={!!org} onClose={close} title="Rename organization"
      footer={<><Button variant="secondary" onClick={close}>Cancel</Button><Button type="submit" form="rename-org-form" loading={saving}>Save name</Button></>}>
      <form id="rename-org-form" onSubmit={submit} noValidate>
        <Input label="Organization name" required value={value} onChange={(e) => setName(e.target.value)} error={error} maxLength={100} />
      </form>
    </Modal>
  )
}

function OrganizationsPage() {
  const { data, setData, status, reload } = useAsync(getOrganizations)
  const { activeId, switchTo } = useOrganization()
  const [open, setOpen] = useState(false)
  const [renaming, setRenaming] = useState(null)
  const { push } = useToast()

  async function add(values) {
    const created = await createOrganization(values)
    setData((l) => [...(l || []), created])
    setOpen(false)
    push(`${created.name} created`)
  }

  async function rename(org, name) {
    const updated = await updateOrganization(org, { name })
    setData((l) => l.map((o) => (o.organizationId === org.organizationId ? { ...o, ...updated, name } : o)))
    push(`Renamed to ${name}`)
  }

  async function change(org, changes, message) {
    try {
      const updated = await updateOrganization(org, changes)
      setData((l) => l.map((o) => (o.organizationId === org.organizationId ? { ...o, ...updated } : o)))
      push(message)
    } catch (e) {
      push(errorMessage(e), 'error')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Platform" title="Organizations" description="Every club, academy and federation on the platform. Each one only sees its own data."
        actions={<Button icon={Plus} onClick={() => setOpen(true)}>New Organization</Button>} />

      {status === 'loading' && <TableSkeleton />}
      {status === 'error' && <ErrorState title="Couldn't load organizations" onRetry={reload} />}

      {status === 'ready' && (
        data.length === 0 ? (
          <EmptyState icon={Landmark} title="No organizations yet" description="Create the first organization to get started." action={<Button icon={Plus} onClick={() => setOpen(true)}>New Organization</Button>} />
        ) : (
          <Card className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>{['Organization', 'Plan', 'Status', 'Athletes', 'Users', 'Created', ''].map((h) => <th key={h} className="px-5 py-3 font-medium">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.map((o) => (
                  <tr key={o.organizationId} className="hover:bg-gray-50">
                    <td className="px-5 py-3"><p className="font-medium text-gray-900">{o.name}</p><p className="text-xs text-gray-500">{o.slug}</p></td>
                    <td className="px-5 py-3 text-gray-700">{o.plan}</td>
                    <td className="px-5 py-3"><Badge tone={statusTone[o.status]}>{o.status}</Badge></td>
                    <td className="px-5 py-3 text-gray-700">{o.athleteCount}</td>
                    <td className="px-5 py-3 text-gray-700">{o.userCount}</td>
                    <td className="px-5 py-3 text-gray-700">{o.createdAt ? formatDate(o.createdAt) : '—'}</td>
                    <td className="px-5 py-3 text-right">
                      <span className="inline-flex items-center gap-2">
                        <Button size="sm" variant={String(activeId) === String(o.organizationId) ? 'secondary' : 'primary'} onClick={() => switchTo(o.organizationId)}>
                          {String(activeId) === String(o.organizationId) ? 'Open' : 'Enter'}
                        </Button>
                        <RowMenu label={`Actions for ${o.name}`} items={[
                          { label: 'Rename', onClick: () => setRenaming(o) },
                          ...plans.filter((p) => p !== o.plan).map((p) => ({ label: `Change plan to ${p}`, onClick: () => change(o, { plan: p }, `${o.name} moved to ${p}`) })),
                          { label: o.status === 'Suspended' ? 'Reactivate' : 'Suspend', danger: o.status !== 'Suspended', onClick: () => change(o, { status: o.status === 'Suspended' ? 'Active' : 'Suspended' }, o.status === 'Suspended' ? `${o.name} reactivated` : `${o.name} suspended`) },
                        ]} />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )
      )}
      <OrgModal open={open} onClose={() => setOpen(false)} onSave={add} />
      <RenameModal org={renaming} onClose={() => setRenaming(null)} onSave={rename} />
    </div>
  )
}

export default OrganizationsPage
