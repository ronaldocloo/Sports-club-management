import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Layers, Plus, Shield, UserCog, Users } from 'lucide-react'
import { getAthletes } from '../api/athletes'
import { getTeams } from '../api/teams'
import { mockCoaches } from '../mocks/coachData'
import { sports as seedSports } from '../mocks/demoData'
import useAsync from '../hooks/useAsync'
import { Button, Card, CardSkeleton, EmptyState, ErrorState, Input, Modal, PageHeader, StatCard, useToast } from '../components/ui'

async function load() {
  const [athletes, teams] = await Promise.all([getAthletes(), getTeams()])
  return { athletes, teams }
}

function SportsPage() {
  const { data, status, reload } = useAsync(load)
  const [extra, setExtra] = useState([])
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const { push } = useToast()

  useEffect(() => { setExtra([]) }, [data])

  const sports = [...seedSports, ...extra]
  const count = (list, sport) => (list || []).filter((x) => x.sport === sport).length

  function add(e) {
    e.preventDefault()
    const n = name.trim()
    if (!n) return setError('Sport name is required.')
    if (sports.some((s) => s.name.toLowerCase() === n.toLowerCase())) return setError('That sport already exists.')
    setExtra((l) => [...l, { id: Date.now(), name: n, color: '#64748b' }])
    setOpen(false); setName(''); setError('')
    push(`Sport “${n}” added`)
  }

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Management" title="Sports" description="The sports your organization runs, with teams, coaches and athletes."
        actions={<Button icon={Plus} onClick={() => setOpen(true)}>Add Sport</Button>} />

      {status === 'loading' && <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><CardSkeleton /><CardSkeleton /><CardSkeleton /></div>}
      {status === 'error' && <ErrorState title="Couldn't load sports" onRetry={reload} />}

      {status === 'ready' && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard icon={Layers} label="Sports" value={sports.length} />
            <StatCard icon={Shield} tone="green" label="Teams" value={data.teams.length} />
            <StatCard icon={Users} tone="violet" label="Athletes" value={data.athletes.length} />
          </div>

          {sports.length === 0 ? (
            <EmptyState icon={Layers} title="No sports yet" description="Add the first sport your club offers." />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sports.map((s) => (
                <Card key={s.id} className="p-5">
                  <div className="flex items-center gap-3">
                    <span className="h-10 w-10 rounded-xl" style={{ background: s.color + '22' }}><Layers size={20} className="m-2.5" style={{ color: s.color }} /></span>
                    <h3 className="text-base font-semibold text-gray-900">{s.name}</h3>
                  </div>
                  <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
                    <div><dt className="flex items-center justify-center gap-1 text-xs text-gray-500"><Users size={12} /> Athletes</dt><dd className="mt-1 text-xl font-bold text-gray-900">{count(data.athletes, s.name)}</dd></div>
                    <div><dt className="flex items-center justify-center gap-1 text-xs text-gray-500"><Shield size={12} /> Teams</dt><dd className="mt-1 text-xl font-bold text-gray-900">{count(data.teams, s.name)}</dd></div>
                    <div><dt className="flex items-center justify-center gap-1 text-xs text-gray-500"><UserCog size={12} /> Coaches</dt><dd className="mt-1 text-xl font-bold text-gray-900">{count(mockCoaches, s.name)}</dd></div>
                  </dl>
                  <Link to={`/athletes?sport=${encodeURIComponent(s.name)}`} className="mt-4 inline-block text-sm font-medium text-blue-600 hover:text-blue-700">View athletes →</Link>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Add sport"
        footer={<><Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" form="sport-form">Add Sport</Button></>}>
        <form id="sport-form" onSubmit={add} noValidate>
          <Input label="Sport name" required value={name} onChange={(e) => { setName(e.target.value); setError('') }} error={error} />
        </form>
      </Modal>
    </div>
  )
}

export default SportsPage
