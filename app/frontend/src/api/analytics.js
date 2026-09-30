import apiClient, { USE_MOCKS } from './client'
import { loadAll } from './raw'
import { getAthleteDirectory, getAthleteGrowth } from './athletes'
import { getCompetitions } from './competitions'
import { getSports } from './sports'
import { getTeams } from './teams'
import { bookingConfig, getBookings, getFacilities, getMembers, getMembershipPlans, getPayments, getRevenueByMonth } from './operations'
import { buildAthleteProfile } from '../mocks/athleteData'
import { competitionDetails } from '../mocks/competitionData'
import { mockAthletes, mockCompetitions } from '../mocks/mockData'
import { membershipStatus } from '../utils/membership'
import { TODAY_ISO } from '../utils/today'

// Analytics and reports are computed from the same API functions every page uses, so the
// numbers agree across the app in both demo and real mode. Where the backend does not track
// something (attendance, match results) the value is null and the UI says so.

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const dayIndex = (iso) => (new Date(iso).getDay() + 6) % 7
const money = (v) => `GH₵${Math.round(v).toLocaleString('en-GH')}`
const pct = (a, b) => (b ? Math.round(((a - b) / b) * 1000) / 10 : 0)

async function collect() {
  const [directory, members, payments, facilities, bookings, teams, sports, plans, revenue, growth] = await Promise.all([
    getAthleteDirectory(), getMembers(), getPayments(), getFacilities(), getBookings(), getTeams(), getSports(), getMembershipPlans(), getRevenueByMonth(), getAthleteGrowth(),
  ])
  const withState = members.map((m) => ({ ...m, state: membershipStatus(m) }))
  return { directory, members: withState, payments, facilities, bookings, teams, sports, plans, revenue, growth }
}

function demand(bookings, slots) {
  const grid = DAYS.map(() => slots.map(() => 0))
  bookings.forEach((b) => {
    const si = slots.indexOf(b.time)
    if (si >= 0) grid[dayIndex(b.date)][si]++
  })
  let best = { day: 0, slot: 0, count: -1 }
  grid.forEach((row, di) => row.forEach((count, si) => { if (count > best.count) best = { day: di, slot: si, count } }))
  // Hide weekend rows when there are no weekend bookings, to keep the grid compact.
  const useDays = DAYS.filter((_, i) => i < 5 || grid[i].some(Boolean))
  return { grid: grid.slice(0, useDays.length), days: useDays, slots, best, max: Math.max(best.count, 0) }
}

// Team performance table. Demo: results from fixtures. Real: competition entries (position, points).
async function teamPerformance(teams) {
  if (USE_MOCKS) {
    const records = {}
    mockCompetitions.forEach((c) => {
      competitionDetails[c.competitionId]?.fixtures.forEach((f) => {
        if (f.status !== 'Completed') return
        ;[[f.home, f.homeScore, f.awayScore], [f.away, f.awayScore, f.homeScore]].forEach(([team, gf, ga]) => {
          const r = (records[team] ||= { team, played: 0, won: 0, drawn: 0, lost: 0, points: 0 })
          r.played++
          if (gf > ga) { r.won++; r.points += 3 } else if (gf === ga) { r.drawn++; r.points++ } else r.lost++
        })
      })
    })
    const rows = Object.values(records).sort((a, b) => b.points - a.points).map((r) => [r.team, r.played, r.won, r.drawn, r.lost, `${Math.round((r.won / r.played) * 100)}%`, r.points])
    return { columns: ['Team', 'P', 'W', 'D', 'L', 'Win %', 'Pts'], rows, subtitle: 'Results from completed competitions' }
  }
  const raw = await loadAll()
  const rows = teams.map((t) => {
    const entries = raw.teamCompetitions.filter((e) => e.teamId === t.teamId)
    const positions = entries.map((e) => e.finalPosition).filter(Boolean)
    return [t.teamName, t.sport || '—', t.roster.length, entries.length, positions.length ? `#${Math.min(...positions)}` : '—', entries.reduce((s, e) => s + (e.pointsScored || 0), 0)]
  }).sort((a, b) => b[5] - a[5] || b[3] - a[3])
  return { columns: ['Team', 'Sport', 'Athletes', 'Competitions', 'Best finish', 'Points'], rows, subtitle: 'Competition entries and final positions' }
}

