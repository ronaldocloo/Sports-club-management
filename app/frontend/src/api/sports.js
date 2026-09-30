import apiClient, { USE_MOCKS } from './client'
import { invalidate, loadAll } from './raw'
import { sportsOf } from './realData'
import { sports as demoSports } from '../mocks/demoData'

export async function getSports() {
  if (USE_MOCKS) return demoSports.map((s) => ({ ...s }))
  return sportsOf(await loadAll())
}

export async function createSport(name) {
  if (USE_MOCKS) return { id: Date.now(), name, color: '#64748b' }
  const { data } = await apiClient.post('/sports', { sportName: name, description: null })
  invalidate()
  return { id: data.sportId, name: data.sportName, color: '#64748b', description: data.description }
}
