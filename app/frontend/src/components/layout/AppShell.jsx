import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import { ToastProvider } from '../ui'
import { NotificationsProvider } from './NotificationsContext'
import { useAuth } from '../../context/AuthContext'
import { canAccess, homeFor } from '../../utils/permissions'
import NoAccess from '../../pages/NoAccessPage'

function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { pathname } = useLocation()
  const { user } = useAuth()

  useEffect(() => {
    setMobileOpen(false)
    window.scrollTo(0, 0)
  }, [pathname])

  if (user && pathname === '/' && homeFor(user.role) !== '/') return <Navigate to={homeFor(user.role)} replace />

  return (
    <ToastProvider>
    <NotificationsProvider>
    <div className="min-h-screen bg-gray-50">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="md:pl-20 lg:pl-64">
        <Topbar onMenuClick={() => setMobileOpen(true)} />
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {!user || canAccess(user.role, pathname) ? <Outlet /> : <NoAccess />}
        </main>
      </div>
    </div>
    </NotificationsProvider>
    </ToastProvider>
  )
}

export default AppShell
