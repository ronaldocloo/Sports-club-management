import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Building2, CalendarDays, MapPin, Shield, Swords, Trophy, Users } from 'lucide-react'
import { getCompetitionDetail } from '../api/competitions'
import { Badge, Button, Card, EmptyState, ErrorState, Skeleton, CardSkeleton } from '../components/ui'
import FixtureCard from '../components/competitions/FixtureCard'
import ResultModal from '../components/competitions/ResultModal'
import StandingsTable from '../components/competitions/StandingsTable'
import { computeStandings, statusTone } from '../utils/competition'
import { formatDate } from '../utils/format'

const tabs = ['Fixtures', 'Results', 'Standings', 'Teams']

function CompetitionDetailPage() {
  const { competitionId } = useParams()
  const [comp, setComp] = useState(null)
  const [fixtures, setFixtures] = useState([])
  const [status, setStatus] = useState('loading')
  const [tab, setTab] = useState('Fixtures')
  const [recording, setRecording] = useState(null)

  const load = useCallback(() => {
    setStatus('loading')
    getCompetitionDetail(competitionId)
      .then((c) => {
        setComp(c)
        setFixtures(c?.fixtures || [])
        setTab(c?.fixtures?.some((f) => f.status !== 'Completed') ? 'Fixtures' : 'Results')
        setStatus(c ? 'ready' : 'missing')
      })
      .catch(() => setStatus('error'))
  }, [competitionId])

  useEffect(() => { load() }, [load])

  const upcoming = useMemo(() => fixtures.filter((f) => f.status !== 'Completed'), [fixtures])
  const results = useMemo(() => fixtures.filter((f) => f.status === 'Completed'), [fixtures])
  const standings = useMemo(() => computeStandings(comp?.teams || [], fixtures), [comp, fixtures])
  const hasGroup = fixtures.some((f) => /group|round/i.test(f.round))
  const next = upcoming.find((f) => f.home !== 'TBD')

  function saveResult(id, homeScore, awayScore) {
    setFixtures((list) => list.map((f) => (f.id === id ? { ...f, homeScore, awayScore, status: 'Completed' } : f)))
    setRecording(null)
    setTab('Results')
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
    { icon: Building2, label: 'Organizer', value: comp.organizer || '—' },
    { icon: Users, label: 'Teams', value: comp.teams.length },
    { icon: Swords, label: 'Matches', value: `${results.length}/${fixtures.length} played` },
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

      {next && (
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Next match</h2>
          <FixtureCard fixture={next} featured onRecord={setRecording} />
        </div>
      )}

      <div>
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
              <div className="grid gap-4 md:grid-cols-2">{upcoming.map((f) => <FixtureCard key={f.id} fixture={f} onRecord={setRecording} />)}</div>
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
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {comp.teams.map((t) => (
                <Card key={t} className="flex items-center gap-3 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><Shield size={18} /></div>
                  <span className="text-sm font-medium text-gray-900">{t}</span>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <ResultModal fixture={recording} onClose={() => setRecording(null)} onSave={saveResult} />
    </div>
  )
}

export default CompetitionDetailPage
