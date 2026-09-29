import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Building2, Plus, CalendarDays, MapPin, Shield, Swords, Trophy, Users } from 'lucide-react'
import { getCompetitionDetail } from '../api/competitions'
import { createFixture, recordFixtureResult } from '../api/fixtures'
import { errorMessage } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { normalizeRole } from '../utils/permissions'
import { Badge, Button, Card, EmptyState, ErrorState, Skeleton, CardSkeleton, useToast } from '../components/ui'
import FixtureForm from '../components/competitions/FixtureForm'
import FixtureCard from '../components/competitions/FixtureCard'
import ResultModal from '../components/competitions/ResultModal'
import StandingsTable from '../components/competitions/StandingsTable'
import { computeStandings, statusTone } from '../utils/competition'
import { formatDate } from '../utils/format'

const allTabs = ['Fixtures', 'Results', 'Standings', 'Teams']

function CompetitionDetailPage() {
  const { competitionId } = useParams()
  const [comp, setComp] = useState(null)
  const [fixtures, setFixtures] = useState([])
  const [status, setStatus] = useState('loading')
  const [tab, setTab] = useState('Fixtures')
  const [recording, setRecording] = useState(null)
  const [adding, setAdding] = useState(false)
  const { user } = useAuth()
  const { push } = useToast()
  const role = normalizeRole(user?.role)
  const canManage = role === 'Admin' || role === 'SuperAdmin'
  const canRecord = canManage || role === 'Coach'

  const load = useCallback(() => {
    setStatus('loading')
    getCompetitionDetail(competitionId)
      .then((c) => {
        setComp(c)
        setFixtures(c?.fixtures || [])
        setTab(c?.fixturesAvailable === false ? 'Teams' : c?.fixtures?.some((f) => f.status !== 'Completed') ? 'Fixtures' : 'Results')
        setStatus(c ? 'ready' : 'missing')
      })
      .catch(() => setStatus('error'))
  }, [competitionId])

  useEffect(() => { load() }, [load])

  const upcoming = useMemo(() => fixtures.filter((f) => f.status !== 'Completed'), [fixtures])
  const results = useMemo(() => fixtures.filter((f) => f.status === 'Completed'), [fixtures])
  const standings = useMemo(() => comp?.standings || computeStandings(comp?.teams || [], fixtures), [comp, fixtures])
  const hasGroup = comp?.serverFixtures ? standings.length > 0 : fixtures.some((f) => /group|round/i.test(f.round))
  const next = upcoming.find((f) => f.home !== 'TBD')
  const hasFixtures = comp?.fixturesAvailable !== false
  const tabs = hasFixtures ? allTabs : ['Teams']

  async function saveResult(id, homeScore, awayScore) {
    if (comp.serverFixtures) {
      try {
        await recordFixtureResult(id, homeScore, awayScore)
        setRecording(null)
        push('Result recorded')
        load()
        setTab('Results')
      } catch (e) {
        push(errorMessage(e), 'error')
      }
      return
    }
    setFixtures((list) => list.map((f) => (f.id === id ? { ...f, homeScore, awayScore, status: 'Completed' } : f)))
    setRecording(null)
    setTab('Results')
  }

  async function addFixture(values) {
    await createFixture({ ...values, competitionId: comp.competitionId })
    push('Fixture scheduled')
    load()
    setTab('Fixtures')
  }

  const back = (
    <Link to="/competitions" className="inline-flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-gray-900">
      <ArrowLeft size={16} /> Back to Competitions
    </Link>
  )

  if (status === 'loading') {
    return (
      <div className="space-y-6">
        {back}
        <Skeleton className="h-36 w-full" />
        <div className="grid gap-4 sm:grid-cols-3"><CardSkeleton /><CardSkeleton /><CardSkeleton /></div>
      </div>
    )
  }
  if (status === 'error') return <div className="space-y-6">{back}<ErrorState title="Couldn't load this competition" onRetry={load} /></div>
  if (status === 'missing') {
    return (
      <div className="space-y-6">
        {back}
        <EmptyState icon={Trophy} title="Competition not found" description="It may have been removed." action={<Link to="/competitions"><Button>Back to Competitions</Button></Link>} />
      </div>
    )
  }

  const facts = [
    { icon: CalendarDays, label: 'Date', value: formatDate(comp.date) },
    { icon: MapPin, label: 'Venue', value: comp.location },
    { icon: Building2, label: comp.organizer ? 'Organizer' : 'Level', value: comp.organizer || comp.level || '—' },
    { icon: Users, label: 'Teams', value: comp.teams.length },
    ...(hasFixtures ? [{ icon: Swords, label: 'Matches', value: `${results.length}/${fixtures.length} played` }] : []),
  ]

  return (
    <div className="space-y-6">
      {back}

      <Card className="p-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-50 text-yellow-600"><Trophy size={24} /></div>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{comp.competitionName}</h1>
              <Badge tone={statusTone[comp.status] || 'blue'}>{comp.status}</Badge>
            </div>
            <p className="text-sm text-gray-500">{[comp.sport, comp.level].filter(Boolean).join(' · ')} · Competition #{comp.competitionId}</p>
          </div>
        </div>
        {comp.description && <p className="mt-4 max-w-2xl text-sm text-gray-600">{comp.description}</p>}
        <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-gray-100 pt-5 sm:grid-cols-3 lg:grid-cols-5">
          {facts.map(({ icon: Icon, label, value }) => (
            <div key={label}>
              <dt className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-gray-400"><Icon size={13} /> {label}</dt>
              <dd className="mt-1 text-sm font-medium text-gray-900">{value}</dd>
            </div>
          ))}
        </dl>
      </Card>

      {!hasFixtures && (
        <p className="rounded-lg bg-blue-50 px-4 py-2 text-sm text-blue-800">Match fixtures and live results are not tracked yet. This page shows each registered team's final position and points.</p>
      )}

      {next && (
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Next match</h2>
          <FixtureCard fixture={next} featured onRecord={canRecord ? setRecording : undefined} />
        </div>
      )}

      <div>
        {comp.serverFixtures && canManage && (
          <div className="mb-3 flex justify-end"><Button icon={Plus} size="sm" onClick={() => setAdding(true)}>Schedule fixture</Button></div>
        )}
        <div role="tablist" className="flex gap-1 overflow-x-auto border-b border-gray-200">
          {tabs.map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={`whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium ${tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
            >
              {t}
              {t === 'Fixtures' && <span className="ml-1.5 text-xs text-gray-400">{upcoming.length}</span>}
              {t === 'Results' && <span className="ml-1.5 text-xs text-gray-400">{results.length}</span>}
            </button>
          ))}
        </div>

        <div className="mt-5">
          {tab === 'Fixtures' && (
            upcoming.length ? (
              <div className="grid gap-4 md:grid-cols-2">{upcoming.map((f) => <FixtureCard key={f.id} fixture={f} onRecord={canRecord ? setRecording : undefined} />)}</div>
            ) : <EmptyState icon={CalendarDays} title="No upcoming fixtures" description="All matches in this competition have been played." />
          )}
          {tab === 'Results' && (
            results.length ? (
              <div className="grid gap-4 md:grid-cols-2">{results.map((f) => <FixtureCard key={f.id} fixture={f} />)}</div>
            ) : <EmptyState icon={Swords} title="No results yet" description="Results appear here once matches have been played." />
          )}
          {tab === 'Standings' && (
            hasGroup ? <StandingsTable rows={standings} /> : <EmptyState icon={Trophy} title="No standings" description="This is a knockout competition, so there is no league table." />
          )}
          {tab === 'Teams' && (
            comp.entries?.length ? (
              <Card className="overflow-x-auto">
                <table className="w-full min-w-[420px] text-left text-sm">
                  <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                    <tr><th className="px-5 py-3 font-medium">Team</th><th className="px-5 py-3 font-medium">Registered</th><th className="px-5 py-3 font-medium">Final position</th><th className="px-5 py-3 font-medium">Points</th></tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {comp.entries.map((e) => (
                      <tr key={e.team}>
                        <td className="px-5 py-3 font-medium text-gray-900">{e.team}</td>
                        <td className="px-5 py-3 text-gray-700">{e.registrationDate ? formatDate(e.registrationDate) : '—'}</td>
                        <td className="px-5 py-3 text-gray-700">{e.finalPosition ? `#${e.finalPosition}` : '—'}</td>
                        <td className="px-5 py-3 text-gray-700">{e.points ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            ) : comp.teams.length ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {comp.teams.map((t) => (
                  <Card key={t} className="flex items-center gap-3 p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><Shield size={18} /></div>
                    <span className="text-sm font-medium text-gray-900">{t}</span>
                  </Card>
                ))}
              </div>
            ) : (
              <EmptyState icon={Shield} title="No teams registered" description="Teams that register for this competition will appear here." />
            )
          )}
        </div>
      </div>

      {comp.serverFixtures && <FixtureForm open={adding} teams={comp.entries || []} defaultVenue={comp.location} onClose={() => setAdding(false)} onSubmit={addFixture} />}
      <ResultModal fixture={recording} onClose={() => setRecording(null)} onSave={saveResult} />
    </div>
  )
}

export default CompetitionDetailPage
