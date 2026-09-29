import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { deleteNotification, getNotifications, markAllNotificationsRead, markNotificationRead } from '../../api/notifications'
import { USE_MOCKS } from '../../api/client'

const Ctx = createContext(null)
const POLL_MS = 60000

// Notifications for the signed-in user. Read/unread state is stored on the server, so it
// survives a reload and is the same on every device.
export function NotificationsProvider({ children }) {
  const [items, setItems] = useState([])

  const refresh = useCallback(() => getNotifications().then(setItems).catch(() => {}), [])

  useEffect(() => {
    refresh()
    if (USE_MOCKS) return undefined
    const timer = setInterval(refresh, POLL_MS)
    return () => clearInterval(timer)
  }, [refresh])

  const value = useMemo(() => ({
    items,
    unread: items.filter((n) => n.unread).length,
    refresh,
    markRead: async (id) => {
      setItems((l) => l.map((n) => (n.id === id ? { ...n, unread: false } : n)))
      try { await markNotificationRead(id) } catch { refresh() }
    },
    markAllRead: async () => {
      setItems((l) => l.map((n) => ({ ...n, unread: false })))
      try { await markAllNotificationsRead() } catch { refresh() }
    },
    remove: async (id) => {
      setItems((l) => l.filter((n) => n.id !== id))
      try { await deleteNotification(id) } catch { refresh() }
    },
  }), [items, refresh])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useNotifications() {
  return useContext(Ctx)
}
