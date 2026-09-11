import apiClient, { USE_MOCKS } from './client'
import { mockAthletes } from '../mocks/mockData'

export async function getAthletes() {
  if (USE_MOCKS) {
    return mockAthletes
  }
  const response = await apiClient.get('/athletes')
  return response.data
}

export async function getAthleteById(athleteId) {
  if (USE_MOCKS) {
    return mockAthletes.find((athlete) => athlete.athleteId === Number(athleteId))
  }
  const response = await apiClient.get(`/athletes/${athleteId}`)
  return response.data
}
