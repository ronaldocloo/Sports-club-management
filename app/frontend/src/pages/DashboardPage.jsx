import { Link } from 'react-router-dom'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Activity, Building2, CalendarDays, CreditCard, Lightbulb, MapPin, Shield, Trophy, UserCog, Users, Wallet } from 'lucide-react'
import { getDashboard } from '../api/dashboard'
import useAsync from '../hooks/useAsync'
import { useAuth } from '../context/AuthContext'
import { normalizeRole } from '../utils/permissions'
import { Badge, Card, CardHeader, CardSkeleton, ErrorState, PageHeader, StatCard, TableSkeleton } from '../components/ui'
import { formatDate, formatMoney } from '../utils/format'
import { useOrganization } from '../context/OrganizationContext'

// Which KPI cards each role sees.
const roleKpis = {
  Coach: ['athletes', 'teams', 'competitions', 'events'],
  FrontDesk: ['athletes', 'memberships', 'outstanding', 'utilization', 'events'],
}

const kpiMeta = {
  athletes: { label: 'Total Athletes', icon: Users, to: '/athletes', link: 'View athletes', tone: 'blue' },
  teams: { label: 'Active Teams', icon: Shield, to: '/teams', link: 'View teams', tone: 'green' },
  coaches: { label: 'Coaches', icon: UserCog, to: '/coaches', link: 'View coaches', tone: 'violet' },
  memberships: { label: 'Active Memberships', icon: CreditCard, to: '/memberships', link: 'Manage memberships', tone: 'blue' },
  competitions: { label: 'Upcoming Competitions', icon: Trophy, to: '/competitions', link: 'View competitions', tone: 'amber' },
  outstanding: { label: 'Outstanding Payments', icon: Wallet, to: '/payments', link: 'View payments', tone: 'amber' },
  utilization: { label: 'Facility Utilization', icon: Building2, to: '/facilities', link: 'View facilities', tone: 'green' },
  events: { label: 'Upcoming Events', icon: CalendarDays, to: '/events', link: 'View events', tone: 'violet' },
}

const typeTone = { Training: 'blue', Match: 'green', Competition: 'green', Awards: 'amber' }

function greeting() {
  return 'Welcome back'
}

