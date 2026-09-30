import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { getCurrentOrganization } from '../api/organizations'
import { getActiveOrganizationId, setActiveOrganizationId } from '../api/client'
import { useAuth } from './AuthContext'
import { normalizeRole } from '../utils/permissions'

const Ctx = createContext(null)

// The organization the user is working in. A Super Admin chooses one; everyone else has their own.
export function OrganizationProvider({ children }) {
  const { user } = useAuth()
  const isSuper = normalizeRole(user?.role) === 'SuperAdmin'
  const [organization, setOrganization] = useState(null)
  const [activeId, setActiveId] = useState(getActiveOrganizationId())

  const refresh = useCallback(() => {
    if (isSuper && !getActiveOrganizationId()) { setOrganization(null); return Promise.resolve() }
    return getCurrentOrganization().then(setOrganization).catch(() => setOrganization(null))
  }, [isSuper])

  useEffect(() => { refresh() }, [refresh, activeId])

  const value = useMemo(() => ({
    organization,
    isSuper,
    activeId,
    // Super Admin only: work inside another organization. Reloads so every page refetches its data.
    switchTo: (id) => { setActiveOrganizationId(id); setActiveId(id ? String(id) : null); window.location.assign(id ? '/' : '/organizations') },
    refresh,
  }), [organization, isSuper, activeId, refresh])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useOrganization() {
  return useContext(Ctx)
}
