import apiClient, { USE_MOCKS } from './client'
import { mockCompetitions } from '../mocks/mockData'
import { competitionDetails } from '../mocks/competitionData'

// The backend uses compName/compDate/venue; the UI uses competitionName/date/location.
function normalize(c) {
  if (!c || c.competitionName) return c
  return { ...c, competitionName: c.compName, date: c.compDate, location: c.venue }
}

export async function getCompetitions() {
  if (USE_MOCKS) {
    return mockCompetitions
  }
  const response = await apiClient.get('/competitions')
  return response.data.map(normalize)
}

export async function getCompetitionById(competitionId) {
  if (USE_MOCKS) {
    return mockCompetitions.find(
      (competition) => competition.competitionId === Number(competitionId),
    )
  }
  const response = await apiClient.get(`/competitions/${competitionId}`)
  return normalize(response.data)
}

// Competition plus fixtures/teams. Fixtures are mock data until the backend has a match API.
export async function getCompetitionDetail(competitionId) {
  const competition = await getCompetitionById(competitionId)
  if (!competition) return null
  const extra = competitionDetails[competition.competitionId] || { teams: [], fixtures: [], level: competition.level }
  return { ...competition, ...extra }
}
