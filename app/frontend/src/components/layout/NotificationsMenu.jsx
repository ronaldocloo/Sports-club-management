import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, CalendarDays, CreditCard, Building2, Trophy, UserPlus } from 'lucide-react'
import { useNotifications } from './NotificationsContext'
import useClickOutside from '../../hooks/useClickOutside'

const icons = { membership: CreditCard, competition: Trophy, athlete: UserPlus, payment: CreditCard, facility: Building2, event: CalendarDays }

function NotificationsMenu() {
  const [open, setOpen] = useState(false)
  const { items, unread, markAllRead } = useNotifications()
  const ref = useRef(null)
  useClickOutside(ref, () => setOpen(false))

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((o) => !o)} aria-label="Notifications" className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100">
        <Bell size={20} />
        {unread > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">{unread}</span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-gray-200 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <p className="text-sm font-semibold text-gray-900">Notifications</p>
            <button onClick={markAllRead} className="text-xs font-medium text-blue-600 hover:text-blue-700">
              Mark all read
            </button>
          </div>
          <ul className="max-h-80 divide-y divide-gray-50 overflow-y-auto">
            {items.slice(0, 6).map((n) => {
              const Icon = icons[n.kind] || Bell
              return (
                <li key={n.id} className={`flex gap-3 px-4 py-3 ${n.unread ? 'bg-blue-50/40' : ''}`}>
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600"><Icon size={15} /></div>
                  <div>
                    <p className="text-sm text-gray-800">{n.text}</p>
                    <p className="mt-0.5 text-xs text-gray-500">{n.time}</p>
                  </div>
                </li>
              )
            })}
          </ul>
          <Link to="/notifications" onClick={() => setOpen(false)} className="block border-t border-gray-100 px-4 py-3 text-center text-sm font-medium text-blue-600 hover:bg-gray-50">
            View all notifications
          </Link>
        </div>
      )}
    </div>
  )
}

export default NotificationsMenu