function attentionList(directory, members) {
  const flagged = new Map()
  const add = (id, name, sport, reason) => {
    const cur = flagged.get(id) || { athleteId: id, name, sport: sport || '—', reasons: [] }
    cur.reasons.push(reason)
    flagged.set(id, cur)
  }
  if (!USE_MOCKS) {
    directory.forEach((a) => {
      const drop = (a.attendanceEarlier ?? 0) - (a.attendanceRecent ?? 0)
      if (a.attendanceEarlier != null && drop >= 15) add(a.athleteId, a.name, a.sport, `Attendance down ${drop}% over recent sessions`)
    })
  }
  if (USE_MOCKS) {
    mockAthletes.forEach((a) => {
      const p = buildAthleteProfile(a)
      const drop = p.attendance.earlierRate - p.attendance.recentRate
      if (drop >= 15) add(a.athleteId, `${a.firstName} ${a.lastName}`, a.sport, `Attendance down ${drop}% over the last 12 sessions`)
    })
  }
  const seen = new Set()
  members.forEach((m) => {
    if (seen.has(m.athleteId)) return
    if (m.state.key === 'Expiring') { seen.add(m.athleteId); add(m.athleteId, m.name, m.sport, `Membership expires in ${m.state.days} days`) }
    if (m.state.key === 'Expired') { seen.add(m.athleteId); add(m.athleteId, m.name, m.sport, 'Membership expired') }
  })
  return [...flagged.values()].sort((a, b) => b.reasons.length - a.reasons.length)
}

export async function getAnalytics() {
  const d = await collect()
  const { members, facilities, bookings, revenue, growth, directory, payments } = d
  const state = { Active: 0, Expiring: 0, Expired: 0, Pending: 0, Suspended: 0 }
  members.forEach((m) => { state[m.state.key]++ })
  const membershipBreakdown = [
    { name: 'Active', value: state.Active, color: '#10b981' },
    { name: 'Expiring soon', value: state.Expiring, color: '#f59e0b' },
    { name: 'Expired', value: state.Expired, color: '#ef4444' },
    { name: 'Pending', value: state.Pending + state.Suspended, color: '#94a3b8' },
  ].filter((m) => m.value > 0)

  const sportCounts = d.sports.map((s) => ({ name: s.name, value: directory.filter((a) => a.sport === s.name).length, color: s.color })).filter((s) => s.value > 0)
  const facilityUse = facilities.map((f) => ({ name: f.name.replace(' Court', '').replace(' Pitch', ''), utilization: f.utilization }))

  const totals = revenue.map((m) => m.memberships + m.competitions + m.facilities + m.other)
  const last = totals.at(-1) ?? 0
  const revChange = pct(last, totals.at(-2) ?? 0)
  const growthChange = growth.length > 1 ? pct(growth.at(-1).athletes, growth.at(-2).athletes) : 0

  const monthly = (m) => d.plans.find((p) => p.name === m.type)?.monthly ?? d.plans.find((p) => p.name === m.type)?.price ?? 0
  const expiring = members.filter((m) => m.state.key === 'Expiring')
  const atRisk = expiring.reduce((s, m) => s + monthly(m), 0)
  const dm = demand(bookings, bookingConfig.slots)
  const busiestFacility = [...facilities].sort((a, b) => b.utilization - a.utilization)[0]
  const attention = attentionList(directory, members)
  const withAttendance = directory.filter((a) => a.attendance != null)
  const avgAttendance = withAttendance.length ? Math.round(withAttendance.reduce((s, a) => s + a.attendance, 0) / withAttendance.length) : null
  const decliners = attention.filter((a) => a.reasons.some((r) => r.startsWith('Attendance'))).length

  const insights = []
  if (revenue.length > 1) insights.push({ tone: revChange >= 0 ? 'green' : 'red', title: 'Revenue', text: `Monthly revenue ${revChange >= 0 ? 'increased' : 'decreased'} ${Math.abs(revChange)}% compared with the previous month.` })
  else if (revenue.length === 1) insights.push({ tone: 'blue', title: 'Revenue', text: `${money(last)} collected in ${revenue[0].month}. More months are needed to show a trend.` })
  if (expiring.length) insights.push({ tone: 'amber', title: 'Memberships', text: `${expiring.length} memberships are likely to expire within the next 30 days, around ${money(atRisk)} in monthly fees.` })
  else insights.push({ tone: 'green', title: 'Memberships', text: `No memberships expire in the next 30 days. ${state.Expired} have already expired.` })
  if (dm.best.count > 0 && busiestFacility) insights.push({ tone: 'blue', title: 'Facility demand', text: `${dm.days[dm.best.day]} ${dm.slots[dm.best.slot]} has the highest booking demand. ${busiestFacility.name} is the most utilized facility at ${busiestFacility.utilization}%.` })
  if (avgAttendance != null) insights.push({ tone: 'red', title: 'Retention', text: `${decliners} athletes show declining attendance. Review them in the attention list below.` })

  return {
    kpis: {
      revenue: last, revChange, revenueLabel: revenue.at(-1)?.month || '',
      athletes: directory.length, growth: growthChange,
      retention: members.length ? Math.round(((state.Active + state.Expiring) / members.length) * 100) : 0,
      attendance: avgAttendance,
      utilization: facilities.length ? Math.round(facilities.reduce((s, f) => s + f.utilization, 0) / facilities.length) : 0,
    },
    athleteGrowth: growth, revenueByMonth: revenue, membershipBreakdown, sportCounts, facilityUse,
    teamPerformance: await teamPerformance(d.teams),
    heatmap: dm, insights, attention, pendingPayments: payments.filter((p) => p.status === 'Pending'),
  }
}

