import { useMemo, useState } from 'react'
import { Check, Minus, Plus, UserRound } from 'lucide-react'
import { initialUsers } from '../mocks/usersData'
import { ROLE_LABELS, moduleList, roleAccess } from '../utils/permissions'
import useAsync from '../hooks/useAsync'
import { Avatar, Badge, Button, Card, CardHeader, ConfirmDialog, EmptyState, ErrorState, Input, Modal, PageHeader, SearchInput, Select, TableSkeleton, useToast } from '../components/ui'
import { formatDate } from '../utils/format'

const roleTone = { SuperAdmin: 'red', Admin: 'blue', Coach: 'green', FrontDesk: 'amber', Athlete: 'gray' }
const delay = (ms) => new Promise((r) => setTimeout(r, ms))
// Demo data; replace with GET /api/users once wired to the backend.
const loadUsers = async () => { await delay(450); return initialUsers.map((u) => ({ ...u })) }

function UserModal({ open, onClose, onSave }) {
  const empty = { name: '', username: '', email: '', role: '' }
  const [v, setV] = useState(empty)
  const [errors, setErrors] = useState({})
  const set = (k) => (e) => setV((s) => ({ ...s, [k]: e.target.value }))
  const close = () => { setV(empty); setErrors({}); onClose() }

  function submit(e) {
    e.preventDefault()
    const err = {}
    if (!v.name.trim()) err.name = 'Full name is required.'
    if (!/^[a-z0-9._-]{3,}$/i.test(v.username)) err.username = 'Use at least 3 letters, numbers, dots or dashes.'
    if (!/^\S+@\S+\.\S+$/.test(v.email)) err.email = 'Enter a valid email address.'
    if (!v.role) err.role = 'Select a role.'
    setErrors(err)
    if (Object.keys(err).length) return
    onSave(v)
    setV(empty)
  }

  return (
    <Modal open={open} onClose={close} title="Add user"
      footer={<><Button variant="secondary" onClick={close}>Cancel</Button><Button type="submit" form="user-form">Add User</Button></>}>
      <form id="user-form" onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
        <Input label="Full name" required value={v.name} onChange={set('name')} error={errors.name} />
        <Input label="Username" required value={v.username} onChange={set('username')} error={errors.username} />
        <div className="sm:col-span-2"><Input label="Email" required type="email" value={v.email} onChange={set('email')} error={errors.email} /></div>
        <div className="sm:col-span-2"><Select label="Role" required options={Object.entries(ROLE_LABELS).map(([value, label]) => ({ value, label }))} placeholder="Select role" value={v.role} onChange={set('role')} error={errors.role} /></div>
      </form>
    </Modal>
  )
}

function UsersPage() {
  const { data, setData, status, reload } = useAsync(loadUsers)
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [toggle, setToggle] = useState(null)
  const { push } = useToast()

  const users = useMemo(() => (data || []).filter((u) => `${u.name} ${u.username} ${u.email}`.toLowerCase().includes(search.toLowerCase().trim())), [data, search])

  function add(v) {
    setData((l) => [{ id: Date.now(), ...v, active: true, lastLogin: null }, ...l])
    setOpen(false)
    push(`User ${v.username} added`)
  }

  function confirmToggle() {
    setData((l) => l.map((u) => (u.id === toggle.id ? { ...u, active: !u.active } : u)))
    push(`${toggle.name} ${toggle.active ? 'deactivated' : 'reactivated'}`)
    setToggle(null)
  }

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
                        <td className="px-5 py-3"><div className="flex items-center gap-3"><Avatar name={u.name} /><div><p className="font-medium text-gray-900">{u.name}</p><p className="text-xs text-gray-500">{u.username} · {u.email}</p></div></div></td>
                        <td className="px-5 py-3"><Badge tone={roleTone[u.role]}>{ROLE_LABELS[u.role]}</Badge></td>
                        <td className="px-5 py-3"><Badge tone={u.active ? 'green' : 'gray'}>{u.active ? 'Active' : 'Inactive'}</Badge></td>
                        <td className="px-5 py-3 text-gray-700">{u.lastLogin ? formatDate(u.lastLogin) : 'Never'}</td>
                        <td className="px-5 py-3 text-right"><Button size="sm" variant="secondary" onClick={() => setToggle(u)}>{u.active ? 'Deactivate' : 'Reactivate'}</Button></td>
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
                  <tr><th className="px-5 py-3 text-left font-medium">Section</th>{Object.values(ROLE_LABELS).map((l) => <th key={l} className="px-3 py-3 text-center font-medium">{l}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {moduleList.map((m) => (
                    <tr key={m}>
                      <td className="px-5 py-2.5 font-medium capitalize text-gray-800">{m}</td>
                      {Object.keys(ROLE_LABELS).map((r) => (
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

      <UserModal open={open} onClose={() => setOpen(false)} onSave={add} />
      <ConfirmDialog open={!!toggle} danger={toggle?.active} title={toggle?.active ? 'Deactivate this user?' : 'Reactivate this user?'}
        description={toggle?.active ? `${toggle?.name} will no longer be able to sign in.` : `${toggle?.name} will be able to sign in again.`}
        confirmLabel={toggle?.active ? 'Deactivate' : 'Reactivate'} onConfirm={confirmToggle} onCancel={() => setToggle(null)} />
    </div>
  )
}

export default UsersPage
