import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import { ToastProvider } from '../ui'

function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { pathname } = useLocation()

  useEffect(() => {
    setMobileOpen(false)
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <ToastProvider>
    <div className="min-h-screen bg-gray-50">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="md:pl-20 lg:pl-64">
        <Topbar onMenuClick={() => setMobileOpen(true)} />
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
    </ToastProvider>
  )
}

export default AppShell
