import { mockAthletes, mockCompetitions, mockTeams } from '../mocks/mockData'
import { buildAthleteProfile, membershipFor, planPrices } from '../mocks/athleteData'
import { competitionDetails } from '../mocks/competitionData'
import { athleteGrowth, revenueByMonth, sports } from '../mocks/demoData'
import { initialBookings, initialFacilities, initialPayments, timeSlots, weekDays } from '../mocks/operationsData'
import { membershipStatus } from '../utils/membership'

// Analytics and reports are derived from the same demo data the other pages use, so the
// numbers agree across the app. Swap `collect()` for API calls when the backend is ready.
const delay = (ms = 600) => new Promise((resolve) => setTimeout(resolve, ms))

function age(dob) {
  const d = new Date(dob)
  const now = new Date('2026-09-29')
  let a = now.getFullYear() - d.getFullYear()
  if (now < new Date(now.getFullYear(), d.getMonth(), d.getDate())) a--
  return a
}

function collect() {
  const profiles = mockAthletes.map((a) => buildAthleteProfile(a))
  const members = mockAthletes.map((a) => {
    const m = membershipFor(a.athleteId)
    return { athlete: a, ...m, state: membershipStatus(m) }
  })

  const records = {}
  mockCompetitions.forEach((c) => {
    competitionDetails[c.competitionId]?.fixtures.forEach((f) => {
      if (f.status !== 'Completed') return
      ;[[f.home, f.homeScore, f.awayScore], [f.away, f.awayScore, f.homeScore]].forEach(([team, gf, ga]) => {
        const r = (records[team] ||= { team, sport: c.sport, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0 })
        r.played++; r.gf += gf; r.ga += ga
        if (gf > ga) { r.won++; r.points += 3 } else if (gf === ga) { r.drawn++; r.points++ } else r.lost++
      })
    })
  })

  return { profiles, members, records }
}

function demand() {
  const grid = weekDays.map((d) => timeSlots.map((t) => initialBookings.filter((b) => b.date === d.date && b.time === t).length))
  let best = { day: 0, slot: 0, count: -1 }
  grid.forEach((row, di) => row.forEach((count, si) => { if (count > best.count) best = { day: di, slot: si, count } }))
  return { grid, best, max: best.count }
}

export async function getAnalytics() {
  await delay()
  const { profiles, members, records } = collect()

  const byState = { Active: 0, Expiring: 0, Expired: 0, Pending: 0 }
  members.forEach((m) => { byState[m.state.key]++ })
  const membershipBreakdown = [
    { name: 'Active', value: byState.Active, color: '#10b981' },
    { name: 'Expiring soon', value: byState.Expiring, color: '#f59e0b' },
    { name: 'Expired', value: byState.Expired, color: '#ef4444' },
    { name: 'Pending', value: byState.Pending, color: '#94a3b8' },
  ]

  const sportCounts = sports.map((s) => ({ name: s.name, value: mockAthletes.filter((a) => a.sport === s.name).length, color: s.color }))
  const facilityUse = initialFacilities.map((f) => ({ name: f.name.replace(' Court', '').replace(' Pitch', ''), utilization: f.utilization }))

  const teamRows = Object.values(records)
    .map((r) => ({ ...r, winRate: Math.round((r.won / r.played) * 100) }))
    .sort((a, b) => b.points - a.points || (b.gf - b.ga) - (a.gf - a.ga))

  const revTotals = revenueByMonth.map((m) => m.memberships + m.competitions + m.facilities + m.other)
  const last = revTotals.at(-1)
  const prev = revTotals.at(-2)
  const revChange = Math.round(((last - prev) / prev) * 1000) / 10

  const expiringMembers = members.filter((m) => m.state.key === 'Expiring')
  const atRisk = expiringMembers.reduce((s, m) => s + planPrices[m.type], 0)
  const d = demand()
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
  const busiestFacility = [...initialFacilities].sort((a, b) => b.utilization - a.utilization)[0]

  const attention = profiles
    .map((p) => {
      const reasons = []
      const drop = p.attendance.earlierRate - p.attendance.recentRate
      if (drop >= 15) reasons.push(`Attendance down ${drop}% over the last 12 sessions`)
      const ms = membershipStatus(p.membership)
      if (ms.key === 'Expiring') reasons.push(`Membership expires in ${ms.days} days`)
      if (ms.key === 'Expired') reasons.push('Membership expired')
      return { athleteId: p.athleteId, name: `${p.firstName} ${p.lastName}`, sport: p.sport, reasons }
    })
    .filter((a) => a.reasons.length > 0)
    .sort((a, b) => b.reasons.length - a.reasons.length)

  const decliners = attention.filter((a) => a.reasons.some((r) => r.startsWith('Attendance'))).length
  const avgAttendance = Math.round(profiles.reduce((s, p) => s + p.attendance.rate, 0) / profiles.length)
  const utilization = Math.round(initialFacilities.reduce((s, f) => s + f.utilization, 0) / initialFacilities.length)

  return {
    kpis: {
      revenue: last,
      revChange,
      athletes: mockAthletes.length,
      growth: Math.round(((athleteGrowth.at(-1).athletes - athleteGrowth.at(-2).athletes) / athleteGrowth.at(-2).athletes) * 1000) / 10,
      retention: Math.round(((byState.Active + byState.Expiring) / members.length) * 100),
      attendance: avgAttendance,
      utilization,
    },
    athleteGrowth,
    revenueByMonth,
    membershipBreakdown,
    sportCounts,
    facilityUse,
    teamRows,
    heatmap: { ...d, days: weekDays.map((w) => w.key), slots: timeSlots },
    insights: [
      { tone: 'green', title: 'Revenue', text: `Monthly revenue ${revChange >= 0 ? 'increased' : 'decreased'} ${Math.abs(revChange)}% compared with the previous month.` },
      { tone: 'amber', title: 'Memberships', text: `${expiringMembers.length} memberships are likely to expire within the next 30 days, around GH₵${atRisk.toLocaleString('en-GH')} in monthly fees.` },
      { tone: 'blue', title: 'Facility demand', text: `${dayNames[d.best.day]} ${timeSlots[d.best.slot]} has the highest booking demand. ${busiestFacility.name} is the most utilized facility at ${busiestFacility.utilization}%.` },
      { tone: 'red', title: 'Retention', text: `${decliners} athletes show declining attendance. Review them in the attention list below.` },
    ],
    attention,
  }
}

