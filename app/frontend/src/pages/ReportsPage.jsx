import { useCallback, useEffect, useMemo, useState } from 'react'
import { Download, FileSpreadsheet, FileText, Printer } from 'lucide-react'
import { downloadReport, fetchReport, reportsFor } from '../api/reports'
import { getTeams } from '../api/teams'
import { errorMessage } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { normalizeRole } from '../utils/permissions'
import { presetRange } from '../utils/ranges'
import { Button, Card, CardHeader, CardSkeleton, DateRangePicker, EmptyState, ErrorState, PageHeader, TableSkeleton, Tabs, useToast } from '../components/ui'

const PREVIEW_ROWS = 15

function ReportsPage() {
  const { user } = useAuth()
  const role = normalizeRole(user?.role)
  const available = useMemo(() => reportsFor(role), [role])
  const [type, setType] = useState(available[0]?.key)
  const [range, setRange] = useState({ preset: '90d', ...presetRange('90d') })
  const [teamId, setTeamId] = useState('')
  const [teams, setTeams] = useState([])
  const [report, setReport] = useState(null)
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState('')
  const { push } = useToast()
  const meta = available.find((r) => r.key === type)

  useEffect(() => { getTeams().then(setTeams).catch(() => setTeams([])) }, [])
  useEffect(() => { if (!meta?.team) setTeamId('') }, [meta])

  const load = useCallback(() => {
    if (!type || !range.from || !range.to || range.from > range.to) return
    setStatus('loading')
    fetchReport(type, { from: range.from, to: range.to, teamId, limit: PREVIEW_ROWS })
      .then((r) => { setReport(r); setStatus('ready') })
      .catch((e) => { setError(errorMessage(e, 'Check the dates and try again.')); setStatus('error') })
  }, [type, range.from, range.to, teamId])
  useEffect(() => { load() }, [load])

  async function download(format, label) {
    setBusy(format)
    try {
      await downloadReport(type, format, { from: range.from, to: range.to, teamId })
      push(`${meta.title} report downloaded as ${label}`)
    } catch (e) {
      push(e.message, 'error')
    } finally {
      setBusy('')
    }
  }

  if (available.length === 0) {
    return <EmptyState icon={FileText} title="No reports available" description="Your role can't run any reports. Ask an administrator if you need access." />
  }

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Insights" title="Reports" description="Choose a report and a period, preview it, then download it as CSV, Excel or PDF."
        actions={<DateRangePicker value={range} onChange={setRange} />} />

      <Tabs value={type} onChange={setType} tabs={available.map((r) => ({ value: r.key, label: r.title }))} />

      {status === 'loading' && <><div className="grid gap-4 sm:grid-cols-4"><CardSkeleton /><CardSkeleton /><CardSkeleton /><CardSkeleton /></div><TableSkeleton /></>}
      {status === 'error' && <ErrorState title="Couldn't build this report" description={error} onRetry={load} />}

      {status === 'ready' && report && (
        <Card>
          <CardHeader title={report.title} subtitle={`${meta.description} ${report.total} ${report.total === 1 ? 'row' : 'rows'}.`}
            action={
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" icon={Download} loading={busy === 'csv'} onClick={() => download('csv', 'CSV')}>CSV</Button>
                <Button size="sm" variant="secondary" icon={FileSpreadsheet} loading={busy === 'xlsx'} onClick={() => download('xlsx', 'Excel')}>Excel</Button>
                <Button size="sm" variant="secondary" icon={Printer} loading={busy === 'pdf'} onClick={() => download('pdf', 'PDF')}>PDF</Button>
              </div>
            } />
          {meta.team && teams.length > 0 && (
            <div className="border-b border-gray-100 px-5 py-3">
              <select aria-label="Filter by team" value={teamId} onChange={(e) => setTeamId(e.target.value)} className="rounded-lg border border-gray-200 px-3 py-2 text-sm">
                <option value="">All teams</option>
                {teams.map((t) => <option key={t.teamId} value={t.teamId}>{t.teamName}</option>)}
              </select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4 border-b border-gray-100 p-5 md:grid-cols-4">
            {report.summary.map((s) => (
              <div key={s.label}><p className="text-xl font-bold text-gray-900">{s.value}</p><p className="text-xs text-gray-500">{s.label}</p></div>
            ))}
          </div>
          {report.rows.length === 0 ? (
            <div className="p-6"><EmptyState icon={FileText} title="No records in this period" description="Try a wider date range." /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                  <tr>{report.columns.map((c) => <th key={c} className="px-5 py-3 font-medium">{c}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {report.rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} className={`px-5 py-3 text-gray-700 ${typeof c === 'number' ? 'tabular-nums' : ''}`}>{c === null || c === '' ? '—' : c}</td>)}</tr>)}
                </tbody>
              </table>
            </div>
          )}
          {report.total > report.rows.length && (
            <p className="flex items-center gap-2 border-t border-gray-100 px-5 py-3 text-xs text-gray-500">
              <FileText size={14} /> Showing {report.rows.length} of {report.total} rows. Downloads include every row.
            </p>
          )}
        </Card>
      )}
    </div>
  )
}

export default ReportsPage
