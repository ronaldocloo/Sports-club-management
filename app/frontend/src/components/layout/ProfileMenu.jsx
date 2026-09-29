import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronDown, LogOut, Settings, User } from 'lucide-react'
import Avatar from '../ui/Avatar'
import { useAuth } from '../../context/AuthContext'
import { currentUser } from '../../mocks/demoData'
import useClickOutside from '../../hooks/useClickOutside'

function ProfileMenu() {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  useClickOutside(ref, () => setOpen(false))

  const name = user?.fullName || user?.username || currentUser.name
  const role = user?.role || currentUser.role

  async function signOut() {
    setOpen(false)
    try { await logout() } catch { /* session may already be gone */ }
    navigate('/login')
  }

  const item = 'flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50'

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-gray-100" aria-label="Account menu">
        <Avatar name={name} size={32} />
        <div className="hidden whitespace-nowrap text-left leading-tight sm:block">
          <p className="text-sm font-medium text-gray-900">{name}</p>
          <p className="text-xs text-gray-500">{role}</p>
        </div>
        <ChevronDown size={16} className="hidden text-gray-400 sm:block" />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
          <Link to="/settings" onClick={() => setOpen(false)} className={item}><User size={16} /> My Profile</Link>
          <Link to="/settings" onClick={() => setOpen(false)} className={item}><Settings size={16} /> Settings</Link>
          <div className="my-1 border-t border-gray-100" />
          <button onClick={signOut} className={`${item} text-red-600`}><LogOut size={16} /> Sign Out</button>
        </div>
      )}
    </div>
  )
}

export default ProfileMenu