// ---------- Reports ----------
export async function getReports() {
  await delay(500)
  const { profiles, members, records } = collect()
  const paid = initialPayments.filter((p) => p.status === 'Paid')
  const sum = (list) => list.reduce((s, p) => s + p.amount, 0)
  const byType = (t) => sum(paid.filter((p) => p.type === t))
  const money = (v) => `GH₵${v.toLocaleString('en-GH')}`
  const male = mockAthletes.filter((a) => a.gender === 'Male').length

  const athlete = {
    key: 'athlete', title: 'Athlete report', description: 'Roster, demographics and membership status.',
    summary: [
      { label: 'Total athletes', value: mockAthletes.length },
      { label: 'Male / Female', value: `${male} / ${mockAthletes.length - male}` },
      { label: 'Average age', value: (mockAthletes.reduce((s, a) => s + age(a.dateOfBirth), 0) / mockAthletes.length).toFixed(1) },
      { label: 'Sports', value: new Set(mockAthletes.map((a) => a.sport)).size },
    ],
    columns: ['Athlete ID', 'Name', 'Sport', 'Team', 'Position', 'Gender', 'Age', 'Membership'],
    rows: members.map((m) => {
      const a = m.athlete
      return [`A-${String(a.athleteId).padStart(4, '0')}`, `${a.firstName} ${a.lastName}`, a.sport, mockTeams.find((t) => t.teamId === a.teamId)?.teamName || '', a.position, a.gender, age(a.dateOfBirth), m.state.key]
    }),
  }

  const financial = {
    key: 'financial', title: 'Financial report', description: 'Revenue by source, outstanding balances and every transaction.',
    summary: [
      { label: 'Revenue collected', value: money(sum(paid)) },
      { label: 'Membership income', value: money(byType('Membership')) },
      { label: 'Facility income', value: money(byType('Facility booking')) },
      { label: 'Outstanding', value: money(sum(initialPayments.filter((p) => p.status === 'Pending'))) },
    ],
    columns: ['ID', 'Date', 'Member', 'Type', 'Method', 'Amount (GHS)', 'Status'],
    rows: initialPayments.map((p) => [p.id, p.date, p.member, p.type, p.method, p.amount, p.status]),
  }

  const teamRows = mockTeams.map((t) => {
    const roster = profiles.filter((p) => p.teamId === t.teamId)
    const r = records[t.teamName] || { played: 0, won: 0, drawn: 0, lost: 0, points: 0 }
    const avg = (f) => (roster.length ? Math.round(roster.reduce((s, p) => s + f(p), 0) / roster.length) : 0)
    return [t.teamName, t.sport, roster.length, r.played, r.won, r.drawn, r.lost, r.points, `${avg((p) => p.attendance.rate)}%`, avg((p) => p.performance.trend.at(-1).score)]
  })
  const performance = {
    key: 'performance', title: 'Performance report', description: 'Team results, attendance and performance scores.',
    summary: [
      { label: 'Teams', value: mockTeams.length },
      { label: 'Matches played', value: Object.values(records).reduce((s, r) => s + r.played, 0) / 2 },
      { label: 'Average attendance', value: `${Math.round(profiles.reduce((s, p) => s + p.attendance.rate, 0) / profiles.length)}%` },
      { label: 'Average score', value: Math.round(profiles.reduce((s, p) => s + p.performance.trend.at(-1).score, 0) / profiles.length) },
    ],
    columns: ['Team', 'Sport', 'Athletes', 'Played', 'Won', 'Drawn', 'Lost', 'Points', 'Avg attendance', 'Avg score'],
    rows: teamRows,
  }

  const facility = {
    key: 'facility', title: 'Facility report', description: 'Usage, booking frequency and status per facility.',
    summary: [
      { label: 'Facilities', value: initialFacilities.length },
      { label: 'Bookings this week', value: initialBookings.length },
      { label: 'Pending approval', value: initialBookings.filter((b) => b.status === 'Pending').length },
      { label: 'Average utilization', value: `${Math.round(initialFacilities.reduce((s, f) => s + f.utilization, 0) / initialFacilities.length)}%` },
    ],
    columns: ['Facility', 'Type', 'Capacity', 'Status', 'Utilization', 'Bookings', 'Pending'],
    rows: initialFacilities.map((f) => {
      const list = initialBookings.filter((b) => b.facilityId === f.id)
      return [f.name, f.type, f.capacity, f.status, `${f.utilization}%`, list.length, list.filter((b) => b.status === 'Pending').length]
    }),
  }

  return [athlete, financial, performance, facility]
}
