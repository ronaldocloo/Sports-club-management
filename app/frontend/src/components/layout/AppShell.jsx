import { Suspense, useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import { ToastProvider } from '../ui'
import { NotificationsProvider } from './NotificationsContext'
import { OrganizationProvider } from '../../context/OrganizationContext'
import { useAuth } from '../../context/AuthContext'
import { canAccess, homeFor } from '../../utils/permissions'
import NoAccess from '../../pages/NoAccessPage'
import { AuthSpinner } from '../auth/RequireAuth'

// Shown for a moment the first time a page's code is fetched; the shell around it stays in place.
function PageLoading() {
  return <div className="flex justify-center py-24" role="status" aria-label="Loading page"><div className="h-7 w-7 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" /></div>
}

function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { pathname, search } = useLocation()
  const { user, loading } = useAuth()

  useEffect(() => {
    setMobileOpen(false)
    window.scrollTo(0, 0)
  }, [pathname])

  if (loading) return <AuthSpinner />
  if (!user) return <Navigate to="/login" replace state={{ from: pathname + search }} />
  if (pathname === '/' && homeFor(user.role) !== '/') return <Navigate to={homeFor(user.role)} replace />

  return (
    <ToastProvider>
    <OrganizationProvider>
    <NotificationsProvider>
    <div className="min-h-screen bg-gray-50">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="md:pl-20 lg:pl-64">
        <Topbar onMenuClick={() => setMobileOpen(true)} />
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {canAccess(user.role, pathname) ? <Suspense fallback={<PageLoading />}><Outlet /></Suspense> : <NoAccess />}
        </main>
      </div>
    </div>
    </NotificationsProvider>
    </OrganizationProvider>
    </ToastProvider>
  )
}

export default AppShell
