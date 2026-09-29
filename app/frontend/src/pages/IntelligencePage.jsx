import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Area, Bar, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { AlertTriangle, Bell, CheckCircle2, Info, Sparkles, TrendingDown, TrendingUp, Users, XCircle } from 'lucide-react'
import { getAnomalies, getAttendanceOutlook, getFacilityDemand, getRetention, getRevenueForecast, nudgeAthlete } from '../api/intelligence'
import { errorMessage } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { normalizeRole } from '../utils/permissions'
import { monthLabel } from '../utils/ranges'
import { formatMoney } from '../utils/format'
import { Badge, Button, Card, CardHeader, CardSkeleton, EmptyState, ErrorState, PageHeader, StatCard, TableSkeleton, Tabs, useToast } from '../components/ui'

const bandTone = { High: 'red', Medium: 'amber', Low: 'green' }
const bandBar = { High: 'bg-red-500', Medium: 'bg-amber-500', Low: 'bg-emerald-500' }
const sev = {
  danger: { icon: XCircle, cls: 'text-red-600 bg-red-50' },
  warning: { icon: AlertTriangle, cls: 'text-amber-600 bg-amber-50' },
  info: { icon: Info, cls: 'text-blue-600 bg-blue-50' },
  success: { icon: CheckCircle2, cls: 'text-emerald-600 bg-emerald-50' },
}
const outlookTone = { 'At risk': 'red', Declining: 'amber', Steady: 'gray', Improving: 'green', 'Not enough data': 'gray' }

// Loads one piece of intelligence and renders it, with skeleton and error states.
function useLoad(loader, enabled = true) {
  const [state, setState] = useState({ data: null, status: 'loading', error: '' })
  const load = useCallback(() => {
    setState((s) => ({ ...s, status: 'loading' }))
    loader().then((data) => setState({ data, status: 'ready', error: '' })).catch((e) => setState({ data: null, status: 'error', error: errorMessage(e, "We couldn't load this.") }))
  }, [loader])
  useEffect(() => { if (enabled) load() }, [load, enabled])
  return { ...state, reload: load }
}

function Section({ state, children, skeleton = <TableSkeleton rows={5} /> }) {
  if (state.status === 'loading') return skeleton
  if (state.status === 'error') return <ErrorState title="Couldn't load this" description={state.error} onRetry={state.reload} />
  return children(state.data)
}