// ---------- Reports ----------
function ageOf(dob) {
  return dob ? Math.floor((new Date(TODAY_ISO) - new Date(dob)) / (365.25 * 86400000)) : ''
}

export async function getReports() {
  const d = await collect()
  const paid = d.payments.filter((p) => p.status === 'Paid')
  const sum = (list) => list.reduce((s, p) => s + p.amount, 0)
  const male = d.directory.filter((a) => a.gender === 'Male').length
  const ages = d.directory.map((a) => a.age).filter((a) => a != null)
  const memberByAthlete = new Map()
  d.members.forEach((m) => { if (!memberByAthlete.has(m.athleteId)) memberByAthlete.set(m.athleteId, m.state.key) })

  const athlete = {
    key: 'athlete', title: 'Athlete report', description: 'Roster, demographics and membership status.',
    summary: [
      { label: 'Total athletes', value: d.directory.length },
      { label: 'Male / Female', value: `${male} / ${d.directory.filter((a) => a.gender === 'Female').length}` },
      { label: 'Average age', value: ages.length ? (ages.reduce((s, a) => s + a, 0) / ages.length).toFixed(1) : '—' },
      { label: 'Sports', value: new Set(d.directory.map((a) => a.sport).filter(Boolean)).size },
    ],
    columns: ['Athlete ID', 'Name', 'Sport', 'Team', 'Position', 'Gender', 'Age', 'Membership'],
    rows: d.directory.map((a) => [`A-${String(a.athleteId).padStart(4, '0')}`, a.name, a.sport || '', a.team || '', a.position || '', a.gender || '', a.age ?? ageOf(a.dateOfBirth), memberByAthlete.get(a.athleteId) || a.membership || 'None']),
  }

  const financial = {
    key: 'financial', title: 'Financial report', description: 'Revenue, outstanding balances and every transaction.',
    summary: [
      { label: 'Revenue collected', value: money(sum(paid)) },
      { label: 'Membership income', value: money(sum(paid.filter((p) => p.type === 'Membership'))) },
      { label: 'Facility income', value: money(sum(paid.filter((p) => p.type === 'Facility booking'))) },
      { label: 'Outstanding', value: money(sum(d.payments.filter((p) => p.status === 'Pending'))) },
    ],
    columns: ['ID', 'Date', 'Member', 'Type', 'Method', 'Amount (GHS)', 'Status'],
    rows: d.payments.map((p) => [p.id, p.date, p.member, p.type, p.method, p.amount, p.status]),
  }

  const tp = await teamPerformance(d.teams)
  const performance = {
    key: 'performance', title: 'Performance report', description: USE_MOCKS ? 'Team results and standings.' : 'Team competition entries and final positions. Match results and attendance are not tracked yet.',
    summary: [
      { label: 'Teams', value: d.teams.length },
      { label: 'Teams with results', value: tp.rows.length },
      { label: 'Competitions', value: (await getCompetitions()).length },
      { label: 'Athletes on a team', value: d.directory.filter((a) => a.team).length },
    ],
    columns: tp.columns, rows: tp.rows,
  }

  const facility = {
    key: 'facility', title: 'Facility report', description: 'Usage, booking frequency and status per facility.',
    summary: [
      { label: 'Facilities', value: d.facilities.length },
      { label: 'Bookings', value: d.bookings.length },
      { label: 'Pending approval', value: d.bookings.filter((b) => b.status === 'Pending').length },
      { label: 'Average utilization', value: d.facilities.length ? `${Math.round(d.facilities.reduce((s, f) => s + f.utilization, 0) / d.facilities.length)}%` : '—' },
    ],
    columns: ['Facility', 'Type', 'Capacity', 'Status', 'Utilization', 'Bookings', 'Pending'],
    rows: d.facilities.map((f) => {
      const list = d.bookings.filter((b) => b.facilityId === f.id)
      return [f.name, f.type, f.capacity, f.status, `${f.utilization}%`, list.length, list.filter((b) => b.status === 'Pending').length]
    }),
  }
  return [athlete, financial, performance, facility]
}


// ---------- Analytics overview (Analytics page) ----------
// Real mode: the server aggregates for any date range and compares with the previous period.
// Demo mode: the same shape built from sample data (the range only changes the labels).
const SEVERITY = { green: 'success', amber: 'warning', red: 'danger', blue: 'info' }

