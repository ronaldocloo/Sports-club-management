import apiClient, { USE_MOCKS } from './client'
import { mockTeams } from '../mocks/mockData'

export async function getTeams() {
  if (USE_MOCKS) {
    return mockTeams
  }
  const response = await apiClient.get('/teams')
  return response.data
}

export async function getTeamById(teamId) {
  if (USE_MOCKS) {
    return mockTeams.find((team) => team.teamId === Number(teamId))
  }
  const response = await apiClient.get(`/teams/${teamId}`)
  return response.data
}
