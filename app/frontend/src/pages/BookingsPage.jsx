import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CalendarCheck, Check, X } from 'lucide-react'
import { getBookings, getFacilities } from '../api/operations'
import useAsync from '../hooks/useAsync'
import { timeSlots, weekDays } from '../mocks/operationsData'
import { Badge, Button, Card, CardHeader, ConfirmDialog, EmptyState, ErrorState, Input, Modal, PageHeader, TableSkeleton, useToast } from '../components/ui'
import { formatDate } from '../utils/format'

const cellStyle = {
  Available: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-100',
  Confirmed: 'bg-blue-600 text-white border-blue-600',
  Pending: 'bg-amber-100 text-amber-800 border-amber-200',
  Maintenance: 'bg-gray-200 text-gray-500 border-gray-200',
}
const statusTone = { Confirmed: 'blue', Pending: 'amber' }

function BookingsPage() {
  const fac = useAsync(getFacilities)
  const book = useAsync(getBookings)
  const [params, setParams] = useSearchParams()
  const [bookings, setBookings] = useState([])
  const [slot, setSlot] = useState(null) // { date, time } for a new booking
  const [selected, setSelected] = useState(null) // existing booking
  const [cancelling, setCancelling] = useState(null)
  const [form, setForm] = useState({ purpose: '', error: '' })
  const { push } = useToast()

  useEffect(() => { if (book.data) setBookings(book.data) }, [book.data])

  const facilities = fac.data || []
  const facilityId = Number(params.get('facility')) || facilities[0]?.id
  const facility = facilities.find((f) => f.id === facilityId)
  const mine = useMemo(() => bookings.filter((b) => b.facilityId === facilityId), [bookings, facilityId])
  const find = (date, time) => mine.find((b) => b.date === date && b.time === time)

  function cellState(date, time) {
    if (facility?.status === 'Maintenance') return 'Maintenance'
    return find(date, time)?.status || 'Available'
  }

  function requestBooking(e) {
    e.preventDefault()
    if (!form.purpose.trim()) { setForm((f) => ({ ...f, error: 'Enter a purpose for the booking.' })); return }
    setBookings((l) => [...l, { id: Date.now(), facilityId, date: slot.date, time: slot.time, purpose: form.purpose.trim(), bookedBy: 'Ronald Ocloo', status: 'Pending' }])
    push('Booking requested, pending approval')
    setSlot(null)
    setForm({ purpose: '', error: '' })
  }

  function setStatus(b, status) {
    setBookings((l) => l.map((x) => (x.id === b.id ? { ...x, status } : x)))
    setSelected(null)
    push(status === 'Confirmed' ? 'Booking approved' : 'Booking updated')
  }

  function cancel() {
    setBookings((l) => l.filter((x) => x.id !== cancelling.id))
    setCancelling(null)
    setSelected(null)
    push('Booking cancelled')
  }

  const loading = fac.status === 'loading' || book.status === 'loading'
  const failed = fac.status === 'error' || book.status === 'error'
  const upcoming = [...mine].sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Operations" title="Bookings" description="Weekly availability and booking requests."
        actions={facilities.length > 0 && (
          <select aria-label="Facility" value={facilityId} onChange={(e) => setParams({ facility: e.target.value })}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none">
            {facilities.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        )} />

      {loading && <TableSkeleton rows={7} />}
      {failed && <ErrorState title="Couldn't load bookings" onRetry={() => { fac.reload(); book.reload() }} />}

      {!loading && !failed && !facility && <EmptyState icon={CalendarCheck} title="No facilities" description="Add a facility before taking bookings." />}

      {!loading && !failed && facility && (
        <>
          <Card>
            <CardHeader title={facility.name} subtitle={`Week of ${formatDate(weekDays[0].date, { day: 'numeric', month: 'short' })} – ${formatDate(weekDays[4].date, { day: 'numeric', month: 'short', year: 'numeric' })}`}
              action={
                <div className="hidden flex-wrap gap-3 text-xs text-gray-600 sm:flex">
                  {[['Available', 'bg-emerald-200'], ['Booked', 'bg-blue-600'], ['Pending approval', 'bg-amber-300'], ['Maintenance', 'bg-gray-300']].map(([l, c]) => (
                    <span key={l} className="inline-flex items-center gap-1.5"><span className={`h-2.5 w-2.5 rounded-sm ${c}`} /> {l}</span>
                  ))}
                </div>
              } />
            <div className="overflow-x-auto p-4">
              <table className="w-full min-w-[560px] border-separate border-spacing-1.5 text-sm">
                <thead>
                  <tr>
                    <th className="w-16" />
                    {weekDays.map((d) => (
                      <th key={d.key} className="pb-1 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                        {d.key}<span className="block text-[11px] font-normal normal-case text-gray-400">{formatDate(d.date, { day: 'numeric', month: 'short' })}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {timeSlots.map((t) => (
                    <tr key={t}>
                      <td className="pr-2 text-right text-xs text-gray-500">{t}</td>
                      {weekDays.map((d) => {
                        const state = cellState(d.date, t)
                        const b = find(d.date, t)
                        const label = state === 'Confirmed' ? 'Booked' : state === 'Pending' ? 'Pending' : state
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
              <div className="p-6"><EmptyState icon={CalendarCheck} title="No bookings yet" description="Select an available slot in the calendar to make a booking." /></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                    <tr>{['Date', 'Time', 'Purpose', 'Booked by', 'Status', ''].map((h) => <th key={h} className="px-5 py-3 font-medium">{h}</th>)}</tr>
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
                          {b.status === 'Pending' && (
                            <span className="inline-flex gap-2">
                              <Button size="sm" icon={Check} onClick={() => setStatus(b, 'Confirmed')}>Approve</Button>
                              <Button size="sm" variant="secondary" icon={X} onClick={() => setCancelling(b)}>Reject</Button>
                            </span>
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

      <Modal open={!!slot} onClose={() => setSlot(null)} title="Request booking"
        footer={<><Button variant="secondary" onClick={() => setSlot(null)}>Cancel</Button><Button type="submit" form="booking-form">Request Booking</Button></>}>
        {slot && (
          <form id="booking-form" onSubmit={requestBooking} noValidate className="space-y-4">
            <p className="text-sm text-gray-600">{facility?.name} · {formatDate(slot.date, { weekday: 'long', day: 'numeric', month: 'short' })} · {slot.time}</p>
            <Input label="Purpose" required placeholder="e.g. Football training" value={form.purpose} onChange={(e) => setForm({ purpose: e.target.value, error: '' })} error={form.error} />
          </form>
        )}
      </Modal>

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Booking details"
        footer={selected && (
          <>
            <Button variant="secondary" onClick={() => setCancelling(selected)}>Cancel booking</Button>
            {selected.status === 'Pending' && <Button onClick={() => setStatus(selected, 'Confirmed')}>Approve</Button>}
          </>
        )}>
        {selected && (
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between"><dt className="text-gray-500">Facility</dt><dd className="font-medium text-gray-900">{facility?.name}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">When</dt><dd className="font-medium text-gray-900">{formatDate(selected.date, { weekday: 'short', day: 'numeric', month: 'short' })} · {selected.time}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">Purpose</dt><dd className="font-medium text-gray-900">{selected.purpose}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">Booked by</dt><dd className="font-medium text-gray-900">{selected.bookedBy}</dd></div>
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
