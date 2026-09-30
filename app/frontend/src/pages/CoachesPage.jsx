import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Award, Plus, Search, UserCog, Users } from 'lucide-react'
import { createCoach, getCoaches } from '../api/coaches'
import { Avatar, Button, Card, EmptyState, ErrorState, PageHeader, StatCard, TableSkeleton, CardSkeleton } from '../components/ui'
import CoachForm from '../components/coaches/CoachForm'
import CoachStatusBadge from '../components/coaches/CoachStatusBadge'

function CoachesPage() {
  const [coaches, setCoaches] = useState([])
  const [status, setStatus] = useState('loading')
  const [search, setSearch] = useState('')
  const [sport, setSport] = useState('All')
  const [formOpen, setFormOpen] = useState(false)
  const navigate = useNavigate()

  const load = useCallback(() => {
    setStatus('loading')
    getCoaches().then((data) => { setCoaches(data); setStatus('ready') }).catch(() => setStatus('error'))
  }, [])

  useEffect(() => { load() }, [load])

  const sports = useMemo(() => ['All', ...new Set(coaches.map((c) => c.sport))], [coaches])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return coaches.filter((c) => {
      if (sport !== 'All' && c.sport !== sport) return false
      if (!q) return true
      return `${c.firstName} ${c.lastName} ${c.sport} ${c.specialization} coach-${c.coachId}`.toLowerCase().includes(q)
    })
  }, [coaches, search, sport])

  const active = coaches.filter((c) => c.status === 'Active').length
  const athletes = coaches.reduce((sum, c) => sum + c.athletes, 0)

  async function handleCreate(values) {
    const coach = await createCoach(values)
    setCoaches((list) => [coach, ...list])
    navigate(`/coaches/${coach.coachId}`)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Management"
        title="Coaches"
        description="Your coaching staff, their teams and schedules."
        actions={<Button icon={Plus} onClick={() => setFormOpen(true)}>Add Coach</Button>}
      />

      {status === 'loading' && (
        <>
          <div className="grid gap-4 sm:grid-cols-3"><CardSkeleton /><CardSkeleton /><CardSkeleton /></div>
          <TableSkeleton />
        </>
      )}

      {status === 'error' && <ErrorState title="Couldn't load coaches" onRetry={load} />}

      {status === 'ready' && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard icon={UserCog} label="Total Coaches" value={coaches.length} note={`${active} active`} />
            <StatCard icon={Users} label="Athletes Coached" value={athletes} tone="green" note="across all teams" />
            <StatCard icon={Award} label="Certifications" value={coaches.reduce((s, c) => s + c.certifications.length, 0)} tone="violet" note="on record" />
          </div>

          <Card>
            <div className="flex flex-col gap-3 border-b border-gray-100 p-4 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name, sport or specialization"
                  aria-label="Search coaches"
                  className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <select value={sport} onChange={(e) => setSport(e.target.value)} aria-label="Filter by sport" className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
                {sports.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>

            {filtered.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  icon={UserCog}
                  title="No coaches found"
                  description="There are currently no coaches matching your search."
                  action={<Button icon={Plus} onClick={() => setFormOpen(true)}>Add Coach</Button>}
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                    <tr>
                      <th className="px-5 py-3 font-medium">Coach</th>
                      <th className="px-5 py-3 font-medium">Sport</th>
                      <th className="px-5 py-3 font-medium">Teams</th>
                      <th className="px-5 py-3 font-medium">Athletes</th>
                      <th className="px-5 py-3 font-medium">Experience</th>
                      <th className="px-5 py-3 font-medium">Status</th>
                      <th className="px-5 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filtered.map((c) => {
                      const name = `${c.firstName} ${c.lastName}`
                      return (
                        <tr key={c.coachId} className="hover:bg-gray-50">
                          <td className="px-5 py-3">
                            <Link to={`/coaches/${c.coachId}`} className="flex items-center gap-3">
                              <Avatar name={name} />
                              <div>
                                <p className="font-medium text-gray-900">{name}</p>
                                <p className="text-xs text-gray-500">{c.specialization || 'General'} · C-{String(c.coachId).padStart(3, '0')}</p>
                              </div>
                            </Link>
                          </td>
                          <td className="px-5 py-3 text-gray-700">{c.sport}</td>
                          <td className="px-5 py-3 text-gray-700">{c.teams.length}</td>
                          <td className="px-5 py-3 text-gray-700">{c.athletes}</td>
                          <td className="px-5 py-3 text-gray-700">{c.experienceYears} yrs</td>
                          <td className="px-5 py-3"><CoachStatusBadge status={c.status} /></td>
                          <td className="px-5 py-3 text-right">
                            <Link to={`/coaches/${c.coachId}`} className="text-sm font-medium text-blue-600 hover:text-blue-700">View</Link>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}

      <CoachForm open={formOpen} onClose={() => setFormOpen(false)} onSubmit={handleCreate} />
    </div>
  )
}

export default CoachesPage
