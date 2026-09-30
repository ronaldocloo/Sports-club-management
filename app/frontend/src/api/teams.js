import apiClient, { USE_MOCKS } from './client'
import { invalidate, loadAll } from './raw'
import { teamsOf } from './realData'
import { mockTeams } from '../mocks/mockData'
import { TODAY_ISO } from '../utils/today'

// Demo mode only: teams added this session.
const sessionTeams = []

export async function getTeams() {
  if (USE_MOCKS) return [...sessionTeams, ...mockTeams]
  return teamsOf(await loadAll())
}

export async function getTeamById(teamId) {
  return (await getTeams()).find((team) => team.teamId === Number(teamId))
}

// Real API: needs the sport and coach IDs, so the form passes ids (from getSports / getCoaches).
export async function createTeam(data) {
  if (USE_MOCKS) {
    await new Promise((r) => setTimeout(r, 500))
    const team = { teamId: Date.now(), teamName: data.name, sport: data.sport, coachName: data.coachName || 'Unassigned', roster: [], competitions: [] }
    sessionTeams.unshift(team)
    return team
  }
  const { data: t } = await apiClient.post('/teams', { teamName: data.name, sportId: Number(data.sportId), coachId: Number(data.coachId), foundedDate: TODAY_ISO })
  invalidate()
  return { teamId: t.teamId, teamName: t.teamName, sport: data.sport, coachName: data.coachName || 'Unassigned', roster: [], competitions: [] }
}
