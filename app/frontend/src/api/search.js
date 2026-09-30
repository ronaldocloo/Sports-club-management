import { getAthletes } from './athletes'
import { getTeams } from './teams'
import { getCompetitions } from './competitions'
import { getCoaches } from './coaches'
import { getFacilities } from './operations'

// Builds the global-search index from whatever data source is active. Cached per page load.
let cached = null

export async function getSearchIndex() {
  if (cached) return cached
  const [athletes, teams, competitions, coaches, facilities] = await Promise.all([
    getAthletes(), getTeams().catch(() => []), getCompetitions().catch(() => []), getCoaches().catch(() => []), getFacilities().catch(() => []),
  ])
  cached = [
    ...athletes.map((a) => ({ type: 'Athletes', label: `${a.firstName} ${a.lastName}`, sub: [a.sport, a.position].filter(Boolean).join(' · ') || 'Athlete', to: `/athletes/${a.athleteId}` })),
    ...teams.map((t) => ({ type: 'Teams', label: t.teamName, sub: t.sport || 'Team', to: `/teams/${t.teamId}` })),
    ...competitions.map((c) => ({ type: 'Competitions', label: c.competitionName, sub: [c.date, c.location].filter(Boolean).join(' · '), to: `/competitions/${c.competitionId}` })),
    ...coaches.map((c) => ({ type: 'Coaches', label: `${c.firstName} ${c.lastName}`, sub: c.specialization || 'Coach', to: `/coaches/${c.coachId}` })),
    ...facilities.map((f) => ({ type: 'Facilities', label: f.name, sub: f.type, to: '/facilities' })),
  ]
  return cached
}
