import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, BadgeCheck, CalendarX, CreditCard, Plus, TrendingUp, UserPlus } from 'lucide-react'
import { createMembership, createMembershipPlan, getMembers, getMembershipPlans } from '../api/operations'
import { getAthletes } from '../api/athletes'
import { errorMessage, USE_MOCKS } from '../api/client'
import { TODAY_ISO } from '../utils/today'
import useAsync from '../hooks/useAsync'
import { Badge, Button, Card, CardHeader, CardSkeleton, EmptyState, ErrorState, Input, Modal, PageHeader, Pagination, SearchInput, Select, StatCard, TableSkeleton, Tabs, useToast } from '../components/ui'
import { membershipStatus } from '../utils/membership'
import { formatDate, formatMoney } from '../utils/format'

const PAGE_SIZE = 10
const payTone = { Paid: 'green', Pending: 'amber', Overdue: 'red' }

function PlanModal({ open, onClose, onSave }) {
  const [v, setV] = useState({ name: '', price: '', months: '1', perks: '' })
  const [errors, setErrors] = useState({})
  const set = (k) => (e) => setV((s) => ({ ...s, [k]: e.target.value }))

  function submit(e) {
    e.preventDefault()
    const err = {}
    if (!v.name.trim()) err.name = 'Plan name is required.'
    if (!v.price || Number(v.price) <= 0) err.price = 'Enter a price greater than 0.'
    if (!USE_MOCKS && (!Number.isInteger(Number(v.months)) || Number(v.months) < 1)) err.months = 'Enter a whole number of months.'
    setErrors(err)
    if (Object.keys(err).length) return
    onSave({ name: v.name.trim(), price: Number(v.price), months: Number(v.months) || 1, period: 'month', perks: v.perks.split('\n').map((p) => p.trim()).filter(Boolean) })
    setV({ name: '', price: '', months: '1', perks: '' })
  }

  return (
    <Modal open={open} onClose={onClose} title="Create membership plan"
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" form="plan-form">Create Plan</Button></>}>
      <form id="plan-form" onSubmit={submit} noValidate className="space-y-4">
        <Input label="Plan name" required value={v.name} onChange={set('name')} error={errors.name} />
        <Input label={USE_MOCKS ? 'Price per month (GH₵)' : 'Fee (GH₵)'} required type="number" min="0" value={v.price} onChange={set('price')} error={errors.price} />
        {!USE_MOCKS && <Input label="Duration (months)" required type="number" min="1" value={v.months} onChange={set('months')} error={errors.months} />}
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-gray-700">Perks (one per line)</span>
          <textarea rows={3} value={v.perks} onChange={set('perks')} className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
        </label>
      </form>
    </Modal>
  )
}

