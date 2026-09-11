import apiClient, { USE_MOCKS } from './client'
import { mockCompetitions } from '../mocks/mockData'

export async function getCompetitions() {
  if (USE_MOCKS) {
    return mockCompetitions
  }
  const response = await apiClient.get('/competitions')
  return response.data
}

export async function getCompetitionById(competitionId) {
  if (USE_MOCKS) {
    return mockCompetitions.find(
      (competition) => competition.competitionId === Number(competitionId),
    )
  }
  const response = await apiClient.get(`/competitions/${competitionId}`)
  return response.data
}
