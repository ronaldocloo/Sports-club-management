import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Activity, AlertTriangle, Building2, CalendarCheck, CheckCircle2, Info, Lightbulb, Printer, Repeat, Shield, Target, Trophy, Users, Wallet, XCircle } from 'lucide-react'
import { getOverview } from '../api/analytics'
import { errorMessage } from '../api/client'
import { Badge, Button, Card, CardHeader, CardSkeleton, DateRangePicker, EmptyState, ErrorState, PageHeader, StatCard, TableSkeleton } from '../components/ui'
import { formatDate, formatMoney } from '../utils/format'
import { monthLabel, presetRange } from '../utils/ranges'

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ef4444', '#64748b', '#ec4899']
const STATUS_COLOR = { Active: '#10b981', 'Expiring soon': '#f59e0b', Expired: '#ef4444', Suspended: '#94a3b8' }
const severity = {
  success: { icon: CheckCircle2, cls: 'bg-emerald-50 text-emerald-700' },
  warning: { icon: AlertTriangle, cls: 'bg-amber-50 text-amber-700' },
  danger: { icon: XCircle, cls: 'bg-red-50 text-red-700' },
  info: { icon: Info, cls: 'bg-blue-50 text-blue-700' },
}

function ChartCard({ title, subtitle, empty, children, className = '' }) {
  return (
    <Card className={className}>
      <CardHeader title={title} subtitle={subtitle} />
      <div className="h-64 px-2 pb-4 pt-4">
        {empty ? <div className="flex h-full items-center justify-center text-sm text-gray-500">No data for this period</div> : children}
      </div>
    </Card>
  )
}

function Donut({ data, colorFor }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2} stroke="none">
          {data.map((d, i) => <Cell key={d.name} fill={colorFor ? colorFor(d.name, i) : COLORS[i % COLORS.length]} />)}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}

const axis = { tick: { fontSize: 12 }, axisLine: false, tickLine: false }