async function demoOverview({ from, to }) {
  const a = await getAnalytics()
  const d = await collect()
  const total = (m) => m.memberships + m.competitions + m.facilities + m.other
  const rev = a.revenueByMonth
  const monthKey = (i, base = 4) => `2026-${String(base + i).padStart(2, '0')}`
  const growthKey = (i) => `2026-${String(1 + i).padStart(2, '0')}`
  const active = a.membershipBreakdown.filter((m) => m.name === 'Active' || m.name === 'Expiring soon').reduce((s, m) => s + m.value, 0)
  const metric = (value, previous) => ({ value, previous, changePct: previous ? Math.round(((value - previous) / previous) * 1000) / 10 : null })
  const gender = {}
  mockAthletes.forEach((x) => { gender[x.gender] = (gender[x.gender] || 0) + 1 })
  const bands = { 'Under 18': 0, '18–21': 0, '22–25': 0, '26–30': 0, '31+': 0 }
  mockAthletes.forEach((x) => {
    const age = Math.floor((new Date(TODAY_ISO) - new Date(x.dateOfBirth)) / (365.25 * 86400000))
    bands[age < 18 ? 'Under 18' : age <= 21 ? '18–21' : age <= 25 ? '22–25' : age <= 30 ? '26–30' : '31+']++
  })
  const methods = {}
  d.payments.filter((p) => p.status === 'Paid').forEach((p) => { methods[p.method] = (methods[p.method] || 0) + p.amount })
  const plans = {}
  d.members.filter((m) => m.state.key === 'Active' || m.state.key === 'Expiring').forEach((m) => { plans[m.type] = (plans[m.type] || 0) + 1 })
  const pending = d.payments.filter((p) => p.status === 'Pending')
  return {
    period: { from, to }, previous: { from, to },
    kpis: {
      revenue: metric(a.kpis.revenue, total(rev.at(-2))),
      newAthletes: metric(a.athleteGrowth.at(-1).athletes - a.athleteGrowth.at(-2).athletes, a.athleteGrowth.at(-2).athletes - a.athleteGrowth.at(-3).athletes),
      activeMemberships: metric(active, Math.round(active * 0.95)),
      renewalRate: metric(71, 68), attendanceRate: metric(a.kpis.attendance ?? 0, (a.kpis.attendance ?? 0) - 2),
      facilityUtilization: metric(a.kpis.utilization, Math.max(0, a.kpis.utilization - 4)), fixturesPlayed: metric(14, 6),
    },
    revenueByMonth: rev.map((m, i) => ({ month: monthKey(i), value: total(m) })),
    athleteGrowth: a.athleteGrowth.map((m, i) => ({ month: growthKey(i), value: m.athletes })),
    attendanceByMonth: [78, 81, 80, 84, 83, 85].map((v, i) => ({ month: monthKey(i), value: v })),
    membershipStatus: a.membershipBreakdown.map((m) => ({ name: m.name, value: m.value })),
    sports: a.sportCounts.map((x) => ({ name: x.name, value: x.value })),
    gender: Object.entries(gender).map(([name, value]) => ({ name, value })),
    ageBands: Object.entries(bands).map(([name, value]) => ({ name, value })),
    paymentMethods: Object.entries(methods).map(([name, value]) => ({ name, value })),
    plans: Object.entries(plans).map(([name, value]) => ({ name, value })),
    facilities: d.facilities.map((f) => ({ facilityId: f.id, name: f.name, type: f.type, status: f.status, bookings: d.bookings.filter((b) => b.facilityId === f.id).length, utilization: f.utilization })),
    heatmap: { days: a.heatmap.days, slots: a.heatmap.slots, grid: a.heatmap.grid },
    teams: a.teamPerformance.rows.map((r, i) => ({ teamId: i + 1, name: r[0], sport: 'Football', athletes: 14, played: r[1], won: r[2], drawn: r[3], lost: r[4], points: r[6], attendanceRate: 80 + (i % 4) * 4, averageRating: 70 + (i % 5) * 3 })),
    insights: a.insights.map((i) => ({ severity: SEVERITY[i.tone] || 'info', title: i.title, text: i.text, link: '/analytics' })),
    attention: a.attention.slice(0, 20).map((x) => ({ athleteId: x.athleteId, name: x.name, sport: x.sport, reasons: x.reasons })),
    outstanding: { amount: pending.reduce((s, p) => s + p.amount, 0), memberships: pending.length },
  }
}

export async function getOverview({ from, to }) {
  if (USE_MOCKS) return demoOverview({ from, to })
  const { data } = await apiClient.get('/analytics/overview', { params: { from, to } })
  return data
}
