import apiClient, { USE_MOCKS } from './client'
import { mockTeams } from '../mocks/mockData'

// Demo mode only: teams added this session.
const sessionTeams = []

export async function getTeams() {
  if (USE_MOCKS) {
    return [...sessionTeams, ...mockTeams]
  }
  const response = await apiClient.get('/teams')
  return response.data
}

export async function getTeamById(teamId) {
  if (USE_MOCKS) {
    return [...sessionTeams, ...mockTeams].find((team) => team.teamId === Number(teamId))
  }
  const response = await apiClient.get(`/teams/${teamId}`)
  return response.data
}

// Team creation needs backend sport and coach IDs, which the UI does not have yet.
// Until API integration, new teams exist in demo mode only.
export async function createTeam(data) {
  if (!USE_MOCKS) throw new Error('Team creation is not connected to the backend yet')
  await new Promise((r) => setTimeout(r, 500))
  const team = { teamId: Date.now(), teamName: data.name, sport: data.sport, coachName: data.coachName || 'Unassigned', roster: [], competitions: [] }
  sessionTeams.unshift(team)
  return team
}
