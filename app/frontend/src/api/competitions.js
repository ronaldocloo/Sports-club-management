import apiClient, { USE_MOCKS } from './client'
import { invalidate, loadAll } from './raw'
import { competitionDetailOf, competitionsOf } from './realData'
import { fetchFixtures, fetchStandings } from './fixtures'
import { mockCompetitions } from '../mocks/mockData'
import { competitionDetails } from '../mocks/competitionData'

// Demo mode only: competitions added this session.
const sessionCompetitions = []

export async function getCompetitions() {
  if (USE_MOCKS) return [...sessionCompetitions, ...mockCompetitions]
  return competitionsOf(await loadAll())
}

export async function getCompetitionById(competitionId) {
  return (await getCompetitions()).find((c) => c.competitionId === Number(competitionId))
}

// Competition plus teams, fixtures and standings. Demo mode uses sample fixtures; the real API
// serves fixtures and computes standings on the server.
export async function getCompetitionDetail(competitionId) {
  if (!USE_MOCKS) {
    const raw = await loadAll()
    const detail = competitionDetailOf(raw, competitionId)
    if (!detail) return null
    const names = Object.fromEntries(raw.teams.map((t) => [t.teamId, t.teamName]))
    const [fixtures, standings] = await Promise.all([
      fetchFixtures(competitionId, names, detail.location).catch(() => []),
      fetchStandings(competitionId).catch(() => []),
    ])
    return { ...detail, fixtures, standings, fixturesAvailable: true, serverFixtures: true }
  }
  const competition = await getCompetitionById(competitionId)
  if (!competition) return null
  const extra = competitionDetails[competition.competitionId] || { teams: [], fixtures: [], level: competition.level }
  return { ...competition, ...extra, fixturesAvailable: true }
}

export async function createCompetition(data) {
  if (USE_MOCKS) {
    await new Promise((r) => setTimeout(r, 500))
    const competition = { competitionId: Date.now(), competitionName: data.name, date: data.date, location: data.venue, status: 'Upcoming', level: data.level }
    sessionCompetitions.unshift(competition)
    return competition
  }
  const { data: c } = await apiClient.post('/competitions', {
    compName: data.name, compDate: data.date, venue: data.venue, level: data.level, registrationDeadline: data.registrationDeadline || null,
  })
  invalidate()
  return { competitionId: c.competitionId, competitionName: c.compName, date: c.compDate, location: c.venue, status: 'Upcoming', level: c.level }
}
