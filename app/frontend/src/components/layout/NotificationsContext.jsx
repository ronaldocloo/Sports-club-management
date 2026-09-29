import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { getNotifications } from '../../api/operations'

const Ctx = createContext(null)

export function NotificationsProvider({ children }) {
  const [items, setItems] = useState([])

  useEffect(() => {
    getNotifications().then(setItems).catch(() => setItems([]))
  }, [])

  const value = useMemo(() => ({
    items,
    unread: items.filter((n) => n.unread).length,
    markRead: (id) => setItems((l) => l.map((n) => (n.id === id ? { ...n, unread: false } : n))),
    markAllRead: () => setItems((l) => l.map((n) => ({ ...n, unread: false }))),
    remove: (id) => setItems((l) => l.filter((n) => n.id !== id)),
  }), [items])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useNotifications() {
  return useContext(Ctx)
}
