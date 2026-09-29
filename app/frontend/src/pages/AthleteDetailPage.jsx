import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Activity, ArrowLeft, Plus, CalendarCheck, CreditCard, Lightbulb, Mail, Ruler, Shield, Trophy, UserCog, Users, Weight, Cake } from 'lucide-react'
import { CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { getAthleteProfile } from '../api/athletes'
import { getAthleteInsight } from '../api/intelligence'
import { recordPerformance, statPresets } from '../api/performance'
import { errorMessage } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { normalizeRole } from '../utils/permissions'
import { Avatar, Badge, Button, Card, CardHeader, CardSkeleton, EmptyState, ErrorState, Input, Modal, Skeleton, useToast } from '../components/ui'
import { formatDate } from '../utils/format'
import { membershipStatus } from '../utils/membership'

const attendanceColors = { Present: '#10b981', Late: '#f59e0b', Absent: '#ef4444', Excused: '#94a3b8' }
const resultTone = { Win: 'green', Draw: 'amber', Loss: 'red' }
const payTone = { Paid: 'green', Pending: 'amber', Overdue: 'red' }

function age(dob) {
  const d = new Date(dob)
  const now = new Date()
  let a = now.getFullYear() - d.getFullYear()
  if (now < new Date(now.getFullYear(), d.getMonth(), d.getDate())) a--
  return a
}

const membershipState = membershipStatus

function buildInsights(p) {
  const out = []
  if (p.attendance) {
    const diff = p.attendance.recentRate - p.attendance.earlierRate
    if (diff >= 5) out.push(`${p.firstName}'s training attendance increased by ${diff}% over the last 12 sessions.`)
    else if (diff <= -5) out.push(`${p.firstName}'s training attendance dropped by ${Math.abs(diff)}% over the last 12 sessions. Worth a check-in.`)
  }
  if (p.performance && p.performance.trend.length > 1) {
    const t = p.performance.trend
    if (t.at(-1).score > t[0].score) out.push(`Performance score improved from ${t[0].score} to ${t.at(-1).score} across the last 8 weeks.`)
  }
  if (p.membership) {
    const m = membershipState(p.membership)
    if (m.tone !== 'green' && m.key !== 'Pending') out.push(`Membership: ${m.label.toLowerCase()}. Consider sending a renewal reminder.`)
  } else {
    out.push('This athlete has no membership on record.')
  }
  return out
}

function Stat({ icon: Icon, label, value }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-gray-400"><Icon size={14} /> {label}</div>
      <p className="mt-2 truncate text-lg font-semibold text-gray-900">{value}</p>
    </Card>
  )
}

