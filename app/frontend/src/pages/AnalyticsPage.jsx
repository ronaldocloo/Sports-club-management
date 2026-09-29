import { Link } from 'react-router-dom'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Activity, Building2, Lightbulb, Target, TrendingUp, Users, Wallet } from 'lucide-react'
import { getAnalytics } from '../api/analytics'
import useAsync from '../hooks/useAsync'
import { Badge, Card, CardHeader, CardSkeleton, EmptyState, ErrorState, PageHeader, StatCard, TableSkeleton } from '../components/ui'
import { formatMoney } from '../utils/format'

const insightStyle = {
  green: 'bg-emerald-50 text-emerald-700',
  amber: 'bg-amber-50 text-amber-700',
  blue: 'bg-blue-50 text-blue-700',
  red: 'bg-red-50 text-red-700',
}

function ChartCard({ title, subtitle, children, className = '' }) {
  return (
    <Card className={className}>
      <CardHeader title={title} subtitle={subtitle} />
      <div className="h-64 px-2 pb-4 pt-4">{children}</div>
    </Card>
  )
}

function AnalyticsPage() {
  const { data, status, reload } = useAsync(getAnalytics)

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Insights" title="Analytics" description="What is happening across your organization, and what needs attention." />

      {status === 'loading' && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5"><CardSkeleton /><CardSkeleton /><CardSkeleton /><CardSkeleton /><CardSkeleton /></div>
          <TableSkeleton rows={6} />
        </>
      )}
      {status === 'error' && <ErrorState title="Couldn't load analytics" onRetry={reload} />}

      {status === 'ready' && (() => {
        const { kpis, heatmap } = data
        const opacity = (n) => (heatmap.max ? 0.12 + (n / heatmap.max) * 0.88 : 0.12)
        return (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <StatCard icon={Wallet} tone="green" label="Monthly revenue" value={formatMoney(kpis.revenue)} trend={kpis.revChange} note="vs last month" />
              <StatCard icon={Users} label="Athletes" value={kpis.athletes} trend={kpis.growth} note="vs last month" />
              <StatCard icon={Target} tone="violet" label="Membership retention" value={`${kpis.retention}%`} note="active + expiring" />
              <StatCard icon={Activity} tone="amber" label="Average attendance" value={`${kpis.attendance}%`} note="last 24 sessions" />
              <StatCard icon={Building2} tone="green" label="Facility utilization" value={`${kpis.utilization}%`} note="all facilities" />
            </div>

            <Card className="border-blue-100 bg-blue-50/40 p-5">
              <div className="flex items-center gap-2">
                <Lightbulb size={18} className="text-blue-600" />
                <h2 className="text-sm font-semibold text-gray-900">Insights</h2>
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                {data.insights.map((i) => (
                  <div key={i.title} className="rounded-lg bg-white p-4 ring-1 ring-gray-100">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${insightStyle[i.tone]}`}>{i.title}</span>
                    <p className="mt-2 text-sm text-gray-700">{i.text}</p>
                  </div>
                ))}
              </div>
            </Card>

            <div className="grid gap-6 lg:grid-cols-2">
              <ChartCard title="Athlete growth" subtitle="Registrations over time">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.athleteGrowth} margin={{ left: 0, right: 16 }}>
                    <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2563eb" stopOpacity={0.25} /><stop offset="100%" stopColor="#2563eb" stopOpacity={0} /></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} width={36} />
                    <Tooltip />
                    <Area type="monotone" dataKey="athletes" name="Athletes" stroke="#2563eb" strokeWidth={2.5} fill="url(#g)" />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Revenue by source" subtitle="GH₵ per month">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.revenueByMonth} margin={{ left: 0, right: 16 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} width={44} tickFormatter={(v) => `${v / 1000}k`} />
                    <Tooltip formatter={(v) => formatMoney(v)} />
                    <Legend />
                    <Bar dataKey="memberships" name="Memberships" stackId="a" fill="#2563eb" />
                    <Bar dataKey="competitions" name="Competitions" stackId="a" fill="#10b981" />
                    <Bar dataKey="facilities" name="Facilities" stackId="a" fill="#f59e0b" />
                    <Bar dataKey="other" name="Other" stackId="a" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Membership breakdown" subtitle="Current status of every membership">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={data.membershipBreakdown} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2} stroke="none">
                      {data.membershipBreakdown.map((d) => <Cell key={d.name} fill={d.color} />)}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Sports distribution" subtitle="Athletes per sport">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.sportCounts} layout="vertical" margin={{ left: 8, right: 16 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} width={80} />
                    <Tooltip />
                    <Bar dataKey="value" name="Athletes" radius={[0, 4, 4, 0]}>
                      {data.sportCounts.map((d) => <Cell key={d.name} fill={d.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Facility utilization" subtitle="Share of available slots in use (%)">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.facilityUse} margin={{ left: 0, right: 16 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} interval={0} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} width={36} />
                    <Tooltip />
                    <Bar dataKey="utilization" name="Utilization %" fill="#2563eb" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <Card>
                <CardHeader title="Facility demand" subtitle="Bookings by day and time this week" />
                <div className="overflow-x-auto p-5">
                  <table className="w-full min-w-[360px] border-separate border-spacing-1 text-xs">
                    <thead>
                      <tr><th />{heatmap.days.map((d) => <th key={d} className="pb-1 font-medium text-gray-500">{d}</th>)}</tr>
                    </thead>
                    <tbody>
                      {heatmap.slots.map((t, si) => (
                        <tr key={t}>
                          <td className="pr-2 text-right text-gray-500">{t}</td>
                          {heatmap.days.map((d, di) => {
                            const n = heatmap.grid[di][si]
                            return (
                              <td key={d} title={`${d} ${t}: ${n} bookings`}
                                className="h-9 rounded text-center font-medium"
                                style={{ background: `rgba(37, 99, 235, ${opacity(n)})`, color: n / (heatmap.max || 1) > 0.5 ? '#fff' : '#1e3a8a' }}>{n}</td>
                            )
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
                <CardHeader title="Team performance" subtitle="Results from completed competitions" />
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[480px] text-left text-sm">
                    <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                      <tr>{['Team', 'P', 'W', 'D', 'L', 'Win %', 'Pts'].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {data.teamRows.map((r) => (
                        <tr key={r.team}>
                          <td className="px-4 py-3 font-medium text-gray-900">{r.team}</td>
                          <td className="px-4 py-3">{r.played}</td><td className="px-4 py-3">{r.won}</td><td className="px-4 py-3">{r.drawn}</td><td className="px-4 py-3">{r.lost}</td>
                          <td className="px-4 py-3">{r.winRate}%</td><td className="px-4 py-3 font-bold text-gray-900">{r.points}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              <Card>
                <CardHeader title="Needs attention" subtitle={`${data.attention.length} athletes flagged for review. These are suggestions, not automatic actions.`} />
                {data.attention.length === 0 ? (
                  <div className="p-6"><EmptyState icon={TrendingUp} title="Nothing needs attention" description="No athletes are currently flagged." /></div>
                ) : (
                  <ul className="max-h-96 divide-y divide-gray-100 overflow-y-auto">
                    {data.attention.slice(0, 12).map((a) => (
                      <li key={a.athleteId} className="px-5 py-3">
                        <div className="flex items-center justify-between">
                          <Link to={`/athletes/${a.athleteId}`} className="text-sm font-medium text-gray-900 hover:text-blue-600">{a.name}</Link>
                          <Badge tone="gray">{a.sport}</Badge>
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
