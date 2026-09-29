import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CalendarCheck, Check, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { approveBooking, bookingConfig, cancelBooking, createBooking, getBookings, getFacilities } from '../api/operations'
import { getTeams } from '../api/teams'
import { errorMessage, USE_MOCKS } from '../api/client'
import useAsync from '../hooks/useAsync'
import { Badge, Button, Card, CardHeader, ConfirmDialog, EmptyState, ErrorState, Input, Modal, PageHeader, Select, TableSkeleton, useToast } from '../components/ui'
import { formatDate } from '../utils/format'
import { TODAY_ISO } from '../utils/today'

const cellStyle = {
  Available: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-100',
  Confirmed: 'bg-blue-600 text-white border-blue-600',
  Pending: 'bg-amber-100 text-amber-800 border-amber-200',
  Maintenance: 'bg-gray-200 text-gray-500 border-gray-200',
}
const statusTone = { Confirmed: 'blue', Pending: 'amber' }
const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const DAY_COUNT = USE_MOCKS ? 5 : 7

function addDays(iso, n) {
  const d = new Date(iso)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}
function mondayOf(iso) {
  const d = new Date(iso)
  return addDays(iso, -((d.getUTCDay() + 6) % 7))
}

async function load() {
  const [facilities, bookings, teams] = await Promise.all([getFacilities(), getBookings(), getTeams().catch(() => [])])
  return { facilities, bookings, teams }
}

