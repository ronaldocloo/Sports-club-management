import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, Clock, MapPin, Plus, UserRound, Users } from 'lucide-react'
import { eventsAreDerived, getEvents } from '../api/operations'
import { TODAY_ISO } from '../utils/today'
import useAsync from '../hooks/useAsync'
import { Badge, Button, Card, CardSkeleton, EmptyState, ErrorState, Input, Modal, PageHeader, SearchInput, Select, StatCard, TableSkeleton, useToast } from '../components/ui'
import { formatDate } from '../utils/format'

const eventTypes = ['Training', 'Match', 'Competition', 'Awards', 'Team meeting', 'Workshop', 'Club event']
const typeTone = { Training: 'blue', Match: 'green', Competition: 'green', Awards: 'amber', 'Team meeting': 'gray', Workshop: 'gray', 'Club event': 'blue' }
const TODAY = TODAY_ISO
const WEEK_END = (() => { const d = new Date(TODAY_ISO); d.setUTCDate(d.getUTCDate() + 7); return d.toISOString().slice(0, 10) })()

function EventModal({ open, onClose, onSave }) {
  const empty = { title: '', type: '', date: '', time: '', location: '', organizer: '' }
  const [v, setV] = useState(empty)
  const [errors, setErrors] = useState({})
  const set = (k) => (e) => setV((s) => ({ ...s, [k]: e.target.value }))
  const close = () => { setV(empty); setErrors({}); onClose() }

  function submit(e) {
    e.preventDefault()
    const err = {}
    if (!v.title.trim()) err.title = 'Title is required.'
    if (!v.type) err.type = 'Select an event type.'
    if (!v.date) err.date = 'Pick a date.'
    if (!v.time) err.time = 'Pick a time.'
    if (!v.location.trim()) err.location = 'Location is required.'
    setErrors(err)
    if (Object.keys(err).length) return
    onSave({ ...v, title: v.title.trim(), location: v.location.trim(), organizer: v.organizer.trim() || 'Club Admin' })
    setV(empty)
  }

  return (
    <Modal open={open} onClose={close} title="Add event"
      footer={<><Button variant="secondary" onClick={close}>Cancel</Button><Button type="submit" form="event-form">Add Event</Button></>}>
      <form id="event-form" onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2"><Input label="Title" required value={v.title} onChange={set('title')} error={errors.title} /></div>
        <Select label="Type" required options={eventTypes} placeholder="Select type" value={v.type} onChange={set('type')} error={errors.type} />
        <Input label="Organizer" value={v.organizer} onChange={set('organizer')} />
        <Input label="Date" required type="date" value={v.date} onChange={set('date')} error={errors.date} />
        <Input label="Time" required type="time" value={v.time} onChange={set('time')} error={errors.time} />
        <div className="sm:col-span-2"><Input label="Location" required value={v.location} onChange={set('location')} error={errors.location} /></div>
      </form>
    </Modal>
  )
}

function EventsPage() {
  const { data, status, reload } = useAsync(getEvents)
  const [events, setEvents] = useState([])
  const [type, setType] = useState('All')
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const { push } = useToast()

  useEffect(() => { if (data) setEvents(data) }, [data])

  const upcoming = events.filter((e) => e.date >= TODAY && e.status !== 'Completed')
  const thisWeek = upcoming.filter((e) => e.date <= WEEK_END)
  const next = [...upcoming].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))[0]

  const filtered = useMemo(() => events
    .filter((e) => (type === 'All' || e.type === type) && `${e.title} ${e.location} ${e.organizer}`.toLowerCase().includes(search.toLowerCase().trim()))
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)), [events, type, search])

  const groups = useMemo(() => {
    const map = new Map()
    filtered.forEach((e) => map.set(e.date, [...(map.get(e.date) || []), e]))
    return [...map.entries()]
  }, [filtered])

  function add(e) {
    setEvents((l) => [...l, { id: Date.now(), participants: 0, status: 'Scheduled', ...e }])
    setOpen(false)
    push(`Event “${e.title}” added`)
  }

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Operations" title="Events" description={eventsAreDerived ? 'Competitions and confirmed facility bookings, in date order.' : 'Training, matches, workshops and club events.'}
        actions={!eventsAreDerived && <Button icon={Plus} onClick={() => setOpen(true)}>Add Event</Button>} />

      {status === 'loading' && <><div className="grid gap-4 sm:grid-cols-3"><CardSkeleton /><CardSkeleton /><CardSkeleton /></div><TableSkeleton /></>}
      {status === 'error' && <ErrorState title="Couldn't load events" onRetry={reload} />}

      {status === 'ready' && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard icon={CalendarDays} label="Upcoming events" value={upcoming.length} note="scheduled" />
            <StatCard icon={Clock} tone="green" label="This week" value={thisWeek.length} note="next 7 days" />
            <StatCard icon={MapPin} tone="violet" label="Next event" value={next ? formatDate(next.date, { day: 'numeric', month: 'short' }) : '—'} note={next?.title} />
          </div>

          <Card className="p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <SearchInput value={search} onChange={setSearch} placeholder="Search events" label="Search events" />
              <div className="flex flex-wrap gap-2">
                {['All', ...eventTypes].map((t) => (
                  <button key={t} onClick={() => setType(t)} aria-pressed={type === t}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium ${type === t ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{t}</button>
                ))}
              </div>
            </div>
          </Card>

          {groups.length === 0 ? (
            <EmptyState icon={CalendarDays} title="No events found" description="There are currently no events matching your filters."
              action={!eventsAreDerived && <Button icon={Plus} onClick={() => setOpen(true)}>Add Event</Button>} />
          ) : (
            <div className="space-y-6">
              {groups.map(([date, items]) => (
                <div key={date}>
                  <h2 className="mb-2 text-sm font-semibold text-gray-500">{formatDate(date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</h2>
                  <div className="space-y-3">
                    {items.map((e) => (
                      <Card key={e.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                        <div className="w-16 shrink-0 text-lg font-bold text-blue-600">{e.time}</div>
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-gray-900">{e.title}</p>
                            <Badge tone={typeTone[e.type] || 'gray'}>{e.type}</Badge>
                            {e.status === 'Completed' && <Badge tone="gray">Completed</Badge>}
                          </div>
                          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                            <span className="inline-flex items-center gap-1"><MapPin size={12} /> {e.location}</span>
                            <span className="inline-flex items-center gap-1"><UserRound size={12} /> {e.organizer}</span>
                            <span className="inline-flex items-center gap-1"><Users size={12} /> {e.participants} participants</span>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <EventModal open={open} onClose={() => setOpen(false)} onSave={add} />
    </div>
  )
}

export default EventsPage
