import apiClient from './client'
import { invalidate } from './raw'

// Fixtures (matches) and results for a competition. The backend computes standings.
const time = (t) => (t ? String(t).slice(0, 5) : '—')

export function fixtureRow(f, teamNames, fallbackVenue) {
  return {
    id: f.fixtureId, round: f.roundLabel, home: teamNames[f.homeTeamId] || `Team ${f.homeTeamId}`, away: teamNames[f.awayTeamId] || `Team ${f.awayTeamId}`,
    homeTeamId: f.homeTeamId, awayTeamId: f.awayTeamId, date: f.matchDate, time: time(f.matchTime), venue: f.venue || fallbackVenue || '—',
    officials: f.officials || '', homeScore: f.homeScore, awayScore: f.awayScore, status: f.status,
  }
}

export async function fetchFixtures(competitionId, teamNames, venue) {
  const { data } = await apiClient.get('/fixtures', { params: { competitionId } })
  return data.map((f) => fixtureRow(f, teamNames, venue))
}

export async function fetchStandings(competitionId) {
  const { data } = await apiClient.get('/fixtures/standings', { params: { competitionId } })
  return data.map((s) => ({ team: s.teamName, teamId: s.teamId, played: s.played, won: s.won, drawn: s.drawn, lost: s.lost, gf: s.goalsFor, ga: s.goalsAgainst, points: s.points }))
}

export async function createFixture(values) {
  const { data } = await apiClient.post('/fixtures', {
    competitionId: Number(values.competitionId), homeTeamId: Number(values.homeTeamId), awayTeamId: Number(values.awayTeamId),
    roundLabel: values.round || null, venue: values.venue || null, matchDate: values.date, matchTime: values.time ? `${values.time}:00` : null, officials: values.officials || null,
  })
  invalidate()
  return data
}

export async function recordFixtureResult(fixtureId, homeScore, awayScore) {
  const { data } = await apiClient.put(`/fixtures/${fixtureId}/result`, { homeScore, awayScore })
  invalidate()
  return data
}

export async function deleteFixture(fixtureId) {
  await apiClient.delete(`/fixtures/${fixtureId}`)
  invalidate()
}
