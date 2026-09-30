import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Building2, CalendarCheck, Dumbbell, Gauge, Plus, Trophy, Users, Waves, Wrench } from 'lucide-react'
import { createFacility, facilityTypes, getBookings, getFacilities, setFacilityStatus } from '../api/operations'
import { errorMessage } from '../api/client'
import useAsync from '../hooks/useAsync'
import { Badge, Button, Card, CardSkeleton, ConfirmDialog, EmptyState, ErrorState, Input, Modal, PageHeader, Select, StatCard, useToast } from '../components/ui'

const typeIcon = { 'Swimming pool': Waves, Pool: Waves, Gym: Dumbbell, 'Meeting room': Users, Hall: Users, 'Football pitch': Trophy, Field: Trophy, Track: Trophy }
const statusTone = { Available: 'green', Maintenance: 'amber', Closed: 'gray' }

function FacilityModal({ open, onClose, onSave }) {
  const empty = { name: '', type: '', capacity: '', location: '' }
  const [v, setV] = useState(empty)
  const [errors, setErrors] = useState({})
  const set = (k) => (e) => setV((s) => ({ ...s, [k]: e.target.value }))
  const close = () => { setV(empty); setErrors({}); onClose() }

  function submit(e) {
    e.preventDefault()
    const err = {}
    if (!v.name.trim()) err.name = 'Facility name is required.'
    if (!v.type) err.type = 'Select a facility type.'
    if (!v.capacity || Number(v.capacity) <= 0) err.capacity = 'Enter a capacity greater than 0.'
    setErrors(err)
    if (Object.keys(err).length) return
    onSave({ name: v.name.trim(), type: v.type, capacity: Number(v.capacity), location: v.location.trim() })
    setV(empty)
  }

  return (
    <Modal open={open} onClose={close} title="Add facility"
      footer={<><Button variant="secondary" onClick={close}>Cancel</Button><Button type="submit" form="facility-form">Add Facility</Button></>}>
      <form id="facility-form" onSubmit={submit} noValidate className="space-y-4">
        <Input label="Name" required value={v.name} onChange={set('name')} error={errors.name} />
        <Select label="Type" required options={facilityTypes} placeholder="Select type" value={v.type} onChange={set('type')} error={errors.type} />
        <Input label="Capacity" required type="number" min="1" value={v.capacity} onChange={set('capacity')} error={errors.capacity} />
        <Input label="Location" value={v.location} onChange={set('location')} />
      </form>
    </Modal>
  )
}

function FacilitiesPage() {
  const fac = useAsync(getFacilities)
  const book = useAsync(getBookings)
  const [list, setList] = useState([])
  const [addOpen, setAddOpen] = useState(false)
  const [toggle, setToggle] = useState(null)
  const { push } = useToast()

  useEffect(() => { if (fac.data) setList(fac.data) }, [fac.data])

  const bookings = book.data || []
  const weekCount = (id) => bookings.filter((b) => b.facilityId === id && b.status !== 'Cancelled').length
  const available = list.filter((f) => f.status === 'Available').length
  const avg = list.length ? Math.round(list.reduce((s, f) => s + f.utilization, 0) / list.length) : 0
  const most = [...list].sort((a, b) => b.utilization - a.utilization)[0]

  async function add(f) {
    try {
      const created = await createFacility(f)
      setList((l) => [...l, created])
      setAddOpen(false)
      push(`${f.name} added`)
    } catch (e) {
      push(errorMessage(e), 'error')
    }
  }

  async function confirmToggle() {
    const target = toggle
    const next = target.status === 'Available' ? 'Maintenance' : 'Available'
    setToggle(null)
    try {
      const updated = await setFacilityStatus(target, next)
      setList((l) => l.map((f) => (f.id === updated.id ? { ...f, ...updated } : f)))
      push(`${target.name} set to ${next.toLowerCase()}`)
    } catch (e) {
      push(errorMessage(e), 'error')
    }
  }

  const loading = fac.status === 'loading'
  const failed = fac.status === 'error'

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Operations" title="Facilities" description="Pitches, courts, pools and rooms, with availability and utilization."
        actions={<Button icon={Plus} onClick={() => setAddOpen(true)}>Add Facility</Button>} />

      {loading && <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><CardSkeleton /><CardSkeleton /><CardSkeleton /></div>}
      {failed && <ErrorState title="Couldn't load facilities" onRetry={fac.reload} />}

      {!loading && !failed && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={Building2} label="Facilities" value={list.length} note={`${available} available`} />
            <StatCard icon={Wrench} tone="amber" label="Under maintenance" value={list.length - available} note="out of service" />
            <StatCard icon={Gauge} tone="green" label="Average utilization" value={`${avg}%`} note="across all facilities" />
            <StatCard icon={CalendarCheck} tone="violet" label="Most booked" value={most?.name || '—'} note={most ? `${most.utilization}% utilization` : ''} to="/bookings" linkLabel="Open bookings" />
          </div>

          {list.length === 0 ? (
            <EmptyState icon={Building2} title="No facilities yet" description="Add your first pitch, court or room to start taking bookings." action={<Button icon={Plus} onClick={() => setAddOpen(true)}>Add Facility</Button>} />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((f) => {
                const Icon = typeIcon[f.type] || Building2
                const bar = f.utilization >= 85 ? 'bg-red-500' : f.utilization >= 65 ? 'bg-amber-500' : 'bg-emerald-500'
                return (
                  <Card key={f.id} className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Icon size={22} /></div>
                      <Badge tone={statusTone[f.status] || 'gray'}>{f.status}</Badge>
                    </div>
                    <h3 className="mt-4 text-base font-semibold text-gray-900">{f.name}</h3>
                    <p className="text-sm text-gray-500">{f.type} · Capacity {f.capacity}{f.location ? ` · ${f.location}` : ''}</p>
                    <div className="mt-4">
                      <div className="mb-1 flex justify-between text-xs text-gray-500"><span>Utilization</span><span className="font-semibold text-gray-900">{f.utilization}%</span></div>
                      <div className="h-2 rounded-full bg-gray-100"><div className={`h-2 rounded-full ${bar}`} style={{ width: `${f.utilization}%` }} /></div>
                    </div>
                    <p className="mt-3 text-xs text-gray-500">{book.status === 'ready' ? `${weekCount(f.id)} bookings this week` : ' '}</p>
                    <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
                      <Link to={`/bookings?facility=${f.id}`} className="text-sm font-medium text-blue-600 hover:text-blue-700">View bookings</Link>
                      <Button size="sm" variant="secondary" onClick={() => setToggle(f)}>{f.status === 'Available' ? 'Set maintenance' : 'Mark available'}</Button>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </>
      )}

      <FacilityModal open={addOpen} onClose={() => setAddOpen(false)} onSave={add} />
      <ConfirmDialog
        open={!!toggle}
        title={toggle?.status !== 'Available' ? 'Mark facility available?' : 'Set facility to maintenance?'}
        description={toggle?.status !== 'Available' ? `${toggle?.name} will become bookable again.` : `${toggle?.name} will be unavailable for new bookings until it is marked available.`}
        confirmLabel="Confirm"
        onConfirm={confirmToggle}
        onCancel={() => setToggle(null)}
      />
    </div>
  )
}

export default FacilitiesPage
