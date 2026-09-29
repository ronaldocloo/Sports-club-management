import { useState } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { ChevronDown, Trophy, X } from 'lucide-react'
import { navGroups } from './navConfig'
import { useAuth } from '../../context/AuthContext'
import { canAccess } from '../../utils/permissions'

// Desktop (lg+): full sidebar with collapsible groups.
// Tablet (md): icon rail. Mobile: slide-out drawer.
function Sidebar({ mobileOpen, onClose }) {
  const [collapsed, setCollapsed] = useState({})
  const { user } = useAuth()
  const groups = navGroups
    .map((g) => ({ ...g, items: g.items.filter((i) => canAccess(user?.role, i.path)) }))
    .filter((g) => g.items.length > 0)

  return (
    <>
      {mobileOpen && <div className="fixed inset-0 z-30 bg-gray-900/40 md:hidden" onClick={onClose} />}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-gray-200 bg-white transition-transform md:w-20 md:translate-x-0 lg:w-64 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-gray-100 px-5 md:justify-center lg:justify-between">
          <Link to="/" className="flex items-center gap-3" onClick={onClose}>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white">
              <Trophy size={18} />
            </div>
            <div className="leading-tight md:hidden lg:block">
              <p className="text-sm font-bold text-gray-900">Sports Club</p>
              <p className="text-[11px] text-gray-500">Management Platform</p>
            </div>
          </Link>
          <button onClick={onClose} aria-label="Close menu" className="rounded-md p-1 text-gray-400 hover:bg-gray-100 md:hidden">
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-4">
          {groups.map((group) => {
            const isCollapsed = collapsed[group.label]
            const single = group.items.length === 1
            return (
              <div key={group.label}>
                {!single && (
                  <button
                    onClick={() => setCollapsed((c) => ({ ...c, [group.label]: !c[group.label] }))}
                    className="mb-1 flex w-full items-center justify-between px-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400 hover:text-gray-600 md:hidden lg:flex"
                  >
                    {group.label}
                    <ChevronDown size={14} className={`transition-transform ${isCollapsed ? '-rotate-90' : ''}`} />
                  </button>
                )}
                {single && (
                  <p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400 md:hidden lg:block">{group.label}</p>
                )}
                <div className={`space-y-0.5 ${isCollapsed ? 'hidden md:block lg:hidden' : 'block'}`}>
                  {group.items.map(({ name, path, icon: Icon }) => (
                    <NavLink
                      key={path}
                      to={path}
                      end={path === '/'}
                      onClick={onClose}
                      title={name}
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors md:justify-center lg:justify-start ${
                          isActive ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                        }`
                      }
                    >
                      <Icon size={18} className="shrink-0" />
                      <span className="md:hidden lg:inline">{name}</span>
                    </NavLink>
                  ))}
                </div>
              </div>
            )
          })}
        </nav>

        <div className="border-t border-gray-100 px-5 py-3 md:hidden lg:block">
          <p className="text-xs text-gray-400">© 2026 Sports Platform</p>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
