// Sample profile data (attendance, performance, membership, history) generated per athlete.
// Deterministic so the demo looks the same on every load. Replace with API data later.
import { mockCoachNames, mockTeams } from './mockData'
import { competitionDetails } from './competitionData'
import { mockCompetitions } from './mockData'

function rng(seed) {
  let s = seed * 2654435761 % 4294967296
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
}

const memberOverrides = {
  4: { type: 'Standard', start: '2025-10-07', expiry: '2026-10-06', payment: 'Paid' },
  7: { type: 'Student', start: '2025-09-01', expiry: '2026-09-01', payment: 'Overdue' },
  8: { type: 'Student', start: '2026-03-01', expiry: '2026-12-31', payment: 'Pending' },
}

export const planPrices = { Student: 100, Standard: 200, Premium: 350 }

// One membership per athlete, roughly: 82% active, 11% expiring, 4% expired, 3% pending.
export function membershipFor(athleteId) {
  if (memberOverrides[athleteId]) return memberOverrides[athleteId]
  const r = rng(athleteId * 31 + 5)
  const type = r() < 0.4 ? 'Student' : r() < 0.66 ? 'Standard' : 'Premium'
  const x = r()
  if (x < 0.11) return { type, start: '2025-10-15', expiry: `2026-10-${String(2 + Math.floor(r() * 26)).padStart(2, '0')}`, payment: 'Paid' }
  if (x < 0.15) return { type, start: '2025-08-01', expiry: `2026-09-${String(1 + Math.floor(r() * 20)).padStart(2, '0')}`, payment: 'Overdue' }
  if (x < 0.18) return { type, start: '2026-09-25', expiry: '2027-09-24', payment: 'Pending' }
  return { type, start: '2026-01-05', expiry: '2027-01-04', payment: 'Paid' }
}

function sportStats(a, r) {
  const n = (min, max) => Math.round(min + r() * (max - min))
  switch (a.sport) {
    case 'Football':
      return /goalkeeper/i.test(a.position)
        ? { games: n(18, 26), wins: n(9, 15), stats: [{ label: 'Clean sheets', value: n(6, 11) }, { label: 'Saves', value: n(60, 110) }] }
        : { games: n(18, 26), wins: n(9, 15), stats: [{ label: 'Goals', value: /forward|winger/i.test(a.position) ? n(8, 18) : n(1, 5) }, { label: 'Assists', value: n(2, 10) }] }
    case 'Basketball':
      return { games: n(16, 24), wins: n(9, 15), stats: [{ label: 'Points / game', value: n(9, 19) }, { label: 'Rebounds / game', value: n(3, 8) }, { label: 'Assists / game', value: n(2, 7) }] }
    case 'Athletics':
      return { games: n(12, 20), wins: n(4, 9), stats: [{ label: 'Personal best', value: /sprint/i.test(a.position) ? `11.${n(5, 9)}s (100m)` : `14.${n(1, 8)}s (100m H)` }, { label: 'Medals', value: n(2, 7) }] }
    case 'Volleyball':
      return { games: n(20, 30), wins: n(11, 18), stats: [{ label: 'Assists (sets)', value: n(90, 180) }, { label: 'Aces', value: n(12, 30) }] }
    case 'Swimming':
      return { games: n(8, 14), wins: n(3, 8), stats: [{ label: 'Best 100m free', value: `1:0${n(0, 8)}.${n(10, 99)}` }, { label: 'Medals', value: n(2, 6) }] }
    default:
      return { games: 0, wins: 0, stats: [] }
  }
}

export function buildAthleteProfile(athlete) {
  const r = rng(athlete.athleteId + 7)
  const team = mockTeams.find((t) => t.teamId === athlete.teamId)

  // 24 training sessions, oldest -> newest
  const roll = () => {
    const x = r()
    return x < 0.72 ? 'Present' : x < 0.85 ? 'Late' : x < 0.94 ? 'Absent' : 'Excused'
  }
  const sessions = Array.from({ length: 24 }, roll)
  const counts = { Present: 0, Late: 0, Absent: 0, Excused: 0 }
  sessions.forEach((s) => { counts[s]++ })
  const rate = (list) => Math.round((list.filter((s) => s === 'Present' || s === 'Late').length / list.length) * 100)
  const attendanceRate = rate(sessions)
  const recentRate = rate(sessions.slice(12))
  const earlierRate = rate(sessions.slice(0, 12))

  const base = 62 + Math.round(r() * 12)
  const trend = Array.from({ length: 8 }, (_, i) => ({ week: `W${i + 1}`, score: Math.min(98, Math.round(base + i * (1 + r() * 2) + r() * 4)) }))

  const perf = sportStats(athlete, r)

  const history = []
  mockCompetitions.forEach((c) => {
    const details = competitionDetails[c.competitionId]
    details?.fixtures.forEach((f) => {
      if (f.status !== 'Completed' || !team) return
      const home = f.home === team.teamName
      if (!home && f.away !== team.teamName) return
      const mine = home ? f.homeScore : f.awayScore
      const theirs = home ? f.awayScore : f.homeScore
      history.push({ competition: c.competitionName, round: f.round, date: f.date, team: team.teamName, opponent: home ? f.away : f.home, score: `${mine}–${theirs}`, result: mine > theirs ? 'Win' : mine < theirs ? 'Loss' : 'Draw' })
    })
  })
  history.sort((a, b) => b.date.localeCompare(a.date))

  return {
    ...athlete,
    teamName: team?.teamName || 'Unassigned',
    coachName: team ? mockCoachNames[team.teamId] : 'Unassigned',
    status: 'Active',
    membership: membershipFor(athlete.athleteId),
    attendance: { sessions, counts, rate: attendanceRate, recentRate, earlierRate },
    performance: { gamesPlayed: perf.games, wins: perf.wins, stats: perf.stats, trend },
    history,
    sampleData: true,
  }
}