function AnalyticsPage() {
  const [range, setRange] = useState({ preset: '90d', ...presetRange('90d') })
  const [data, setData] = useState(null)
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')

  const load = useCallback(() => {
    setStatus('loading')
    getOverview({ from: range.from, to: range.to }).then((d) => { setData(d); setStatus('ready') }).catch((e) => { setError(errorMessage(e, 'Check the date range and try again.')); setStatus('error') })
  }, [range.from, range.to])
  useEffect(() => { if (range.from && range.to && range.from <= range.to) load() }, [load, range.from, range.to])

  const money = (v) => formatMoney(v)

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Insights" title="Analytics" description="What is happening across your organization, and what needs attention."
        actions={<><DateRangePicker value={range} onChange={setRange} /><Button variant="secondary" icon={Printer} onClick={() => window.print()}>Print</Button></>} />

      {status === 'loading' && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><CardSkeleton /><CardSkeleton /><CardSkeleton /><CardSkeleton /></div>
          <TableSkeleton rows={6} />
        </>
      )}
      {status === 'error' && <ErrorState title="Couldn't load analytics" description={error} onRetry={load} />}

      {status === 'ready' && (() => {
        const k = data.kpis
        const cmp = `vs ${formatDate(data.previous.from, { day: 'numeric', month: 'short' })} – ${formatDate(data.previous.to, { day: 'numeric', month: 'short' })}`
        const trend = (m) => (m.changePct === null || m.changePct === undefined ? undefined : m.changePct)
        const max = Math.max(1, data.heatmap.grid.flat().reduce((a, b) => Math.max(a, b), 0))
        return (
          <>
            <p className="text-sm text-gray-500">
              {formatDate(data.period.from)} to {formatDate(data.period.to)}. Trends compare with the previous period of the same length.
            </p>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard icon={Wallet} tone="green" label="Revenue" value={money(k.revenue.value)} trend={trend(k.revenue)} note={`${money(k.revenue.previous)} ${cmp}`} />
              <StatCard icon={Users} label="New athletes" value={k.newAthletes.value} trend={trend(k.newAthletes)} note={`${k.newAthletes.previous} before`} to="/athletes" linkLabel="View athletes" />
              <StatCard icon={Target} tone="violet" label="Active memberships" value={k.activeMemberships.value} trend={trend(k.activeMemberships)} note={`${k.activeMemberships.previous} before`} to="/memberships" linkLabel="View memberships" />
              <StatCard icon={Repeat} tone="green" label="Renewal rate" value={`${k.renewalRate.value}%`} trend={trend(k.renewalRate)} note="memberships renewed within 30 days" />
              <StatCard icon={Activity} tone="amber" label="Attendance" value={k.attendanceRate.value ? `${k.attendanceRate.value}%` : '—'} trend={trend(k.attendanceRate)} note={k.attendanceRate.value ? 'present or late' : 'no sessions recorded'} to="/attendance" linkLabel="Open attendance" />
              <StatCard icon={Building2} tone="green" label="Facility utilization" value={`${k.facilityUtilization.value}%`} trend={trend(k.facilityUtilization)} note="of open slots booked" to="/facilities" linkLabel="View facilities" />
              <StatCard icon={Trophy} tone="amber" label="Fixtures played" value={k.fixturesPlayed.value} trend={trend(k.fixturesPlayed)} note={`${k.fixturesPlayed.previous} before`} to="/competitions" linkLabel="View competitions" />
              <StatCard icon={Wallet} tone="amber" label="Outstanding" value={money(data.outstanding.amount)} note={`${data.outstanding.memberships} active memberships owe money`} to="/payments" linkLabel="View payments" />
            </div>

            <Card className="border-blue-100 bg-blue-50/40 p-5">
              <div className="flex items-center gap-2"><Lightbulb size={18} className="text-blue-600" /><h2 className="text-sm font-semibold text-gray-900">Insights</h2></div>
              {data.insights.length === 0 ? (
                <p className="mt-2 text-sm text-gray-500">Insights will appear once there is more activity to analyse.</p>
              ) : (
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  {data.insights.map((i) => {
                    const sev = severity[i.severity] || severity.info
                    const Icon = sev.icon
                    return (
                      <div key={i.title + i.text} className="rounded-lg bg-white p-4 ring-1 ring-gray-100">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${sev.cls}`}><Icon size={12} /> {i.title}</span>
                        <p className="mt-2 text-sm text-gray-700">{i.text}</p>
                        {i.link && <Link to={i.link} className="mt-2 inline-block text-xs font-medium text-blue-600 hover:text-blue-700">Take a look →</Link>}
                      </div>
                    )
                  })}
                </div>
              )}
            </Card>

            <div className="grid gap-6 lg:grid-cols-2">
              <ChartCard title="Revenue" subtitle="Completed payments per month (GH₵)" empty={data.revenueByMonth.every((m) => !m.value)}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.revenueByMonth.map((m) => ({ ...m, label: monthLabel(m.month) }))} margin={{ left: 0, right: 16 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                    <XAxis dataKey="label" {...axis} />
                    <YAxis {...axis} width={44} tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : v)} />
                    <Tooltip formatter={(v) => money(v)} />
                    <Bar dataKey="value" name="Revenue" fill="#2563eb" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Athlete growth" subtitle="Total athletes over time" empty={data.athleteGrowth.every((m) => !m.value)}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.athleteGrowth.map((m) => ({ ...m, label: monthLabel(m.month) }))} margin={{ left: 0, right: 16 }}>
                    <defs><linearGradient id="ag" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2563eb" stopOpacity={0.25} /><stop offset="100%" stopColor="#2563eb" stopOpacity={0} /></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                    <XAxis dataKey="label" {...axis} />
                    <YAxis {...axis} width={36} />
                    <Tooltip />
                    <Area type="monotone" dataKey="value" name="Athletes" stroke="#2563eb" strokeWidth={2.5} fill="url(#ag)" />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Attendance" subtitle="Present or late, per month (%)" empty={data.attendanceByMonth.every((m) => !m.value)}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.attendanceByMonth.map((m) => ({ ...m, label: monthLabel(m.month) }))} margin={{ left: 0, right: 16 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                    <XAxis dataKey="label" {...axis} />
                    <YAxis domain={[0, 100]} {...axis} width={36} />
                    <Tooltip formatter={(v) => `${v}%`} />
                    <Line type="monotone" dataKey="value" name="Attendance" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Membership status" subtitle="Every membership, as of the end of the range" empty={data.membershipStatus.length === 0}>
                <Donut data={data.membershipStatus} colorFor={(n) => STATUS_COLOR[n]} />
              </ChartCard>

              <ChartCard title="Sports" subtitle="Athletes per sport" empty={data.sports.length === 0}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.sports} layout="vertical" margin={{ left: 8, right: 16 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                    <XAxis type="number" {...axis} />
                    <YAxis type="category" dataKey="name" {...axis} width={80} />
                    <Tooltip />
                    <Bar dataKey="value" name="Athletes" radius={[0, 4, 4, 0]}>{data.sports.map((d, i) => <Cell key={d.name} fill={COLORS[i % COLORS.length]} />)}</Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Demographics" subtitle="Athletes by age group" empty={data.ageBands.every((b) => !b.value)}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.ageBands} margin={{ left: 0, right: 16 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                    <XAxis dataKey="name" {...axis} />
                    <YAxis {...axis} width={32} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="value" name="Athletes" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Gender" subtitle="Athletes by gender" empty={data.gender.length === 0}><Donut data={data.gender} /></ChartCard>
              <ChartCard title="Payment methods" subtitle="Revenue in the period by method" empty={data.paymentMethods.length === 0}><Donut data={data.paymentMethods} /></ChartCard>
              <ChartCard title="Plans" subtitle="Memberships in force by plan" empty={data.plans.length === 0}><Donut data={data.plans} /></ChartCard>

              <ChartCard title="Facility utilization" subtitle="Share of open slots booked (%)" empty={data.facilities.length === 0}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.facilities.map((f) => ({ ...f, short: f.name.length > 12 ? `${f.name.slice(0, 11)}…` : f.name }))} margin={{ left: 0, right: 16 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                    <XAxis dataKey="short" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} interval={0} />
                    <YAxis domain={[0, 100]} {...axis} width={36} />
                    <Tooltip formatter={(v, n, p) => [`${v}% (${p.payload.bookings} bookings)`, 'Utilization']} />
                    <Bar dataKey="utilization" fill="#2563eb" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <Card>
                <CardHeader title="Facility demand" subtitle="Confirmed bookings by weekday and time" />
                <div className="overflow-x-auto p-5">
                  <table className="w-full min-w-[420px] border-separate border-spacing-1 text-xs">
                    <thead><tr><th />{data.heatmap.slots.map((t) => <th key={t} className="pb-1 font-medium text-gray-500">{t}</th>)}</tr></thead>
                    <tbody>
                      {data.heatmap.days.map((d, di) => (
                        <tr key={d}>
                          <td className="pr-2 text-right font-medium text-gray-500">{d}</td>
                          {data.heatmap.slots.map((t, si) => {
                            const n = data.heatmap.grid[di][si]
                            return <td key={t} title={`${d} ${t}: ${n} bookings`} className="h-8 rounded text-center font-medium" style={{ background: `rgba(37, 99, 235, ${n ? 0.15 + (n / max) * 0.85 : 0.05})`, color: n / max > 0.5 ? '#fff' : '#1e3a8a' }}>{n || ''}</td>
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader title="Teams" subtitle="Results, attendance and ratings in the period" />
                {data.teams.length === 0 ? <div className="p-6"><EmptyState icon={Shield} title="No teams yet" description="Teams will appear here once they are created." /></div> : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[560px] text-left text-sm">
                      <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                        <tr>{['Team', 'Athletes', 'P', 'W', 'D', 'L', 'Pts', 'Attend.', 'Rating'].map((h) => <th key={h} className="px-3 py-3 font-medium">{h}</th>)}</tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {data.teams.map((t) => (
                          <tr key={t.teamId}>
                            <td className="px-3 py-3"><Link to={`/teams/${t.teamId}`} className="font-medium text-gray-900 hover:text-blue-600">{t.name}</Link><p className="text-xs text-gray-500">{t.sport}</p></td>
                            <td className="px-3 py-3">{t.athletes}</td><td className="px-3 py-3">{t.played}</td><td className="px-3 py-3">{t.won}</td><td className="px-3 py-3">{t.drawn}</td><td className="px-3 py-3">{t.lost}</td>
                            <td className="px-3 py-3 font-bold text-gray-900">{t.points}</td>
                            <td className="px-3 py-3">{t.attendanceRate != null ? `${t.attendanceRate}%` : '—'}</td>
                            <td className="px-3 py-3">{t.averageRating ?? '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>

              <Card>
                <CardHeader title="Needs attention" subtitle={`${data.attention.length} athletes flagged for review. These are suggestions, not automatic actions.`} />
                {data.attention.length === 0 ? (
                  <div className="p-6"><EmptyState icon={CalendarCheck} title="Nothing needs attention" description="No athletes are currently flagged." /></div>
                ) : (
                  <ul className="max-h-96 divide-y divide-gray-100 overflow-y-auto">
                    {data.attention.map((a) => (
                      <li key={a.athleteId} className="px-5 py-3">
                        <div className="flex items-center justify-between">
                          <Link to={`/athletes/${a.athleteId}`} className="text-sm font-medium text-gray-900 hover:text-blue-600">{a.name}</Link>
                          {a.sport && <Badge tone="gray">{a.sport}</Badge>}
                        </div>
                        <ul className="mt-1 space-y-0.5 text-xs text-gray-500">{a.reasons.map((r) => <li key={r}>• {r}</li>)}</ul>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </div>
          </>
        )
      })()}
    </div>
  )
}

export default AnalyticsPage
