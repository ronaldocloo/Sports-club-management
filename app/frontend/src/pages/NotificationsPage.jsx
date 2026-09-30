import { useState } from 'react'
import { Bell, Building2, CalendarDays, Check, CreditCard, Trash2, Trophy, UserPlus } from 'lucide-react'
import { useNotifications } from '../components/layout/NotificationsContext'
import { Button, Card, EmptyState, PageHeader, Tabs } from '../components/ui'

const icons = { membership: CreditCard, competition: Trophy, athlete: UserPlus, payment: CreditCard, facility: Building2, event: CalendarDays, fixture: Trophy }

function NotificationsPage() {
  const { items, unread, markRead, markAllRead, remove } = useNotifications()
  const [tab, setTab] = useState('all')
  const list = tab === 'unread' ? items.filter((n) => n.unread) : items

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="System" title="Notifications" description="Alerts about memberships, payments, competitions and facilities."
        actions={<Button variant="secondary" icon={Check} onClick={markAllRead} disabled={unread === 0}>Mark all read</Button>} />
      <Tabs value={tab} onChange={setTab} tabs={[{ value: 'all', label: 'All', count: items.length }, { value: 'unread', label: 'Unread', count: unread }]} />
      {list.length === 0 ? (
        <EmptyState icon={Bell} title={tab === 'unread' ? "You're all caught up" : 'No notifications'} description="New alerts will appear here." />
      ) : (
        <Card className="divide-y divide-gray-100">
          {list.map((n) => {
            const Icon = icons[n.kind] || Bell
            return (
              <div key={n.id} className={`flex items-start gap-3 px-5 py-4 ${n.unread ? 'bg-blue-50/40' : ''}`}>
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600"><Icon size={16} /></div>
                <div className="flex-1">
                  <p className="text-sm text-gray-800">{n.text}</p>
                  <p className="mt-0.5 text-xs text-gray-500">{n.time}</p>
                </div>
                {n.unread && <Button size="sm" variant="ghost" onClick={() => markRead(n.id)}>Mark read</Button>}
                <button aria-label="Dismiss notification" onClick={() => remove(n.id)} className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"><Trash2 size={15} /></button>
              </div>
            )
          })}
        </Card>
      )}
    </div>
  )
}

export default NotificationsPage
