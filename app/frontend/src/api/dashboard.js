import { getAnalytics } from './analytics'
import { mockCompetitions } from '../mocks/mockData'
import { mockCoaches } from '../mocks/coachData'
import { mockTeams } from '../mocks/mockData'
import { initialEvents, initialFacilities, initialPayments } from '../mocks/operationsData'
import { auditLog } from '../mocks/auditData'
import { kpis as kpiTrends } from '../mocks/demoData'

const TODAY = '2026-09-29'

// Dashboard numbers are computed from the same demo data as every other page.
export async function getDashboard() {
  const analytics = await getAnalytics()
  const counts = Object.fromEntries(analytics.membershipBreakdown.map((m) => [m.name, m.value]))
  const upcomingEvents = initialEvents
    .filter((e) => e.date >= TODAY && e.status !== 'Completed')
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
  const upcomingComps = mockCompetitions.filter((c) => c.status === 'Upcoming' || c.status === 'Ongoing')
  const outstanding = initialPayments.filter((p) => p.status === 'Pending').reduce((s, p) => s + p.amount, 0)
  const trend = (key) => kpiTrends.find((k) => k.key === key)?.trend

  return {
    kpis: {
      athletes: { value: analytics.kpis.athletes, trend: analytics.kpis.growth, note: 'vs last month' },
      teams: { value: mockTeams.length, trend: trend('teams'), note: 'across 6 sports' },
      coaches: { value: mockCoaches.length, note: `${mockCoaches.filter((c) => c.status === 'Active').length} active` },
      memberships: { value: counts.Active + counts['Expiring soon'], trend: trend('memberships'), note: `${counts['Expiring soon']} expiring in 30 days` },
      competitions: { value: upcomingComps.length, note: `next: ${upcomingComps[0]?.competitionName || 'none'}` },
      outstanding: { value: outstanding, money: true, note: 'pending payments' },
      utilization: { value: analytics.kpis.utilization, suffix: '%', note: 'across facilities' },
      events: { value: upcomingEvents.length, trend: trend('events'), note: 'scheduled' },
    },
    analytics,
    upcomingEvents: upcomingEvents.slice(0, 5),
    activity: auditLog.slice(0, 6),
    facilities: initialFacilities,
  }
}
