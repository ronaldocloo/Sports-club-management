import { useEffect, useMemo, useState } from 'react'
import { Check, Minus, Plus, UserRound } from 'lucide-react'
import { createUser, getUsers, updateUser } from '../api/operations'
import { getAthletes } from '../api/athletes'
import { getCoaches } from '../api/coaches'
import { errorMessage, USE_MOCKS } from '../api/client'
import { passwordError } from '../utils/passwordPolicy'
import { useAuth } from '../context/AuthContext'
import { ROLE_LABELS, moduleList, roleAccess } from '../utils/permissions'
import useAsync from '../hooks/useAsync'
import { Avatar, Badge, Button, Card, CardHeader, ConfirmDialog, EmptyState, ErrorState, Input, Modal, PageHeader, RowMenu, SearchInput, Select, TableSkeleton, useToast } from '../components/ui'
import { formatDate } from '../utils/format'

const roleTone = { SuperAdmin: 'red', Admin: 'blue', Coach: 'green', FrontDesk: 'amber', Athlete: 'gray' }
const REAL_ROLES = ['Admin', 'Coach', 'FrontDesk', 'Athlete']

async function load() {
  const [users, coaches, athletes] = await Promise.all([getUsers(), getCoaches().catch(() => []), getAthletes().catch(() => [])])
  return { users, coaches, athletes }
}

// Coach / athlete link picker, shown for the roles that need a linked record.
function LinkField({ role, value, onChange, coaches, athletes, error }) {
  if (role === 'Coach') {
    return <Select label="Coach record" required options={coaches.map((c) => ({ value: String(c.coachId), label: `${c.firstName} ${c.lastName}` }))} placeholder="Link to a coach" value={value} onChange={onChange} error={error} />
  }
  if (role === 'Athlete') {
    return <Select label="Athlete record" required options={athletes.map((a) => ({ value: String(a.athleteId), label: `${a.firstName} ${a.lastName}` }))} placeholder="Link to an athlete" value={value} onChange={onChange} error={error} />
  }
  return null
}

