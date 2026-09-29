import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Plus, UserCheck, Users, UserX } from 'lucide-react'
import { createAthlete, getAthleteDirectory } from '../api/athletes'
import { getTeams } from '../api/teams'
import { useAuth } from '../context/AuthContext'
import { normalizeRole } from '../utils/permissions'
import { Avatar, Badge, Button, Card, CardSkeleton, ConfirmDialog, EmptyState, ErrorState, Modal, PageHeader, Pagination, RowMenu, SearchInput, Select, StatCard, TableSkeleton, useToast } from '../components/ui'
import AthleteForm from '../components/athletes/AthleteForm'

const PAGE_SIZE = 12
const memTone = { Active: 'green', Expiring: 'amber', Expired: 'red', Pending: 'gray' }
const sports = ['All', 'Football', 'Basketball', 'Athletics', 'Volleyball', 'Swimming', 'Badminton']

async function load() {
  const [athletes, teams] = await Promise.all([getAthleteDirectory(), getTeams().catch(() => [])])
  return { athletes, teams }
}

function AthletesPage() {
  const [rows, setRows] = useState([])
  const [teams, setTeams] = useState([])
  const [status, setStatus] = useState('loading')
  const [params, setParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const [membership, setMembership] = useState('All')
  const [page, setPage] = useState(1)
  const [form, setForm] = useState({ open: false, athlete: null })
  const [assign, setAssign] = useState(null)
  const [assignTeam, setAssignTeam] = useState('')
  const [toggle, setToggle] = useState(null)
  const navigate = useNavigate()
  const { user } = useAuth()
  const { push } = useToast()
  const role = normalizeRole(user?.role)
  const canWrite = role === 'Admin' || role === 'SuperAdmin' || role === 'FrontDesk'
  const canDelete = role === 'Admin' || role === 'SuperAdmin'
  const sport = params.get('sport') || 'All'

  const reload = useCallback(() => {
    setStatus('loading')
    load().then((d) => { setRows(d.athletes); setTeams(d.teams); setStatus('ready') }).catch(() => setStatus('error'))
  }, [])
  useEffect(() => { reload() }, [reload])
  useEffect(() => { setPage(1) }, [search, sport, membership])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return rows.filter((r) => (sport === 'All' || r.sport === sport) && (membership === 'All' || r.membership === membership) &&
      (!q || `${r.name} ${r.position || ''} ${r.team || ''} a-${String(r.athleteId).padStart(4, '0')}`.toLowerCase().includes(q)))
  }, [rows, search, sport, membership])
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const active = rows.filter((r) => r.status === 'Active').length

  async function save(values) {
    if (form.athlete) {
      setRows((l) => l.map((r) => (r.athleteId === form.athlete.athleteId ? { ...r, ...values, name: `${values.firstName} ${values.lastName}`, team: values.team } : r)))
      push('Athlete updated')
    } else {
      const created = await createAthlete(values)
      setRows((l) => [{ ...created, team: values.team, teamId: values.teamId, sport: values.sport, position: values.position }, ...l])
      push(`${created.name} added`)
    }
  }

  function confirmAssign() {
    const t = teams.find((x) => String(x.teamId) === assignTeam)
    if (!t) return
    setRows((l) => l.map((r) => (r.athleteId === assign.athleteId ? { ...r, team: t.teamName, teamId: t.teamId } : r)))
    push(`${assign.name} assigned to ${t.teamName}`)
    setAssign(null); setAssignTeam('')
  }

  function confirmToggle() {
    setRows((l) => l.map((r) => (r.athleteId === toggle.athleteId ? { ...r, status: r.status === 'Active' ? 'Inactive' : 'Active' } : r)))
    push(`${toggle.name} ${toggle.status === 'Active' ? 'deactivated' : 'reactivated'}`)
    setToggle(null)
  }

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Management" title="Athletes" description="Every athlete in your organization, in one place."
        actions={canWrite && <Button icon={Plus} onClick={() => setForm({ open: true, athlete: null })}>Add Athlete</Button>} />

      {status === 'loading' && <><div className="grid gap-4 sm:grid-cols-3"><CardSkeleton /><CardSkeleton /><CardSkeleton /></div><TableSkeleton rows={8} /></>}
      {status === 'error' && <ErrorState title="Couldn't load athletes" onRetry={reload} />}

      {status === 'ready' && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard icon={Users} label="Total athletes" value={rows.length} />
            <StatCard icon={UserCheck} tone="green" label="Active" value={active} />
            <StatCard icon={UserX} tone="amber" label="Inactive" value={rows.length - active} />
          </div>

          <Card>
            <div className="flex flex-col gap-3 border-b border-gray-100 p-4 md:flex-row md:items-center">
              <SearchInput value={search} onChange={setSearch} placeholder="Search by name, team, position or ID" label="Search athletes" />
              <select value={sport} onChange={(e) => setParams(e.target.value === 'All' ? {} : { sport: e.target.value })} aria-label="Filter by sport" className="rounded-lg border border-gray-200 px-3 py-2 text-sm">
                {sports.map((s) => <option key={s} value={s}>{s === 'All' ? 'All sports' : s}</option>)}
              </select>
              <select value={membership} onChange={(e) => setMembership(e.target.value)} aria-label="Filter by membership" className="rounded-lg border border-gray-200 px-3 py-2 text-sm">
                {['All', 'Active', 'Expiring', 'Expired', 'Pending'].map((s) => <option key={s} value={s}>{s === 'All' ? 'Any membership' : s}</option>)}
              </select>
            </div>

            {filtered.length === 0 ? (
              <div className="p-6"><EmptyState icon={Users} title="No athletes found" description="There are currently no athletes matching your search."
                action={canWrite && <Button icon={Plus} onClick={() => setForm({ open: true, athlete: null })}>Add Athlete</Button>} /></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px] text-left text-sm">
                  <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                    <tr>{['Athlete', 'ID', 'Sport', 'Team', 'Position', 'Age', 'Membership', 'Attendance', 'Status', ''].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {visible.map((r) => (
                      <tr key={r.athleteId} className="hover:bg-gray-50">
                        <td className="px-4 py-3"><Link to={`/athletes/${r.athleteId}`} className="flex items-center gap-3"><Avatar name={r.name} /><span className="font-medium text-gray-900">{r.name}</span></Link></td>
                        <td className="px-4 py-3 text-gray-500">A-{String(r.athleteId).slice(-4).padStart(4, '0')}</td>
                        <td className="px-4 py-3 text-gray-700">{r.sport || '—'}</td>
                        <td className="px-4 py-3 text-gray-700">{r.team || '—'}</td>
                        <td className="px-4 py-3 text-gray-700">{r.position || '—'}</td>
                        <td className="px-4 py-3 text-gray-700">{r.age ?? '—'}</td>
                        <td className="px-4 py-3">{r.membership ? <Badge tone={memTone[r.membership]}>{r.membership}</Badge> : '—'}</td>
                        <td className="px-4 py-3 text-gray-700">{r.attendance != null ? `${r.attendance}%` : '—'}</td>
                        <td className="px-4 py-3"><Badge tone={r.status === 'Active' ? 'green' : 'gray'}>{r.status}</Badge></td>
                        <td className="px-4 py-3 text-right">
                          <RowMenu label={`Actions for ${r.name}`} items={[
                            { label: 'View profile', onClick: () => navigate(`/athletes/${r.athleteId}`) },
                            { label: 'Edit', hidden: !canWrite, onClick: () => setForm({ open: true, athlete: r }) },
                            { label: 'Assign team', hidden: !canWrite, onClick: () => { setAssign(r); setAssignTeam('') } },
                            { label: r.status === 'Active' ? 'Deactivate' : 'Reactivate', hidden: !canDelete, danger: r.status === 'Active', onClick: () => setToggle(r) },
                          ]} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <Pagination page={page} pageSize={PAGE_SIZE} total={filtered.length} onChange={setPage} />
          </Card>
        </>
      )}

      <AthleteForm open={form.open} athlete={form.athlete} teams={teams} onClose={() => setForm({ open: false, athlete: null })} onSubmit={save} />

      <Modal open={!!assign} onClose={() => setAssign(null)} title="Assign team"
        footer={<><Button variant="secondary" onClick={() => setAssign(null)}>Cancel</Button><Button onClick={confirmAssign} disabled={!assignTeam}>Assign</Button></>}>
        {assign && <Select label={`Team for ${assign.name}`} options={teams.filter((t) => !assign.sport || t.sport === assign.sport).map((t) => ({ value: String(t.teamId), label: t.teamName }))} placeholder="Select team" value={assignTeam} onChange={(e) => setAssignTeam(e.target.value)} />}
      </Modal>

      <ConfirmDialog open={!!toggle} danger={toggle?.status === 'Active'} title={toggle?.status === 'Active' ? 'Deactivate this athlete?' : 'Reactivate this athlete?'}
        description={toggle?.status === 'Active' ? `${toggle?.name} will be marked inactive and removed from active rosters.` : `${toggle?.name} will be marked active again.`}
        confirmLabel={toggle?.status === 'Active' ? 'Deactivate Athlete' : 'Reactivate'} onConfirm={confirmToggle} onCancel={() => setToggle(null)} />
    </div>
  )
}

export default AthletesPage