function MembershipModal({ open, athletes, plans, onClose, onSave }) {
  const empty = { athleteId: '', planId: '', startDate: TODAY_ISO }
  const [v, setV] = useState(empty)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const set = (k) => (e) => setV((s) => ({ ...s, [k]: e.target.value }))
  const close = () => { setV(empty); setErrors({}); onClose() }

  async function submit(e) {
    e.preventDefault()
    const err = {}
    if (!v.athleteId) err.athleteId = 'Select an athlete.'
    if (!v.planId) err.planId = 'Select a plan.'
    if (!v.startDate) err.startDate = 'Pick a start date.'
    setErrors(err)
    if (Object.keys(err).length) return
    setSaving(true)
    try {
      await onSave(v)
      close()
    } catch (e2) {
      setErrors({ submit: errorMessage(e2, "We couldn't create this membership.") })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={close} title="New membership"
      footer={<><Button variant="secondary" onClick={close}>Cancel</Button><Button type="submit" form="membership-form" loading={saving}>Create Membership</Button></>}>
      <form id="membership-form" onSubmit={submit} noValidate className="space-y-4">
        <Select label="Athlete" required options={athletes.map((a) => ({ value: String(a.athleteId), label: `${a.firstName} ${a.lastName}` }))} placeholder="Select athlete" value={v.athleteId} onChange={set('athleteId')} error={errors.athleteId} />
        <Select label="Plan" required options={plans.map((p) => ({ value: String(p.id), label: `${p.name} · ${formatMoney(p.price)} / ${p.period}` }))} placeholder="Select plan" value={v.planId} onChange={set('planId')} error={errors.planId} />
        <Input label="Start date" required type="date" value={v.startDate} onChange={set('startDate')} error={errors.startDate} />
        {errors.submit && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{errors.submit}</p>}
      </form>
    </Modal>
  )
}

function MembershipsPage() {
  const members = useAsync(getMembers)
  const plansLoad = useAsync(getMembershipPlans)
  const athletesLoad = useAsync(getAthletes)
  const [memberOpen, setMemberOpen] = useState(false)
  const [plans, setPlans] = useState([])
  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [planOpen, setPlanOpen] = useState(false)
  const { push } = useToast()

  useEffect(() => { if (plansLoad.data) setPlans(plansLoad.data) }, [plansLoad.data])
  useEffect(() => { setPage(1) }, [filter, search])

  const rows = useMemo(() => (members.data || []).map((m) => ({ ...m, state: membershipStatus(m) })), [members.data])
  const price = useCallback((name) => { const p = plans.find((x) => x.name === name); return p ? (p.monthly ?? p.price) : 0 }, [plans])

  const counts = useMemo(() => {
    const c = { Active: 0, Expiring: 0, Expired: 0, Pending: 0, Suspended: 0 }
    rows.forEach((r) => { c[r.state.key]++ })
    return c
  }, [rows])
  const monthStart = TODAY_ISO.slice(0, 7) + '-01'
  const newThisMonth = rows.filter((r) => r.start >= monthStart).length
  const mrr = rows.filter((r) => r.state.key === 'Active' || r.state.key === 'Expiring').reduce((s, r) => s + price(r.type), 0)

  const filtered = rows.filter((r) => (filter === 'All' || r.state.key === filter) && r.name.toLowerCase().includes(search.toLowerCase().trim()))
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const planCounts = (name) => rows.filter((r) => r.type === name && (r.state.key === 'Active' || r.state.key === 'Expiring')).length

  const loading = members.status === 'loading' || plansLoad.status === 'loading'
  const failed = members.status === 'error' || plansLoad.status === 'error'

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Operations" title="Memberships" description="Plans, renewals and recurring revenue."
        actions={<><Button variant="secondary" icon={Plus} onClick={() => setPlanOpen(true)}>New Plan</Button><Button icon={Plus} onClick={() => setMemberOpen(true)}>New Membership</Button></>} />

      {loading && <><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5"><CardSkeleton /><CardSkeleton /><CardSkeleton /><CardSkeleton /><CardSkeleton /></div><TableSkeleton /></>}
      {failed && <ErrorState title="Couldn't load memberships" onRetry={() => { members.reload(); plansLoad.reload() }} />}

      {!loading && !failed && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard icon={BadgeCheck} tone="green" label="Active" value={counts.Active} note="in good standing" />
            <StatCard icon={AlertTriangle} tone="amber" label="Expiring soon" value={counts.Expiring} note="next 30 days" />
            <StatCard icon={CalendarX} label="Expired" value={counts.Expired} note="need renewal" />
            <StatCard icon={UserPlus} tone="violet" label="New this month" value={newThisMonth} note="joined this month" />
            <StatCard icon={TrendingUp} tone="green" label="Monthly recurring revenue" value={formatMoney(mrr)} note="active + expiring" />
          </div>

          <div>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Plans</h2>
            <div className="grid gap-4 md:grid-cols-3">
              {plans.map((p) => (
                <Card key={p.id} className="p-5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold text-gray-900">{p.name}</h3>
                    <Badge tone="blue">{planCounts(p.name)} members</Badge>
                  </div>
                  <p className="mt-3 text-3xl font-bold text-gray-900">{formatMoney(p.price)}<span className="text-sm font-normal text-gray-500"> / {p.period}</span></p>
                  <ul className="mt-4 space-y-1.5 text-sm text-gray-600">
                    {p.perks.map((perk) => <li key={perk} className="flex items-center gap-2"><BadgeCheck size={14} className="text-emerald-500" /> {perk}</li>)}
                  </ul>
                </Card>
              ))}
            </div>
          </div>

          <Card>
            <CardHeader title="Members" subtitle={`${filtered.length} memberships`} />
            <div className="space-y-4 p-4">
              <Tabs value={filter} onChange={setFilter} tabs={[{ value: 'All', label: 'All', count: rows.length }, { value: 'Active', label: 'Active', count: counts.Active }, { value: 'Expiring', label: 'Expiring', count: counts.Expiring }, { value: 'Expired', label: 'Expired', count: counts.Expired }, { value: 'Pending', label: 'Pending', count: counts.Pending }, ...(counts.Suspended ? [{ value: 'Suspended', label: 'Suspended', count: counts.Suspended }] : [])]} />
              <div className="flex"><SearchInput value={search} onChange={setSearch} placeholder="Search members" label="Search members" /></div>
            </div>
            {filtered.length === 0 ? (
              <div className="p-6"><EmptyState icon={CreditCard} title="No memberships found" description="There are currently no memberships matching your filters." /></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[820px] text-left text-sm">
                  <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                    <tr>{['Member', 'Sport', 'Plan', 'Start', 'Expiry', 'Status', 'Payment', ''].map((h) => <th key={h} className="px-5 py-3 font-medium">{h}</th>)}</tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {visible.map((r) => (
                      <tr key={r.id ?? r.athleteId} className="hover:bg-gray-50">
                        <td className="px-5 py-3"><Link to={`/athletes/${r.athleteId}`} className="font-medium text-gray-900 hover:text-blue-600">{r.name}</Link></td>
                        <td className="px-5 py-3 text-gray-700">{r.sport}</td>
                        <td className="px-5 py-3 text-gray-700">{r.type}</td>
                        <td className="px-5 py-3 text-gray-700">{formatDate(r.start)}</td>
                        <td className="px-5 py-3 text-gray-700">{formatDate(r.expiry)}</td>
                        <td className="px-5 py-3"><Badge tone={r.state.tone}>{r.state.label}</Badge></td>
                        <td className="px-5 py-3"><Badge tone={payTone[r.payment]}>{r.payment}</Badge></td>
                        <td className="px-5 py-3 text-right">
                          {(r.state.key === 'Expiring' || r.state.key === 'Expired') && (
                            <Button size="sm" variant="secondary" onClick={() => push(`Reminder noted for ${r.name}. Email delivery isn't connected yet.`)}>Send reminder</Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <Pagination page={page} pageSize={PAGE_SIZE} total={filtered.length} onChange={setPage} />
          </Card>
        </>
      )}

      <MembershipModal open={memberOpen} athletes={athletesLoad.data || []} plans={plans} onClose={() => setMemberOpen(false)} onSave={async (v) => {
        const plan = plans.find((p) => String(p.id) === v.planId)
        const athlete = (athletesLoad.data || []).find((a) => String(a.athleteId) === v.athleteId)
        const created = await createMembership(v, plan, athlete)
        members.setData((l) => [created, ...(l || [])])
        push(`Membership created for ${created.name}`)
      }} />

      <PlanModal open={planOpen} onClose={() => setPlanOpen(false)} onSave={async (plan) => {
        try {
          const created = await createMembershipPlan(plan)
          setPlans((list) => [...list, created])
          setPlanOpen(false)
          push(`Plan “${plan.name}” created`)
        } catch (e) {
          push(errorMessage(e), 'error')
        }
      }} />
    </div>
  )
}

export default MembershipsPage
