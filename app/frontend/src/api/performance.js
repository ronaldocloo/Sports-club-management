import apiClient, { USE_MOCKS } from './client'

const titleCase = (key) => key.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase())

// Performance summary in the shape the profile page uses, or null when nothing is recorded
// (or the role may not see it).
export async function getPerformanceSummary(athleteId) {
  try {
    const { data: d } = await apiClient.get(`/performance/athletes/${athleteId}/summary`)
    if (!d.recent.length && !d.gamesPlayed) return null
    return {
      gamesPlayed: d.gamesPlayed,
      wins: d.wins,
      stats: Object.entries(d.statTotals || {}).map(([k, v]) => ({ label: titleCase(k), value: Number.isInteger(v) ? v : Math.round(v * 10) / 10 })),
      trend: d.recent.map((r) => ({ week: new Date(r.recordDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }), score: Number(r.rating) })),
    }
  } catch {
    return null
  }
}

// values: { athleteId, recordDate, rating, stats: { goals: 2 }, notes }
export async function recordPerformance(values) {
  if (USE_MOCKS) return { ...values, recordId: Date.now() }
  const { data } = await apiClient.post('/performance', values)
  return data
}

// Suggested stat names per sport; the coach can type their own too.
export const statPresets = {
  Football: ['goals', 'assists', 'saves'],
  Basketball: ['points', 'rebounds', 'assists'],
  Volleyball: ['kills', 'blocks', 'aces'],
  Athletics: ['races', 'personalBests', 'medals'],
  Swimming: ['races', 'personalBests', 'medals'],
  Badminton: ['wins', 'smashes'],
}