function UserModal({ open, coaches, athletes, onClose, onSave }) {
  const empty = { name: '', username: '', email: '', password: '', role: '', link: '' }
  const [v, setV] = useState(empty)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const set = (k) => (e) => setV((s) => ({ ...s, [k]: e.target.value, ...(k === 'role' ? { link: '' } : {}) }))
  const close = () => { setV(empty); setErrors({}); onClose() }
  const roles = USE_MOCKS ? Object.keys(ROLE_LABELS) : REAL_ROLES

  async function submit(e) {
    e.preventDefault()
    const err = {}
    if (USE_MOCKS && !v.name.trim()) err.name = 'Full name is required.'
    if (!/^[a-z0-9._-]{3,}$/i.test(v.username)) err.username = 'Use at least 3 letters, numbers, dots or dashes.'
    if (USE_MOCKS && !/^\S+@\S+\.\S+$/.test(v.email)) err.email = 'Enter a valid email address.'
    if (!USE_MOCKS && passwordError(v.password, v.username)) err.password = passwordError(v.password, v.username)
    if (!v.role) err.role = 'Select a role.'
    if (!USE_MOCKS && (v.role === 'Coach' || v.role === 'Athlete') && !v.link) err.link = `Link this account to ${v.role === 'Athlete' ? 'an athlete' : 'a coach'} record.`
    setErrors(err)
    if (Object.keys(err).length) return
    setSaving(true)
    try {
      await onSave({ ...v, coachId: v.role === 'Coach' ? v.link : '', athleteId: v.role === 'Athlete' ? v.link : '' })
      close()
    } catch (e2) {
      setErrors({ submit: errorMessage(e2, "We couldn't create this user.") })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={close} title="Add user"
      footer={<><Button variant="secondary" onClick={close}>Cancel</Button><Button type="submit" form="user-form" loading={saving}>Add User</Button></>}>
      <form id="user-form" onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
        {USE_MOCKS && <Input label="Full name" required value={v.name} onChange={set('name')} error={errors.name} />}
        <Input label="Username" required value={v.username} onChange={set('username')} error={errors.username} autoComplete="off" />
        {USE_MOCKS && <div className="sm:col-span-2"><Input label="Email" required type="email" value={v.email} onChange={set('email')} error={errors.email} /></div>}
        {!USE_MOCKS && <div className="sm:col-span-2"><Input label="Password" required type="password" value={v.password} onChange={set('password')} error={errors.password} hint="At least 8 characters with a letter and a number. Share it securely; they can change it in Settings." autoComplete="new-password" /></div>}
        <div className="sm:col-span-2"><Select label="Role" required options={roles.map((value) => ({ value, label: ROLE_LABELS[value] }))} placeholder="Select role" value={v.role} onChange={set('role')} error={errors.role} /></div>
        {!USE_MOCKS && <div className="sm:col-span-2"><LinkField role={v.role} value={v.link} onChange={set('link')} coaches={coaches} athletes={athletes} error={errors.link} /></div>}
        {errors.submit && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 sm:col-span-2">{errors.submit}</p>}
      </form>
    </Modal>
  )
}

function EditRoleModal({ user, coaches, athletes, onClose, onSave }) {
  const [role, setRole] = useState('')
  const [link, setLink] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (user) { setRole(user.role); setLink(String(user.role === 'Coach' ? user.coachId ?? '' : user.role === 'Athlete' ? user.athleteId ?? '' : '')); setError('') }
  }, [user])

  async function submit(e) {
    e.preventDefault()
    if ((role === 'Coach' || role === 'Athlete') && !link) return setError(`Link this account to ${role === 'Athlete' ? 'an athlete' : 'a coach'} record.`)
    setSaving(true)
    try {
      await onSave(user, { role, coachId: role === 'Coach' ? link : null, athleteId: role === 'Athlete' ? link : null })
      onClose()
    } catch (e2) {
      setError(errorMessage(e2, "We couldn't update this user."))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={!!user} onClose={onClose} title={`Edit ${user?.username || 'user'}`}
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" form="edit-user-form" loading={saving}>Save changes</Button></>}>
      <form id="edit-user-form" onSubmit={submit} noValidate className="space-y-4">
        <p className="text-xs text-gray-500">Changing a role signs the user out of any open session.</p>
        <Select label="Role" required options={(USE_MOCKS ? Object.keys(ROLE_LABELS) : REAL_ROLES).map((value) => ({ value, label: ROLE_LABELS[value] }))} value={role} onChange={(e) => { setRole(e.target.value); setLink(''); setError('') }} />
        <LinkField role={role} value={link} onChange={(e) => { setLink(e.target.value); setError('') }} coaches={coaches} athletes={athletes} />
        {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      </form>
    </Modal>
  )
}

function ResetPasswordModal({ user, onClose, onSave }) {
  const [pw, setPw] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  useEffect(() => { if (user) { setPw(''); setError('') } }, [user])

  async function submit(e) {
    e.preventDefault()
    if (passwordError(pw, user?.username)) return setError(passwordError(pw, user?.username))
    setSaving(true)
    try {
      await onSave(user, { password: pw })
      onClose()
    } catch (e2) {
      setError(errorMessage(e2, "We couldn't reset this password."))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={!!user} onClose={onClose} title={`Reset password for ${user?.username || ''}`}
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" form="reset-form" loading={saving}>Reset password</Button></>}>
      <form id="reset-form" onSubmit={submit} noValidate className="space-y-4">
        <Input label="New password" required type="password" value={pw} onChange={(e) => { setPw(e.target.value); setError('') }} error={error} hint="Share it with the user securely. Open sessions are not affected." autoComplete="new-password" />
      </form>
    </Modal>
  )
}

function UsersPage() {
  const { data, setData, status, reload } = useAsync(load)
  const { user: me } = useAuth()
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [toggle, setToggle] = useState(null)
  const [editing, setEditing] = useState(null)
  const [resetting, setResetting] = useState(null)
  const { push } = useToast()

  const coaches = data?.coaches || []
  const athletes = data?.athletes || []
  const linkName = (u) => {
    if (u.role === 'Coach') { const c = coaches.find((x) => x.coachId === u.coachId); return c ? `${c.firstName} ${c.lastName}` : null }
    if (u.role === 'Athlete') { const a = athletes.find((x) => x.athleteId === u.athleteId); return a ? `${a.firstName} ${a.lastName}` : null }
    return null
  }

  const users = useMemo(() => (data?.users || []).filter((u) => `${u.name} ${u.username} ${u.email}`.toLowerCase().includes(search.toLowerCase().trim())), [data, search])
  const replace = (updated) => setData((d) => ({ ...d, users: d.users.map((u) => (u.id === updated.id ? updated : u)) }))

  async function add(v) {
    const created = await createUser(v)
    setData((d) => ({ ...d, users: [created, ...d.users] }))
    setOpen(false)
    push(`User ${v.username} added`)
  }

  async function save(user, changes) {
    replace(await updateUser(user, changes))
    push(changes.password ? `Password reset for ${user.username}` : `${user.username} updated`)
  }

  async function confirmToggle() {
    const target = toggle
    setToggle(null)
    try {
      replace(await updateUser(target, { active: !target.active }))
      push(`${target.username} ${target.active ? 'deactivated' : 'reactivated'}`)
    } catch (e) {
      push(errorMessage(e), 'error')
    }
  }

  const isMe = (u) => !USE_MOCKS && me?.username === u.username

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="System" title="Users" description="Accounts, roles and access for your organization."
        actions={<Button icon={Plus} onClick={() => setOpen(true)}>Add User</Button>} />

      {status === 'loading' && <TableSkeleton />}
      {status === 'error' && <ErrorState title="Couldn't load users" onRetry={reload} />}

      {status === 'ready' && (
        <>
          <Card>
            <div className="border-b border-gray-100 p-4"><div className="flex"><SearchInput value={search} onChange={setSearch} placeholder="Search users" label="Search users" /></div></div>
            {users.length === 0 ? (
              <div className="p-6"><EmptyState icon={UserRound} title="No users found" description="There are currently no users matching your search." /></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                    <tr>{['User', 'Role', 'Status', 'Last login', ''].map((h) => <th key={h} className="px-5 py-3 font-medium">{h}</th>)}</tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-gray-50">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar name={u.name} />
                            <div>
                              <p className="font-medium text-gray-900">{u.name}{isMe(u) && <span className="ml-2 text-xs font-normal text-gray-400">(you)</span>}</p>
                              <p className="text-xs text-gray-500">{[u.username !== u.name && u.username, u.email, linkName(u) && `Linked to ${linkName(u)}`].filter(Boolean).join(' · ') || 'Signs in with username'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3"><Badge tone={roleTone[u.role]}>{ROLE_LABELS[u.role]}</Badge></td>
                        <td className="px-5 py-3"><Badge tone={u.active ? 'green' : 'gray'}>{u.active ? 'Active' : 'Inactive'}</Badge></td>
                        <td className="px-5 py-3 text-gray-700">{u.lastLogin ? formatDate(u.lastLogin) : 'Never'}</td>
                        <td className="px-5 py-3 text-right">
                          <RowMenu label={`Actions for ${u.username}`} items={[
                            { label: 'Edit role', hidden: isMe(u), onClick: () => setEditing(u) },
                            { label: 'Reset password', hidden: USE_MOCKS, onClick: () => setResetting(u) },
                            { label: u.active ? 'Deactivate' : 'Reactivate', hidden: isMe(u), danger: u.active, onClick: () => setToggle(u) },
                          ]} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <Card>
            <CardHeader title="Roles and permissions" subtitle="Which sections each role can open. The backend enforces the actual permissions." />
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                  <tr><th className="px-5 py-3 text-left font-medium">Section</th>{(USE_MOCKS ? Object.values(ROLE_LABELS) : REAL_ROLES.map((r) => ROLE_LABELS[r])).map((l) => <th key={l} className="px-3 py-3 text-center font-medium">{l}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {moduleList.map((m) => (
                    <tr key={m}>
                      <td className="px-5 py-2.5 font-medium capitalize text-gray-800">{m}</td>
                      {(USE_MOCKS ? Object.keys(ROLE_LABELS) : REAL_ROLES).map((r) => (
                        <td key={r} className="px-3 py-2.5 text-center">
                          {roleAccess[r].includes('/' + m) ? <Check size={16} className="mx-auto text-emerald-600" aria-label="Allowed" /> : <Minus size={16} className="mx-auto text-gray-300" aria-label="Not allowed" />}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      <UserModal open={open} coaches={coaches} athletes={athletes} onClose={() => setOpen(false)} onSave={add} />
      <EditRoleModal user={editing} coaches={coaches} athletes={athletes} onClose={() => setEditing(null)} onSave={save} />
      <ResetPasswordModal user={resetting} onClose={() => setResetting(null)} onSave={save} />
      <ConfirmDialog open={!!toggle} danger={toggle?.active} title={toggle?.active ? 'Deactivate this user?' : 'Reactivate this user?'}
        description={toggle?.active ? `${toggle?.username} will be signed out and won't be able to sign in until reactivated.` : `${toggle?.username} will be able to sign in again.`}
        confirmLabel={toggle?.active ? 'Deactivate' : 'Reactivate'} onConfirm={confirmToggle} onCancel={() => setToggle(null)} />
    </div>
  )
}

export default UsersPage