// `athleteId` and `portal` are set when this page is used as the athlete's own profile (/me).
function PerformanceModal({ athlete, open, onClose, onSaved }) {
  const presets = statPresets[athlete.sport] || ['goals', 'assists']
  const today = new Date().toISOString().slice(0, 10)
  const [v, setV] = useState({ recordDate: today, rating: '', notes: '', stats: {} })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const close = () => { setV({ recordDate: today, rating: '', notes: '', stats: {} }); setErrors({}); onClose() }

  async function submit(e) {
    e.preventDefault()
    const err = {}
    if (!v.recordDate) err.recordDate = 'Pick a date.'
    const rating = Number(v.rating)
    if (v.rating === '' || Number.isNaN(rating) || rating < 0 || rating > 100) err.rating = 'Enter a rating from 0 to 100.'
    setErrors(err)
    if (Object.keys(err).length) return
    const stats = Object.fromEntries(Object.entries(v.stats).filter(([, n]) => n !== '' && !Number.isNaN(Number(n))).map(([k, n]) => [k, Number(n)]))
    setSaving(true)
    try {
      await recordPerformance({ athleteId: athlete.athleteId, recordDate: v.recordDate, rating, stats, notes: v.notes.trim() || null })
      await onSaved()
      close()
    } catch (e2) {
      setErrors({ submit: errorMessage(e2, "We couldn't save this record.") })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={close} title={`Record performance: ${athlete.firstName}`}
      footer={<><Button variant="secondary" onClick={close}>Cancel</Button><Button type="submit" form="performance-form" loading={saving}>Save</Button></>}>
      <form id="performance-form" onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
        <Input label="Date" required type="date" value={v.recordDate} onChange={(e) => setV((s) => ({ ...s, recordDate: e.target.value }))} error={errors.recordDate} />
        <Input label="Rating (0–100)" required type="number" min="0" max="100" step="0.5" value={v.rating} onChange={(e) => setV((s) => ({ ...s, rating: e.target.value }))} error={errors.rating} />
        {presets.map((k) => (
          <Input key={k} label={k.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase())} type="number" min="0" value={v.stats[k] ?? ''} onChange={(e) => setV((s) => ({ ...s, stats: { ...s.stats, [k]: e.target.value } }))} />
        ))}
        <div className="sm:col-span-2"><Input label="Notes" value={v.notes} onChange={(e) => setV((s) => ({ ...s, notes: e.target.value }))} /></div>
        {errors.submit && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 sm:col-span-2">{errors.submit}</p>}
      </form>
    </Modal>
  )
}

function AthleteDetailPage({ athleteId: fixedId, portal = false }) {
  const params = useParams()
  const athleteId = fixedId ?? params.athleteId
  const [p, setP] = useState(null)
  const [status, setStatus] = useState('loading')
  const [recording, setRecording] = useState(false)
  const [insight, setInsight] = useState(null)
  const { user, demoMode } = useAuth()
  const { push } = useToast()
  const role = normalizeRole(user?.role)
  const canRecord = !demoMode && (role === 'Admin' || role === 'SuperAdmin' || role === 'Coach')

  const load = useCallback(() => {
    setStatus('loading')
    getAthleteProfile(athleteId).then((d) => { setP(d); setStatus(d ? 'ready' : 'missing') }).catch(() => setStatus('error'))
  }, [athleteId])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    setInsight(null)
    getAthleteInsight(athleteId).then(setInsight).catch(() => setInsight(null))
  }, [athleteId])

  const back = portal ? null : (
    <Link to="/athletes" className="inline-flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-gray-900">
      <ArrowLeft size={16} /> Back to Athletes
    </Link>
  )

  if (status === 'loading') {
    return (
      <div className="space-y-6">
        {back}
        <Skeleton className="h-32 w-full" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><CardSkeleton /><CardSkeleton /><CardSkeleton /><CardSkeleton /></div>
      </div>
    )
  }
  if (status === 'error') return <div className="space-y-6">{back}<ErrorState title="Couldn't load this athlete" onRetry={load} /></div>
  if (status === 'missing') {
    return (
      <div className="space-y-6">
        {back}
        <EmptyState icon={Users} title="Athlete not found" description="This athlete may have been removed." action={<Link to="/athletes"><Button>Back to Athletes</Button></Link>} />
      </div>
    )
  }

  const name = `${p.firstName} ${p.lastName}`
  const m = p.membership ? membershipState(p.membership) : null
  const pie = p.attendance ? Object.entries(p.attendance.counts).map(([k, v]) => ({ name: k, value: v })) : []
  // The server explains trends in ratings and attendance; membership notes come from the profile itself.
  const local = buildInsights(p)
  const insights = insight
    ? [...insight.highlights.filter((h) => !h.startsWith('There is not enough')), ...local.filter((i) => /embership/.test(i))]
    : local
  const winRate = p.performance?.gamesPlayed ? Math.round((p.performance.wins / p.performance.gamesPlayed) * 100) : 0

  return (
    <div className="space-y-6">
      {back}

      <Card className="p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <Avatar name={name} size={72} />
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{name}</h1>
              <Badge tone="green">{p.status}</Badge>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              {[p.sport, p.teamName, p.position].filter(Boolean).join(' · ')} · Athlete ID A-{String(p.athleteId).padStart(4, '0')}
            </p>
            {p.email && <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-gray-600"><Mail size={14} /> {p.email}</p>}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-7">
        <Stat icon={Cake} label="Age" value={p.dateOfBirth ? age(p.dateOfBirth) : '—'} />
        <Stat icon={Ruler} label="Height" value={p.heightCm ? `${p.heightCm} cm` : '—'} />
        <Stat icon={Weight} label="Weight" value={p.weightKg ? `${p.weightKg} kg` : '—'} />
        <Stat icon={Shield} label="Team" value={p.teamName} />
        <Stat icon={UserCog} label="Coach" value={p.coachName} />
        <Stat icon={CreditCard} label="Membership" value={p.membership?.type || 'None'} />
        <Stat icon={CalendarCheck} label="Attendance" value={p.attendance ? `${p.attendance.rate}%` : '—'} />
      </div>

      {insights.length > 0 && (
        <Card className="border-blue-100 bg-blue-50/50 p-5">
          <div className="flex gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600"><Lightbulb size={16} /></div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Performance insights</p>
              <ul className="mt-1 space-y-1 text-sm text-gray-700">{insights.map((i) => <li key={i}>{i}</li>)}</ul>
            </div>
          </div>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Performance" subtitle={p.sampleData ? 'Sample data for demonstration' : undefined}
            action={canRecord && <Button size="sm" variant="secondary" icon={Plus} onClick={() => setRecording(true)}>Record</Button>} />
          {p.performance ? (
            <>
          <div className="grid grid-cols-2 gap-4 p-5 sm:grid-cols-4">
            {[{ label: 'Games played', value: p.performance.gamesPlayed }, { label: 'Wins', value: `${p.performance.wins} (${winRate}%)` }, ...p.performance.stats].map((s) => (
              <div key={s.label}>
                <p className="text-xl font-bold text-gray-900">{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            ))}
          </div>
          {p.performance.trend.length > 0 && <div className="h-56 px-2 pb-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={p.performance.trend} margin={{ left: 0, right: 16, top: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="week" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis domain={[40, 100]} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} width={32} />
                <Tooltip />
                <Line type="monotone" dataKey="score" name="Score" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>}
            </>
          ) : (
            <div className="p-6"><EmptyState icon={Activity} title="No performance recorded yet" description="Ratings, stats and trends will appear here once a coach records them." /></div>
          )}
        </Card>

        <Card>
          <CardHeader title="Membership" />
          {p.membership ? (
            <dl className="space-y-4 p-5 text-sm">
              <div className="flex items-center justify-between"><dt className="text-gray-500">Status</dt><dd><Badge tone={m.tone}>{m.label}</Badge></dd></div>
              <div className="flex items-center justify-between"><dt className="text-gray-500">Plan</dt><dd className="font-medium text-gray-900">{p.membership.type}</dd></div>
              <div className="flex items-center justify-between"><dt className="text-gray-500">Start date</dt><dd className="font-medium text-gray-900">{formatDate(p.membership.start)}</dd></div>
              <div className="flex items-center justify-between"><dt className="text-gray-500">Expiry date</dt><dd className="font-medium text-gray-900">{formatDate(p.membership.expiry)}</dd></div>
              <div className="flex items-center justify-between"><dt className="text-gray-500">Payment</dt><dd><Badge tone={payTone[p.membership.payment]}>{p.membership.payment}</Badge></dd></div>
            </dl>
          ) : (
            <div className="p-6"><EmptyState icon={CreditCard} title="No membership" description="This athlete has no membership on record." /></div>
          )}
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader title="Attendance" subtitle="Last 24 training sessions" />
          {p.attendance ? (
            <>
          <div className="flex items-center gap-4 p-5">
            <div className="h-32 w-32 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pie} dataKey="value" innerRadius={38} outerRadius={60} paddingAngle={2} stroke="none">
                    {pie.map((d) => <Cell key={d.name} fill={attendanceColors[d.name]} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="space-y-1.5 text-sm">
              {pie.map((d) => (
                <li key={d.name} className="flex items-center gap-2 text-gray-700">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: attendanceColors[d.name] }} /> {d.name} <span className="font-semibold text-gray-900">{d.value}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-wrap gap-1.5 border-t border-gray-100 p-5" aria-label="Session history, oldest to newest">
            {p.attendance.sessions.map((s, i) => (
              <span key={i} title={s} className="h-5 w-5 rounded" style={{ background: attendanceColors[s] }} />
            ))}
          </div>
            </>
          ) : (
            <div className="p-6"><EmptyState icon={CalendarCheck} title="No attendance recorded yet" description="Training attendance will appear here once a coach records it." /></div>
          )}
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Competition history" />
          {p.history.length === 0 ? (
            <div className="p-6"><EmptyState icon={Trophy} title="No competitions yet" description="Matches this athlete's team has played will appear here." /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                  <tr><th className="px-5 py-3 font-medium">Competition</th><th className="px-5 py-3 font-medium">Date</th><th className="px-5 py-3 font-medium">Match</th><th className="px-5 py-3 font-medium">Result</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {p.history.map((h) => (
                    <tr key={h.competition + h.date + h.opponent}>
                      <td className="px-5 py-3"><p className="font-medium text-gray-900">{h.competition}</p>{h.round && <p className="text-xs text-gray-500">{h.round}</p>}</td>
                      <td className="px-5 py-3 text-gray-700">{formatDate(h.date)}</td>
                      <td className="px-5 py-3 text-gray-700">{h.opponent ? `${h.team} vs ${h.opponent}` : h.team}</td>
                      <td className="px-5 py-3"><Badge tone={h.tone || resultTone[h.result]}>{h.label || `${h.result} ${h.score}`}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
      {canRecord && <PerformanceModal athlete={p} open={recording} onClose={() => setRecording(false)} onSaved={async () => { push('Performance recorded'); load() }} />}
    </div>
  )
}

export default AthleteDetailPage
