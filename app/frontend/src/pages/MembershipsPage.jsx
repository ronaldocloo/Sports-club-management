import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, BadgeCheck, CalendarX, CreditCard, Plus, TrendingUp, UserPlus } from 'lucide-react'
import { getMembers, getMembershipPlans } from '../api/operations'
import useAsync from '../hooks/useAsync'
import { Badge, Button, Card, CardHeader, CardSkeleton, EmptyState, ErrorState, Input, Modal, PageHeader, Pagination, SearchInput, StatCard, TableSkeleton, Tabs, useToast } from '../components/ui'
import { membershipStatus } from '../utils/membership'
import { formatDate, formatMoney } from '../utils/format'

const PAGE_SIZE = 10
const payTone = { Paid: 'green', Pending: 'amber', Overdue: 'red' }

function PlanModal({ open, onClose, onSave }) {
  const [v, setV] = useState({ name: '', price: '', perks: '' })
  const [errors, setErrors] = useState({})
  const set = (k) => (e) => setV((s) => ({ ...s, [k]: e.target.value }))

  function submit(e) {
    e.preventDefault()
    const err = {}
    if (!v.name.trim()) err.name = 'Plan name is required.'
    if (!v.price || Number(v.price) <= 0) err.price = 'Enter a price greater than 0.'
    setErrors(err)
    if (Object.keys(err).length) return
    onSave({ name: v.name.trim(), price: Number(v.price), period: 'month', perks: v.perks.split('\n').map((p) => p.trim()).filter(Boolean) })
    setV({ name: '', price: '', perks: '' })
  }

  return (
    <Modal open={open} onClose={onClose} title="Create membership plan"
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" form="plan-form">Create Plan</Button></>}>
      <form id="plan-form" onSubmit={submit} noValidate className="space-y-4">
        <Input label="Plan name" required value={v.name} onChange={set('name')} error={errors.name} />
        <Input label="Price per month (GH₵)" required type="number" min="0" value={v.price} onChange={set('price')} error={errors.price} />
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-gray-700">Perks (one per line)</span>
          <textarea rows={3} value={v.perks} onChange={set('perks')} className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
        </label>
      </form>
    </Modal>
  )
}

function MembershipsPage() {
  const members = useAsync(getMembers)
  const plansLoad = useAsync(getMembershipPlans)
  const [plans, setPlans] = useState([])
  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [planOpen, setPlanOpen] = useState(false)
  const { push } = useToast()

  useEffect(() => { if (plansLoad.data) setPlans(plansLoad.data) }, [plansLoad.data])
  useEffect(() => { setPage(1) }, [filter, search])

  const rows = useMemo(() => (members.data || []).map((m) => ({ ...m, state: membershipStatus(m) })), [members.data])
  const price = useCallback((name) => plans.find((p) => p.name === name)?.price || 0, [plans])

  const counts = useMemo(() => {
    const c = { Active: 0, Expiring: 0, Expired: 0, Pending: 0 }
    rows.forEach((r) => { c[r.state.key]++ })
    return c
  }, [rows])
  const newThisMonth = rows.filter((r) => r.start >= '2026-09-01').length
  const mrr = rows.filter((r) => r.state.key === 'Active' || r.state.key === 'Expiring').reduce((s, r) => s + price(r.type), 0)

  const filtered = rows.filter((r) => (filter === 'All' || r.state.key === filter) && r.name.toLowerCase().includes(search.toLowerCase().trim()))
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const planCounts = (name) => rows.filter((r) => r.type === name && (r.state.key === 'Active' || r.state.key === 'Expiring')).length

  const loading = members.status === 'loading' || plansLoad.status === 'loading'
  const failed = members.status === 'error' || plansLoad.status === 'error'

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Operations" title="Memberships" description="Plans, renewals and recurring revenue."
        actions={<Button icon={Plus} onClick={() => setPlanOpen(true)}>New Plan</Button>} />

      {loading && <><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5"><CardSkeleton /><CardSkeleton /><CardSkeleton /><CardSkeleton /><CardSkeleton /></div><TableSkeleton /></>}
      {failed && <ErrorState title="Couldn't load memberships" onRetry={() => { members.reload(); plansLoad.reload() }} />}

      {!loading && !failed && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard icon={BadgeCheck} tone="green" label="Active" value={counts.Active} note="in good standing" />
            <StatCard icon={AlertTriangle} tone="amber" label="Expiring soon" value={counts.Expiring} note="next 30 days" />
            <StatCard icon={CalendarX} label="Expired" value={counts.Expired} note="need renewal" />
            <StatCard icon={UserPlus} tone="violet" label="New this month" value={newThisMonth} note="joined in September" />
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
              <Tabs value={filter} onChange={setFilter} tabs={[{ value: 'All', label: 'All', count: rows.length }, { value: 'Active', label: 'Active', count: counts.Active }, { value: 'Expiring', label: 'Expiring', count: counts.Expiring }, { value: 'Expired', label: 'Expired', count: counts.Expired }, { value: 'Pending', label: 'Pending', count: counts.Pending }]} />
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
                      <tr key={r.athleteId} className="hover:bg-gray-50">
                        <td className="px-5 py-3"><Link to={`/athletes/${r.athleteId}`} className="font-medium text-gray-900 hover:text-blue-600">{r.name}</Link></td>
                        <td className="px-5 py-3 text-gray-700">{r.sport}</td>
                        <td className="px-5 py-3 text-gray-700">{r.type}</td>
                        <td className="px-5 py-3 text-gray-700">{formatDate(r.start)}</td>
                        <td className="px-5 py-3 text-gray-700">{formatDate(r.expiry)}</td>
                        <td className="px-5 py-3"><Badge tone={r.state.tone}>{r.state.label}</Badge></td>
                        <td className="px-5 py-3"><Badge tone={payTone[r.payment]}>{r.payment}</Badge></td>
                        <td className="px-5 py-3 text-right">
                          {(r.state.key === 'Expiring' || r.state.key === 'Expired') && (
                            <Button size="sm" variant="secondary" onClick={() => push(`Renewal reminder sent to ${r.name}`)}>Send reminder</Button>
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

      <PlanModal open={planOpen} onClose={() => setPlanOpen(false)} onSave={(plan) => {
        setPlans((list) => [...list, { ...plan, id: Date.now() }])
        setPlanOpen(false)
        push(`Plan “${plan.name}” created`)
      }} />
    </div>
  )
}

export default MembershipsPage
