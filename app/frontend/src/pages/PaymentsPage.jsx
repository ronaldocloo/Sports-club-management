import { useEffect, useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { AlertCircle, Plus, Receipt, TrendingUp, Wallet } from 'lucide-react'
import { getPayments } from '../api/operations'
import { getAthletes } from '../api/athletes'
import useAsync from '../hooks/useAsync'
import { revenueByMonth } from '../mocks/demoData'
import { Badge, Button, Card, CardHeader, CardSkeleton, EmptyState, ErrorState, Input, Modal, PageHeader, Pagination, SearchInput, Select, StatCard, TableSkeleton, Tabs, useToast } from '../components/ui'
import { formatDate, formatMoney } from '../utils/format'

const PAGE_SIZE = 10
const statusTone = { Paid: 'green', Pending: 'amber', Failed: 'red', Refunded: 'gray' }
const types = ['Membership', 'Competition fee', 'Facility booking', 'Other']
const methods = ['MTN MoMo', 'Vodafone Cash', 'Card', 'Cash', 'Bank transfer']
const THIS_MONTH = '2026-09'

function RecordPaymentModal({ open, members, onClose, onSave }) {
  const empty = { member: '', type: '', amount: '', method: '', status: 'Paid' }
  const [v, setV] = useState(empty)
  const [errors, setErrors] = useState({})
  const set = (k) => (e) => setV((s) => ({ ...s, [k]: e.target.value }))

  function close() { setV(empty); setErrors({}); onClose() }

  function submit(e) {
    e.preventDefault()
    const err = {}
    if (!v.member) err.member = 'Select a member.'
    if (!v.type) err.type = 'Select a payment type.'
    if (!v.amount || Number(v.amount) <= 0) err.amount = 'Enter an amount greater than 0.'
    if (!v.method) err.method = 'Select a payment method.'
    setErrors(err)
    if (Object.keys(err).length) return
    onSave({ ...v, amount: Number(v.amount) })
    setV(empty)
  }

  return (
    <Modal open={open} onClose={close} title="Record payment"
      footer={<><Button variant="secondary" onClick={close}>Cancel</Button><Button type="submit" form="payment-form">Save Payment</Button></>}>
      <form id="payment-form" onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2"><Select label="Member" required options={members} placeholder="Select member" value={v.member} onChange={set('member')} error={errors.member} /></div>
        <Select label="Type" required options={types} placeholder="Select type" value={v.type} onChange={set('type')} error={errors.type} />
        <Input label="Amount (GH₵)" required type="number" min="0" value={v.amount} onChange={set('amount')} error={errors.amount} />
        <Select label="Method" required options={methods} placeholder="Select method" value={v.method} onChange={set('method')} error={errors.method} />
        <Select label="Status" options={['Paid', 'Pending']} placeholder="Status" value={v.status} onChange={set('status')} />
      </form>
    </Modal>
  )
}

function PaymentsPage() {
  const payments = useAsync(getPayments)
  const athletes = useAsync(getAthletes)
  const [rows, setRows] = useState([])
  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState(false)
  const { push } = useToast()

  useEffect(() => { if (payments.data) setRows(payments.data) }, [payments.data])
  useEffect(() => { setPage(1) }, [filter, search])

  const monthPaid = rows.filter((r) => r.status === 'Paid' && r.date.startsWith(THIS_MONTH))
  const revenue = monthPaid.reduce((s, r) => s + r.amount, 0)
  const outstanding = rows.filter((r) => r.status === 'Pending').reduce((s, r) => s + r.amount, 0)
  const pendingCount = rows.filter((r) => r.status === 'Pending').length
  const issues = rows.filter((r) => r.status === 'Failed' || r.status === 'Refunded').length

  const counts = useMemo(() => {
    const c = { All: rows.length, Paid: 0, Pending: 0, Failed: 0, Refunded: 0 }
    rows.forEach((r) => { c[r.status]++ })
    return c
  }, [rows])

  const filtered = rows.filter((r) => (filter === 'All' || r.status === filter) && `${r.member} ${r.type} ${r.id}`.toLowerCase().includes(search.toLowerCase().trim()))
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const memberOptions = (athletes.data || []).map((a) => `${a.firstName} ${a.lastName}`)

  function markPaid(id) {
    setRows((list) => list.map((r) => (r.id === id ? { ...r, status: 'Paid' } : r)))
    push(`Payment #${id} marked as paid`)
  }

  function save(p) {
    const id = Math.max(0, ...rows.map((r) => r.id)) + 1
    setRows((list) => [{ id, date: '2026-09-29', ...p }, ...list])
    setOpen(false)
    push(`Payment #${id} recorded`)
  }

  const loading = payments.status === 'loading'
  const failed = payments.status === 'error'

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Operations" title="Payments" description="Revenue, outstanding balances and transaction history."
        actions={<Button icon={Plus} onClick={() => setOpen(true)}>Record Payment</Button>} />

      {loading && <><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><CardSkeleton /><CardSkeleton /><CardSkeleton /><CardSkeleton /></div><TableSkeleton /></>}
      {failed && <ErrorState title="Couldn't load payments" onRetry={payments.reload} />}

      {!loading && !failed && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={Wallet} tone="green" label="Revenue this month" value={formatMoney(revenue)} note={`${monthPaid.length} paid transactions`} />
            <StatCard icon={AlertCircle} tone="amber" label="Outstanding" value={formatMoney(outstanding)} note={`${pendingCount} pending payments`} />
            <StatCard icon={Receipt} label="Transactions" value={rows.length} note="last 60 days" />
            <StatCard icon={TrendingUp} tone="violet" label="Failed / refunded" value={issues} note="need attention" />
          </div>

          <Card>
            <CardHeader title="Revenue by source" subtitle="Last 6 months (GH₵)" />
            <div className="h-72 px-2 pb-4 pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueByMonth} margin={{ left: 0, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} width={48} tickFormatter={(v) => `${v / 1000}k`} />
                  <Tooltip formatter={(v) => formatMoney(v)} />
                  <Legend />
                  <Bar dataKey="memberships" name="Memberships" stackId="a" fill="#2563eb" />
                  <Bar dataKey="competitions" name="Competition fees" stackId="a" fill="#10b981" />
                  <Bar dataKey="facilities" name="Facility bookings" stackId="a" fill="#f59e0b" />
                  <Bar dataKey="other" name="Other" stackId="a" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card>
            <CardHeader title="Transactions" subtitle={`${filtered.length} transactions`} />
            <div className="space-y-4 p-4">
              <Tabs value={filter} onChange={setFilter} tabs={['All', 'Paid', 'Pending', 'Failed', 'Refunded'].map((s) => ({ value: s, label: s, count: counts[s] }))} />
              <div className="flex"><SearchInput value={search} onChange={setSearch} placeholder="Search by member, type or ID" label="Search transactions" /></div>
            </div>
            {filtered.length === 0 ? (
              <div className="p-6"><EmptyState icon={Receipt} title="No transactions found" description="There are currently no transactions matching your filters." /></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                    <tr>{['ID', 'Date', 'Member', 'Type', 'Method', 'Amount', 'Status', ''].map((h) => <th key={h} className="px-5 py-3 font-medium">{h}</th>)}</tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {visible.map((r) => (
                      <tr key={r.id} className="hover:bg-gray-50">
                        <td className="px-5 py-3 text-gray-500">#{r.id}</td>
                        <td className="px-5 py-3 text-gray-700">{formatDate(r.date)}</td>
                        <td className="px-5 py-3 font-medium text-gray-900">{r.member}</td>
                        <td className="px-5 py-3 text-gray-700">{r.type}</td>
                        <td className="px-5 py-3 text-gray-700">{r.method}</td>
                        <td className="px-5 py-3 font-semibold text-gray-900">{formatMoney(r.amount)}</td>
                        <td className="px-5 py-3"><Badge tone={statusTone[r.status]}>{r.status}</Badge></td>
                        <td className="px-5 py-3 text-right">{r.status === 'Pending' && <Button size="sm" variant="secondary" onClick={() => markPaid(r.id)}>Mark paid</Button>}</td>
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

      <RecordPaymentModal open={open} members={memberOptions} onClose={() => setOpen(false)} onSave={save} />
    </div>
  )
}

export default PaymentsPage
