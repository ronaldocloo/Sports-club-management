import apiClient, { USE_MOCKS } from './client'
import { mockCompetitions } from '../mocks/mockData'
import { competitionDetails } from '../mocks/competitionData'

// The backend uses compName/compDate/venue; the UI uses competitionName/date/location.
function normalize(c) {
  if (!c || c.competitionName) return c
  return { ...c, competitionName: c.compName, date: c.compDate, location: c.venue }
}

// Demo mode only: competitions added this session.
const sessionCompetitions = []

export async function getCompetitions() {
  if (USE_MOCKS) {
    return [...sessionCompetitions, ...mockCompetitions]
  }
  const response = await apiClient.get('/competitions')
  return response.data.map(normalize)
}

export async function getCompetitionById(competitionId) {
  if (USE_MOCKS) {
    return [...sessionCompetitions, ...mockCompetitions].find(
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

// Demo mode keeps new competitions in memory only. With the real API this POSTs to /competitions.
export async function createCompetition(data) {
  if (USE_MOCKS) {
    await new Promise((r) => setTimeout(r, 500))
    const competition = { competitionId: Date.now(), competitionName: data.name, date: data.date, location: data.venue, status: 'Upcoming', level: data.level }
    sessionCompetitions.unshift(competition)
    return competition
  }
  const response = await apiClient.post('/competitions', {
    compName: data.name, compDate: data.date, venue: data.venue, level: data.level,
    registrationDeadline: data.registrationDeadline || null,
  })
  return normalize(response.data)
}
