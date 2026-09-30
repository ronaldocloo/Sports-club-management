import apiClient, { USE_MOCKS } from './client'
import { organization as demoOrganization } from '../mocks/demoData'
import { demoOrganizations } from '../mocks/usersData'

// Organizations (clubs, academies, federations). Only a Super Admin can list and create them;
// every user can read the organization they belong to.
const demoRows = demoOrganizations.map((o) => ({ organizationId: o.id, name: o.name, slug: o.name.toLowerCase().replace(/\W+/g, '-'), plan: o.plan, status: o.status, athleteCount: o.athletes, userCount: Math.max(3, Math.round(o.athletes / 12)) }))
let demoList = [...demoRows]

export async function getOrganizations() {
  if (USE_MOCKS) return demoList
  return (await apiClient.get('/organizations')).data
}

export async function createOrganization(values) {
  if (USE_MOCKS) {
    const org = { organizationId: Date.now(), name: values.name, slug: values.name.toLowerCase().replace(/\W+/g, '-'), plan: values.plan || 'Starter', status: 'Trial', athleteCount: 0, userCount: 1 }
    demoList = [...demoList, org]
    return org
  }
  return (await apiClient.post('/organizations', values)).data
}

export async function updateOrganization(org, changes) {
  if (USE_MOCKS) {
    const updated = { ...org, ...changes }
    demoList = demoList.map((o) => (o.organizationId === org.organizationId ? updated : o))
    return updated
  }
  return (await apiClient.put(`/organizations/${org.organizationId}`, { name: changes.name ?? org.name, plan: changes.plan ?? org.plan, status: changes.status ?? org.status })).data
}

// The organization the signed-in user is working in. null for a Super Admin with none selected.
export async function getCurrentOrganization() {
  if (USE_MOCKS) return { organizationId: 1, name: demoOrganization.name, slug: 'ashesi-sports-club', plan: demoOrganization.plan, status: 'Active' }
  try {
    return (await apiClient.get('/organization')).data
  } catch {
    return null
  }
}

export async function renameCurrentOrganization(name) {
  if (USE_MOCKS) return { ...(await getCurrentOrganization()), name }
  return (await apiClient.put('/organization', { name })).data
}
