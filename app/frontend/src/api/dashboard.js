import { getAnalytics } from './analytics'
import { getCoaches } from './coaches'
import { getCompetitions } from './competitions'
import { getTeams } from './teams'
import { getEvents, getPayments, getRecentActivity } from './operations'
import { kpis as kpiTrends } from '../mocks/demoData'
import { TODAY_ISO } from '../utils/today'
import { USE_MOCKS } from './client'

// Dashboard numbers are computed from the same data as every other page.
export async function getDashboard() {
  const [analytics, teams, coaches, competitions, events, payments, activity] = await Promise.all([
    getAnalytics(), getTeams().catch(() => []), getCoaches().catch(() => []), getCompetitions(), getEvents(), getPayments().catch(() => []), getRecentActivity(),
  ])
  const counts = Object.fromEntries(analytics.membershipBreakdown.map((m) => [m.name, m.value]))
  const upcomingEvents = events
    .filter((e) => e.date >= TODAY_ISO && e.status !== 'Completed')
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
  const upcomingComps = competitions.filter((c) => c.status === 'Upcoming' || c.status === 'Ongoing')
  const outstanding = payments.filter((p) => p.status === 'Pending').reduce((s, p) => s + p.amount, 0)
  const demoTrend = (key) => (USE_MOCKS ? kpiTrends.find((k) => k.key === key)?.trend : undefined)

  return {
    kpis: {
      athletes: { value: analytics.kpis.athletes, trend: analytics.kpis.growth || undefined, note: 'vs last month' },
      teams: { value: teams.length, trend: demoTrend('teams'), note: `across ${new Set(teams.map((t) => t.sport).filter(Boolean)).size} sports` },
      coaches: { value: coaches.length, note: `${coaches.filter((c) => c.status === 'Active').length} active` },
      memberships: { value: (counts.Active || 0) + (counts['Expiring soon'] || 0), trend: demoTrend('memberships'), note: `${counts['Expiring soon'] || 0} expiring in 30 days` },
      competitions: { value: upcomingComps.length, note: upcomingComps[0] ? `next: ${upcomingComps[0].competitionName}` : 'none scheduled' },
      outstanding: { value: outstanding, money: true, note: 'pending payments' },
      utilization: { value: analytics.kpis.utilization, suffix: '%', note: 'across facilities' },
      events: { value: upcomingEvents.length, trend: demoTrend('events'), note: 'scheduled' },
    },
    analytics,
    upcomingEvents: upcomingEvents.slice(0, 5),
    activity,
  }
}
