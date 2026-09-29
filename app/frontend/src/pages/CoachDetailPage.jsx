import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Award, Clock, Mail, MapPin, Phone, Shield, Users } from 'lucide-react'
import { getCoachById } from '../api/coaches'
import { Avatar, Button, Card, CardHeader, EmptyState, ErrorState, Skeleton, CardSkeleton } from '../components/ui'
import CoachStatusBadge from '../components/coaches/CoachStatusBadge'

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']

function CoachDetailPage() {
  const { coachId } = useParams()
  const [coach, setCoach] = useState(null)
  const [status, setStatus] = useState('loading')

  const load = useCallback(() => {
    setStatus('loading')
    getCoachById(coachId).then((c) => { setCoach(c); setStatus(c ? 'ready' : 'missing') }).catch(() => setStatus('error'))
  }, [coachId])

  useEffect(() => { load() }, [load])

  const back = (
    <Link to="/coaches" className="inline-flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-gray-900">
      <ArrowLeft size={16} /> Back to Coaches
    </Link>
  )

  if (status === 'loading') {
    return (
      <div className="space-y-6">
        {back}
        <Skeleton className="h-32 w-full" />
        <div className="grid gap-4 sm:grid-cols-3"><CardSkeleton /><CardSkeleton /><CardSkeleton /></div>
      </div>
    )
  }

  if (status === 'error') {
    return <div className="space-y-6">{back}<ErrorState title="Couldn't load this coach" onRetry={load} /></div>
  }

  if (status === 'missing') {
    return (
      <div className="space-y-6">
        {back}
        <EmptyState title="Coach not found" description="This coach may have been removed." action={<Link to="/coaches"><Button>Back to Coaches</Button></Link>} />
      </div>
    )
  }

  const name = `${coach.firstName} ${coach.lastName}`
  const overview = [
    { icon: Shield, label: 'Teams', value: coach.teams.length },
    { icon: Users, label: 'Athletes', value: coach.athletes },
    { icon: Clock, label: 'Experience', value: `${coach.experienceYears} yrs` },
    { icon: Award, label: 'Certifications', value: coach.certifications.length },
  ]

  return (
    <div className="space-y-6">
      {back}

      <Card className="p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <Avatar name={name} size={72} />
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{name}</h1>
              <CoachStatusBadge status={coach.status} />
            </div>
            <p className="mt-1 text-sm text-gray-500">
              {coach.sport} · {coach.specialization || 'General'} · Coach ID C-{String(coach.coachId).padStart(3, '0')}
            </p>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-gray-600">
              <span className="inline-flex items-center gap-1.5"><Mail size={14} /> {coach.email}</span>
              {coach.phone && <span className="inline-flex items-center gap-1.5"><Phone size={14} /> {coach.phone}</span>}
              <span className="inline-flex items-center gap-1.5"><MapPin size={14} /> Ashesi Sports Club</span>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {overview.map(({ icon: Icon, label, value }) => (
          <Card key={label} className="p-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><Icon size={18} /></div>
            <p className="mt-3 text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-sm text-gray-500">{label}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Today's schedule" subtitle="Sessions and meetings for today" />
          {coach.today.length === 0 ? (
            <div className="p-6"><EmptyState icon={Clock} title="Nothing scheduled today" description="This coach has no sessions today." /></div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {coach.today.map((s) => (
                <li key={s.time + s.title} className="flex items-center gap-4 px-5 py-4">
                  <span className="w-14 text-sm font-semibold text-blue-600">{s.time}</span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{s.title}</p>
                    <p className="text-xs text-gray-500">{s.place}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader title="Certifications" />
          {coach.certifications.length === 0 ? (
            <p className="px-5 py-6 text-sm text-gray-500">No certifications on record.</p>
          ) : (
            <ul className="space-y-3 p-5">
              {coach.certifications.map((c) => (
                <li key={c} className="flex items-center gap-3 text-sm text-gray-700">
                  <Award size={16} className="shrink-0 text-amber-500" /> {c}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader title="Teams" subtitle="Assigned teams" />
          {coach.teams.length === 0 ? (
            <p className="px-5 py-6 text-sm text-gray-500">Not assigned to any team.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {coach.teams.map((t) => (
                <li key={t} className="flex items-center gap-3 px-5 py-3 text-sm font-medium text-gray-800">
                  <Shield size={16} className="text-blue-600" /> {t}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Weekly schedule" />
          <div className="grid grid-cols-2 gap-px bg-gray-100 sm:grid-cols-5">
            {days.map((d) => (
              <div key={d} className="bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{d}</p>
                {coach.schedule[d].length === 0 ? (
                  <p className="mt-2 text-xs text-gray-400">Free</p>
                ) : (
                  <ul className="mt-2 space-y-2">
                    {coach.schedule[d].map((s) => (
                      <li key={s} className="rounded-md bg-blue-50 px-2 py-1.5 text-xs font-medium text-blue-700">{s}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

export default CoachDetailPage
