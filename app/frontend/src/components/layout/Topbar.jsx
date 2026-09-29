import { Menu } from 'lucide-react'
import GlobalSearch from './GlobalSearch'
import NotificationsMenu from './NotificationsMenu'
import ProfileMenu from './ProfileMenu'

function Topbar({ onMenuClick }) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-gray-200 bg-white/90 px-4 backdrop-blur sm:px-6">
      <button onClick={onMenuClick} aria-label="Open menu" className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 md:hidden">
        <Menu size={20} />
      </button>
      <GlobalSearch />
      <div className="ml-auto flex items-center gap-1">
        <NotificationsMenu />
        <ProfileMenu />
      </div>
    </header>
  )
}

export default Topbar