function DashboardPage() {
  const { data, status, reload } = useAsync(getDashboard)
  const { user } = useAuth()
  const { organization } = useOrganization()
  const role = normalizeRole(user?.role)
  const firstName = (user?.fullName || user?.username || 'there').split(' ')[0]
  const showFinance = role === 'Admin' || role === 'SuperAdmin' || role === 'FrontDesk'
  const isAdmin = role === 'Admin' || role === 'SuperAdmin'

  return (
    <div className="space-y-6">
      <PageHeader eyebrow={organization?.name || 'Sports organization'} title={`${greeting()}, ${firstName}`} description="Here's what is happening in your sports organization." />

      {status === 'loading' && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}</div>
          <TableSkeleton rows={6} />
        </>
      )}
      {status === 'error' && <ErrorState title="Couldn't load the dashboard" onRetry={reload} />}

      {status === 'ready' && (() => {
        const keys = roleKpis[role] || Object.keys(kpiMeta)
        const a = data.analytics
        return (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {keys.map((k) => {
                const m = kpiMeta[k]
                const d = data.kpis[k]
                return (
                  <StatCard key={k} icon={m.icon} tone={m.tone} label={m.label}
                    value={d.money ? formatMoney(d.value) : `${d.value}${d.suffix || ''}`}
                    trend={d.trend} note={d.note} to={m.to} linkLabel={m.link} />
                )
              })}
            </div>

            {isAdmin && (
              <Card className="border-blue-100 bg-blue-50/40 p-5">
                <div className="flex items-center gap-2"><Lightbulb size={18} className="text-blue-600" /><h2 className="text-sm font-semibold text-gray-900">Insights</h2></div>
                <ul className="mt-2 space-y-1 text-sm text-gray-700">
                  {a.insights.slice(0, 3).map((i) => <li key={i.title}>• {i.text}</li>)}
                </ul>
                <Link to="/analytics" className="mt-3 inline-block text-sm font-medium text-blue-600 hover:text-blue-700">Open analytics →</Link>
              </Card>
            )}

            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader title="Athlete growth" subtitle="Registrations over time" />
                <div className="h-64 px-2 pb-4 pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={a.athleteGrowth} margin={{ left: 0, right: 16 }}>
                      <defs><linearGradient id="dg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2563eb" stopOpacity={0.25} /><stop offset="100%" stopColor="#2563eb" stopOpacity={0} /></linearGradient></defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} width={36} />
                      <Tooltip />
                      <Area type="monotone" dataKey="athletes" name="Athletes" stroke="#2563eb" strokeWidth={2.5} fill="url(#dg)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card>
                <CardHeader title="Memberships" subtitle="Current status" />
                <div className="h-64 px-2 pb-4 pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={a.membershipBreakdown} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2} stroke="none">
                        {a.membershipBreakdown.map((d) => <Cell key={d.name} fill={d.color} />)}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {showFinance && (
                <Card className="lg:col-span-2">
                  <CardHeader title="Revenue" subtitle="Last 6 months (GH₵)" />
                  <div className="h-64 px-2 pb-4 pt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={a.revenueByMonth} margin={{ left: 0, right: 16 }}>
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
                  </div>
                </Card>
              )}
              <Card className={showFinance ? '' : 'lg:col-span-3'}>
                <CardHeader title="Sports distribution" subtitle="Athletes per sport" />
                <div className="h-64 px-2 pb-4 pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={a.sportCounts} layout="vertical" margin={{ left: 8, right: 16 }}>
                      <XAxis type="number" hide />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} width={80} />
                      <Tooltip />
                      <Bar dataKey="value" name="Athletes" radius={[0, 4, 4, 0]}>
                        {a.sportCounts.map((d) => <Cell key={d.name} fill={d.color} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader title="Upcoming events" action={<Link to="/events" className="text-sm font-medium text-blue-600 hover:text-blue-700">View all</Link>} />
                <ul className="divide-y divide-gray-100">
                  {data.upcomingEvents.map((e) => (
                    <li key={e.id} className="flex items-center gap-4 px-5 py-3">
                      <div className="w-14 text-center leading-tight">
                        <p className="text-xs uppercase text-gray-400">{formatDate(e.date, { month: 'short' })}</p>
                        <p className="text-lg font-bold text-gray-900">{formatDate(e.date, { day: 'numeric' })}</p>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{e.title}</p>
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-500"><MapPin size={12} /> {e.location} · {e.time}</p>
                      </div>
                      <Badge tone={typeTone[e.type] || 'gray'}>{e.type}</Badge>
                    </li>
                  ))}
                </ul>
              </Card>

              <Card>
                <CardHeader title="Recent activity" action={isAdmin && <Link to="/settings?tab=audit" className="text-sm font-medium text-blue-600 hover:text-blue-700">Audit log</Link>} />
                {data.activity.length === 0 && <p className="px-5 py-6 text-sm text-gray-500">No recent activity.</p>}
                <ul className="divide-y divide-gray-100">
                  {data.activity.map((e) => (
                    <li key={e.id} className="flex gap-3 px-5 py-3">
                      <Activity size={16} className="mt-0.5 shrink-0 text-blue-600" />
                      <div>
                        <p className="text-sm text-gray-800"><span className="font-medium">{e.actor}</span> {e.action} <span className="font-medium">{e.target}</span></p>
                        <p className="text-xs text-gray-500">{formatDate(e.time, { day: 'numeric', month: 'short' })}{String(e.time).includes('T') && `, ${new Date(e.time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          </>
        )
      })()}
    </div>
  )
}

export default DashboardPage