function Retention() {
  const state = useLoad(getRetention)
  const { push } = useToast()
  const [sending, setSending] = useState(null)

  async function nudge(a) {
    setSending(a.athleteId)
    try {
      await nudgeAthlete(a.athleteId, a.hasAccount)
      push(`Reminder sent to ${a.name}`)
    } catch (e) {
      push(errorMessage(e, e.message), 'error')
    } finally {
      setSending(null)
    }
  }

  return (
    <Section state={state} skeleton={<><div className="grid gap-4 sm:grid-cols-3"><CardSkeleton /><CardSkeleton /><CardSkeleton /></div><TableSkeleton rows={6} /></>}>
      {(d) => (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard icon={TrendingDown} tone="amber" label="High risk" value={d.high} note="score 60 and above" />
            <StatCard icon={Users} tone="amber" label="Medium risk" value={d.medium} note="score 35 to 59" />
            <StatCard icon={CheckCircle2} tone="green" label="Low risk" value={d.low} note="no action needed" />
          </div>
          <Card>
            <CardHeader title="Athletes to look at" subtitle="Ranked by risk of not renewing or drifting away. Review each before acting." />
            {d.athletes.length === 0 ? (
              <div className="p-6"><EmptyState icon={CheckCircle2} title="Nobody stands out" description="No athlete currently shows meaningful retention risk." /></div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {d.athletes.map((a) => (
                  <li key={a.athleteId} className="flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-center">
                    <div className="w-full lg:w-56">
                      <Link to={`/athletes/${a.athleteId}`} className="text-sm font-medium text-gray-900 hover:text-blue-600">{a.name}</Link>
                      <p className="text-xs text-gray-500">{a.sport || 'No sport'}</p>
                    </div>
                    <div className="w-full lg:w-40">
                      <div className="flex items-center justify-between text-xs"><span className="font-semibold text-gray-900">{a.score}/100</span><Badge tone={bandTone[a.band]}>{a.band}</Badge></div>
                      <div className="mt-1 h-1.5 rounded-full bg-gray-100"><div className={`h-1.5 rounded-full ${bandBar[a.band]}`} style={{ width: `${a.score}%` }} /></div>
                    </div>
                    <ul className="flex-1 space-y-0.5 text-xs text-gray-600">
                      {a.factors.filter((f) => f.points !== 0).map((f) => (
                        <li key={f.label}>• {f.label} <span className={f.points > 0 ? 'text-red-600' : 'text-emerald-600'}>({f.points > 0 ? '+' : ''}{f.points})</span></li>
                      ))}
                    </ul>
                    <div className="flex items-center gap-3 lg:w-64">
                      <p className="flex-1 text-xs font-medium text-gray-700">{a.action}</p>
                      <Button size="sm" variant="secondary" icon={Bell} loading={sending === a.athleteId} disabled={!a.hasAccount} title={a.hasAccount ? undefined : 'This athlete has no user account to notify'} onClick={() => nudge(a)}>Remind</Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <p className="border-t border-gray-100 px-5 py-3 text-xs text-gray-500">How this works: {d.method}</p>
          </Card>
        </div>
      )}
    </Section>
  )
}

function Forecast() {
  const state = useLoad(getRevenueForecast)
  const outlook = useLoad(getAttendanceOutlook)
  return (
    <div className="space-y-6">
      <Section state={state} skeleton={<><div className="grid gap-4 sm:grid-cols-3"><CardSkeleton /><CardSkeleton /><CardSkeleton /></div><TableSkeleton rows={4} /></>}>
        {(d) => {
          const chart = [
            ...d.history.map((h) => ({ label: monthLabel(h.month), actual: h.value })),
            ...d.forecast.map((f) => ({ label: monthLabel(f.month), forecast: f.expected, band: [f.low, f.high] })),
          ]
          const next = d.forecast[0]
          return (
            <>
              <div className="grid gap-4 sm:grid-cols-3">
                <StatCard icon={TrendingUp} tone="green" label="Next month (expected)" value={next ? formatMoney(next.expected) : '—'} note={next ? `range ${formatMoney(next.low)} to ${formatMoney(next.high)}` : 'not enough history'} />
                <StatCard icon={d.monthlyChange < 0 ? TrendingDown : TrendingUp} tone={d.monthlyChange < 0 ? 'amber' : 'green'} label="Monthly trend" value={d.monthlyChange != null ? `${d.monthlyChange >= 0 ? '+' : ''}${formatMoney(d.monthlyChange)}` : '—'} note="change per month" />
                <StatCard icon={Users} tone="violet" label="Expected renewals" value={formatMoney(d.pipeline.expectedRenewals)} note={`${d.pipeline.membershipsEnding} memberships end within 60 days`} />
              </div>
              <Card>
                <CardHeader title="Revenue forecast" subtitle={d.note || d.method} />
                <div className="h-72 px-2 pb-4 pt-4">
                  {d.forecast.length === 0 ? <div className="flex h-full items-center justify-center text-sm text-gray-500">{d.note}</div> : (
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={chart} margin={{ left: 0, right: 16 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                        <XAxis dataKey="label" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} width={48} tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : v)} />
                        <Tooltip formatter={(v) => (Array.isArray(v) ? `${formatMoney(v[0])} – ${formatMoney(v[1])}` : formatMoney(v))} />
                        <Legend />
                        <Bar dataKey="actual" name="Actual" fill="#2563eb" radius={[4, 4, 0, 0]} />
                        <Area dataKey="band" name="Likely range" stroke="none" fill="#f59e0b" fillOpacity={0.2} />
                        <Line dataKey="forecast" name="Forecast" stroke="#f59e0b" strokeWidth={2.5} strokeDasharray="6 4" dot={{ r: 3 }} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </Card>
              <Card className="p-5">
                <h3 className="text-sm font-semibold text-gray-900">Renewal pipeline</h3>
                <p className="mt-2 text-sm text-gray-600">
                  {d.pipeline.membershipsEnding} memberships worth {formatMoney(d.pipeline.amountEnding)} end in the next 60 days. Based on your history,
                  about {Math.round(d.pipeline.renewalProbability * 100)}% renew, so you can expect around {formatMoney(d.pipeline.expectedRenewals)} and
                  should treat {formatMoney(d.pipeline.atRisk)} as at risk. <Link to="/memberships" className="font-medium text-blue-600 hover:text-blue-700">Open memberships →</Link>
                </p>
              </Card>
            </>
          )
        }}
      </Section>

      <Section state={outlook}>
        {(rows) => (
          <Card>
            <CardHeader title="Attendance outlook" subtitle="Weekly attendance trend per team, projected four weeks ahead." />
            {rows.length === 0 ? <div className="p-6"><EmptyState icon={Users} title="No attendance data yet" description="Record training attendance to see team trends and projections." /></div> : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500"><tr>{['Team', 'Now', 'Before', 'In 4 weeks', 'Outlook'].map((h) => <th key={h} className="px-5 py-3 font-medium">{h}</th>)}</tr></thead>
                  <tbody className="divide-y divide-gray-100">
                    {rows.map((t) => (
                      <tr key={t.teamId}>
                        <td className="px-5 py-3"><Link to={`/teams/${t.teamId}`} className="font-medium text-gray-900 hover:text-blue-600">{t.team}</Link></td>
                        <td className="px-5 py-3">{t.currentRate != null ? `${t.currentRate}%` : '—'}</td>
                        <td className="px-5 py-3">{t.previousRate != null ? `${t.previousRate}%` : '—'}</td>
                        <td className="px-5 py-3 font-medium">{t.projectedRate != null ? `${t.projectedRate}%` : '—'}</td>
                        <td className="px-5 py-3"><Badge tone={outlookTone[t.status]}>{t.status}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}
      </Section>
    </div>
  )
}

function Facilities() {
  const state = useLoad(getFacilityDemand)
  return (
    <Section state={state}>
      {(d) => {
        const max = Math.max(0.01, ...d.predicted.flat())
        return (
          <div className="space-y-6">
            <Card className="border-blue-100 bg-blue-50/40 p-5">
              <h3 className="text-sm font-semibold text-gray-900">Recommendations</h3>
              <ul className="mt-2 space-y-1 text-sm text-gray-700">{d.recommendations.map((r) => <li key={r}>• {r}</li>)}</ul>
              <p className="mt-2 text-xs text-gray-500">Based on the last {d.weeksAnalysed || 0} weeks of confirmed bookings across {d.openFacilities} open facilities.</p>
            </Card>
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader title="Expected bookings next week" subtitle="Average per week, by weekday and time" />
                <div className="overflow-x-auto p-5">
                  <table className="w-full min-w-[440px] border-separate border-spacing-1 text-xs">
                    <thead><tr><th />{d.slots.map((t) => <th key={t} className="pb-1 font-medium text-gray-500">{t}</th>)}</tr></thead>
                    <tbody>
                      {d.days.map((day, di) => (
                        <tr key={day}>
                          <td className="pr-2 text-right font-medium text-gray-500">{day.slice(0, 3)}</td>
                          {d.slots.map((t, si) => {
                            const v = d.predicted[di][si]
                            return <td key={t} title={`${day} ${t}: ${v}`} className="h-8 rounded text-center font-medium" style={{ background: `rgba(37, 99, 235, ${v ? 0.15 + (v / max) * 0.85 : 0.05})`, color: v / max > 0.5 ? '#fff' : '#1e3a8a' }}>{v || ''}</td>
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
              <div className="space-y-6">
                <Card><CardHeader title="Busiest slots" /><ul className="divide-y divide-gray-100">{d.peaks.length === 0 ? <li className="px-5 py-4 text-sm text-gray-500">No bookings to analyse yet.</li> : d.peaks.map((p) => <li key={p.day + p.slot} className="flex justify-between px-5 py-3 text-sm"><span>{p.day} {p.slot}</span><span className="font-medium">{p.predictedBookings} / week</span></li>)}</ul></Card>
                <Card><CardHeader title="Quietest weekday slots" subtitle="Good candidates for maintenance" /><ul className="divide-y divide-gray-100">{d.quiet.map((p) => <li key={p.day + p.slot} className="flex justify-between px-5 py-3 text-sm"><span>{p.day} {p.slot}</span><span className="font-medium">{p.predictedBookings} / week</span></li>)}</ul></Card>
              </div>
            </div>
          </div>
        )
      }}
    </Section>
  )
}

function Anomalies() {
  const state = useLoad(getAnomalies)
  return (
    <Section state={state}>
      {(list) => (
        <Card>
          <CardHeader title="Unusual activity" subtitle="Payments and bookings that look out of the ordinary. Most will have an innocent explanation." />
          {list.length === 0 ? (
            <div className="p-6"><EmptyState icon={CheckCircle2} title="Nothing unusual" description="No duplicate, repeated-failure, refund or stale-payment patterns were found." /></div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {list.map((a) => {
                const s = sev[a.severity] || sev.info
                const Icon = s.icon
                return (
                  <li key={a.title + a.detail} className="flex gap-3 px-5 py-4">
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${s.cls}`}><Icon size={16} /></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{a.title} <span className="ml-2 text-xs font-normal text-gray-400">{a.type}</span></p>
                      <p className="text-xs text-gray-500">{a.detail}</p>
                    </div>
                    {a.link && <Link to={a.link} className="self-center text-xs font-medium text-blue-600 hover:text-blue-700">Review →</Link>}
                  </li>
                )
              })}
            </ul>
          )}
        </Card>
      )}
    </Section>
  )
}

function IntelligencePage() {
  const { user } = useAuth()
  const role = normalizeRole(user?.role)
  const admin = role === 'Admin' || role === 'SuperAdmin'
  const tabs = useMemo(() => [
    { value: 'retention', label: 'Retention risk' },
    ...(admin ? [{ value: 'forecast', label: 'Forecast' }, { value: 'facilities', label: 'Facility demand' }] : []),
    { value: 'anomalies', label: 'Unusual activity' },
  ], [admin])
  const [tab, setTab] = useState('retention')

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Insights" title="Intelligence" description="Forecasts and early warnings drawn from your own data." />
      <p className="flex items-start gap-2 rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-900">
        <Sparkles size={16} className="mt-0.5 shrink-0" />
        <span>These are suggestions based on simple, transparent rules and trends. Each one shows its reasoning. A person should review before acting on any of them.</span>
      </p>
      <Tabs tabs={tabs} value={tab} onChange={setTab} />
      {tab === 'retention' && <Retention />}
      {tab === 'forecast' && admin && <Forecast />}
      {tab === 'facilities' && admin && <Facilities />}
      {tab === 'anomalies' && <Anomalies />}
    </div>
  )
}

export default IntelligencePage