function BookingsPage() {
  const { data, status, reload } = useAsync(load)
  const [params, setParams] = useSearchParams()
  const [bookings, setBookings] = useState([])
  const [week, setWeek] = useState(mondayOf(TODAY_ISO))
  const [slot, setSlot] = useState(null) // { date, time } for a new booking
  const [selected, setSelected] = useState(null)
  const [cancelling, setCancelling] = useState(null)
  const [form, setForm] = useState({ purpose: '', teamId: '', errors: {} })
  const [saving, setSaving] = useState(false)
  const { push } = useToast()

  useEffect(() => { if (data) setBookings(data.bookings) }, [data])

  const facilities = data?.facilities || []
  const teams = data?.teams || []
  const facilityId = Number(params.get('facility')) || facilities[0]?.id
  const facility = facilities.find((f) => f.id === facilityId)
  const days = useMemo(() => Array.from({ length: DAY_COUNT }, (_, i) => ({ key: DAY_NAMES[i], date: addDays(week, i) })), [week])
  const inWeek = (b) => b.date >= days[0].date && b.date <= days.at(-1).date
  const mine = useMemo(() => bookings.filter((b) => b.facilityId === facilityId), [bookings, facilityId])
  const weekBookings = mine.filter(inWeek)
  const find = (date, time) => mine.find((b) => b.date === date && b.time === time)
  const latest = [...mine].sort((a, b) => b.date.localeCompare(a.date))[0]

  function cellState(date, time) {
    if (facility && facility.status !== 'Available') return 'Maintenance'
    return find(date, time)?.status || 'Available'
  }

  async function requestBooking(e) {
    e.preventDefault()
    const errors = {}
    if (!form.purpose.trim()) errors.purpose = 'Enter a purpose for the booking.'
    if (!USE_MOCKS && !form.teamId) errors.teamId = 'Select the team using the facility.'
    if (Object.keys(errors).length) return setForm((f) => ({ ...f, errors }))
    setSaving(true)
    try {
      const created = await createBooking({ facilityId, date: slot.date, time: slot.time, purpose: form.purpose.trim(), teamId: form.teamId, bookedBy: 'Ronald Ocloo' })
      setBookings((l) => [...l, created])
      push(bookingConfig.approvalFlow ? 'Booking requested, pending approval' : 'Booking confirmed')
      setSlot(null)
      setForm({ purpose: '', teamId: '', errors: {} })
    } catch (err) {
      setForm((f) => ({ ...f, errors: { submit: errorMessage(err, "We couldn't save this booking.") } }))
    } finally {
      setSaving(false)
    }
  }

  async function approve(b) {
    try {
      const updated = await approveBooking(b)
      setBookings((l) => l.map((x) => (x.id === b.id ? { ...x, ...updated } : x)))
      setSelected(null)
      push('Booking approved')
    } catch (e) {
      push(errorMessage(e), 'error')
    }
  }

  async function cancel() {
    const target = cancelling
    setCancelling(null)
    try {
      await cancelBooking(target)
      setBookings((l) => l.filter((x) => x.id !== target.id))
      setSelected(null)
      push('Booking cancelled')
    } catch (e) {
      push(errorMessage(e), 'error')
    }
  }

  const upcoming = [...weekBookings].sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Operations" title="Bookings" description="Weekly availability and facility bookings."
        actions={facilities.length > 0 && (
          <select aria-label="Facility" value={facilityId} onChange={(e) => setParams({ facility: e.target.value })}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none">
            {facilities.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        )} />

      {status === 'loading' && <TableSkeleton rows={7} />}
      {status === 'error' && <ErrorState title="Couldn't load bookings" onRetry={reload} />}
      {status === 'ready' && !facility && <EmptyState icon={CalendarCheck} title="No facilities" description="Add a facility before taking bookings." />}

      {status === 'ready' && facility && (
        <>
          <Card>
            <CardHeader title={facility.name}
              subtitle={`Week of ${formatDate(days[0].date, { day: 'numeric', month: 'short' })} – ${formatDate(days.at(-1).date, { day: 'numeric', month: 'short', year: 'numeric' })}`}
              action={
                <div className="flex flex-wrap items-center gap-2">
                  <Button size="sm" variant="secondary" aria-label="Previous week" onClick={() => setWeek(addDays(week, -7))}><ChevronLeft size={16} /></Button>
                  <Button size="sm" variant="secondary" onClick={() => setWeek(mondayOf(TODAY_ISO))}>Today</Button>
                  <Button size="sm" variant="secondary" aria-label="Next week" onClick={() => setWeek(addDays(week, 7))}><ChevronRight size={16} /></Button>
                  {latest && !inWeek(latest) && <Button size="sm" variant="ghost" onClick={() => setWeek(mondayOf(latest.date))}>Go to latest booking</Button>}
                </div>
              } />
            <div className="flex flex-wrap gap-3 px-5 pt-3 text-xs text-gray-600">
              {[['Available', 'bg-emerald-200'], ['Booked', 'bg-blue-600'], ...(bookingConfig.approvalFlow ? [['Pending approval', 'bg-amber-300']] : []), ['Unavailable', 'bg-gray-300']].map(([l, c]) => (
                <span key={l} className="inline-flex items-center gap-1.5"><span className={`h-2.5 w-2.5 rounded-sm ${c}`} /> {l}</span>
              ))}
            </div>
            <div className="overflow-x-auto p-4">
              <table className="w-full min-w-[560px] border-separate border-spacing-1.5 text-sm">
                <thead>
                  <tr>
                    <th className="w-16" />
                    {days.map((d) => (
                      <th key={d.key} className="pb-1 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                        {d.key}<span className="block text-[11px] font-normal normal-case text-gray-400">{formatDate(d.date, { day: 'numeric', month: 'short' })}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {bookingConfig.slots.map((t) => (
                    <tr key={t}>
                      <td className="pr-2 text-right text-xs text-gray-500">{t}</td>
                      {days.map((d) => {
                        const state = cellState(d.date, t)
                        const b = find(d.date, t)
                        const label = state === 'Confirmed' ? 'Booked' : state === 'Maintenance' ? 'Unavailable' : state
                        return (
                          <td key={d.key}>
                            <button
                              disabled={state === 'Maintenance'}
                              onClick={() => (b ? setSelected(b) : setSlot({ date: d.date, time: t }))}
                              aria-label={`${d.key} ${t} ${label}`}
                              className={`h-11 w-full rounded-lg border text-xs font-medium transition-colors disabled:cursor-not-allowed ${cellStyle[state]}`}
                            >{label}</button>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card>
            <CardHeader title="Bookings this week" subtitle={`${upcoming.length} bookings for ${facility.name}`} />
            {upcoming.length === 0 ? (
              <div className="p-6"><EmptyState icon={CalendarCheck} title="No bookings this week" description="Select an available slot in the calendar to make a booking." /></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                    <tr>{['Date', 'Time', 'Purpose', USE_MOCKS ? 'Booked by' : 'Team', 'Status', ''].map((h) => <th key={h} className="px-5 py-3 font-medium">{h}</th>)}</tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {upcoming.map((b) => (
                      <tr key={b.id} className="hover:bg-gray-50">
                        <td className="px-5 py-3 text-gray-700">{formatDate(b.date, { weekday: 'short', day: 'numeric', month: 'short' })}</td>
                        <td className="px-5 py-3 text-gray-700">{b.time}</td>
                        <td className="px-5 py-3 font-medium text-gray-900">{b.purpose}</td>
                        <td className="px-5 py-3 text-gray-700">{b.bookedBy}</td>
                        <td className="px-5 py-3"><Badge tone={statusTone[b.status]}>{b.status === 'Pending' ? 'Pending approval' : b.status}</Badge></td>
                        <td className="px-5 py-3 text-right">
                          {b.status === 'Pending' ? (
                            <span className="inline-flex gap-2">
                              <Button size="sm" icon={Check} onClick={() => approve(b)}>Approve</Button>
                              <Button size="sm" variant="secondary" icon={X} onClick={() => setCancelling(b)}>Reject</Button>
                            </span>
                          ) : (
                            <Button size="sm" variant="ghost" onClick={() => setCancelling(b)}>Cancel</Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}

      <Modal open={!!slot} onClose={() => setSlot(null)} title={bookingConfig.approvalFlow ? 'Request booking' : 'Book facility'}
        footer={<><Button variant="secondary" onClick={() => setSlot(null)}>Cancel</Button><Button type="submit" form="booking-form" loading={saving}>{bookingConfig.approvalFlow ? 'Request Booking' : 'Book'}</Button></>}>
        {slot && (
          <form id="booking-form" onSubmit={requestBooking} noValidate className="space-y-4">
            <p className="text-sm text-gray-600">{facility?.name} · {formatDate(slot.date, { weekday: 'long', day: 'numeric', month: 'short' })} · {slot.time}</p>
            {!USE_MOCKS && <Select label="Team" required options={teams.map((t) => ({ value: String(t.teamId), label: t.teamName }))} placeholder="Select team" value={form.teamId} onChange={(e) => setForm((f) => ({ ...f, teamId: e.target.value, errors: {} }))} error={form.errors.teamId} />}
            <Input label="Purpose" required placeholder="e.g. Football training" value={form.purpose} onChange={(e) => setForm((f) => ({ ...f, purpose: e.target.value, errors: {} }))} error={form.errors.purpose} />
            {form.errors.submit && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{form.errors.submit}</p>}
          </form>
        )}
      </Modal>

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Booking details"
        footer={selected && (
          <>
            <Button variant="secondary" onClick={() => setCancelling(selected)}>Cancel booking</Button>
            {selected.status === 'Pending' && <Button onClick={() => approve(selected)}>Approve</Button>}
          </>
        )}>
        {selected && (
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between"><dt className="text-gray-500">Facility</dt><dd className="font-medium text-gray-900">{facility?.name}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">When</dt><dd className="font-medium text-gray-900">{formatDate(selected.date, { weekday: 'short', day: 'numeric', month: 'short' })} · {selected.time}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">Purpose</dt><dd className="font-medium text-gray-900">{selected.purpose}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">{USE_MOCKS ? 'Booked by' : 'Team'}</dt><dd className="font-medium text-gray-900">{selected.bookedBy}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">Status</dt><dd><Badge tone={statusTone[selected.status]}>{selected.status === 'Pending' ? 'Pending approval' : selected.status}</Badge></dd></div>
          </dl>
        )}
      </Modal>

      <ConfirmDialog open={!!cancelling} danger title="Cancel this booking?" description="The slot will become available again. This action cannot be undone."
        confirmLabel="Cancel Booking" onConfirm={cancel} onCancel={() => setCancelling(null)} />
    </div>
  )
}

export default BookingsPage
