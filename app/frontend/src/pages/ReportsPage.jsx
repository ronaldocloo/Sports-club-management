import { useState } from 'react'
import { Download, FileSpreadsheet, FileText, Printer } from 'lucide-react'
import { getReports } from '../api/analytics'
import useAsync from '../hooks/useAsync'
import { Button, Card, CardHeader, CardSkeleton, ErrorState, PageHeader, TableSkeleton, Tabs, useToast } from '../components/ui'
import { exportCsv, exportExcel, exportPdf } from '../utils/export'

const PREVIEW_ROWS = 10

function ReportsPage() {
  const { data, status, reload } = useAsync(getReports)
  const [key, setKey] = useState('athlete')
  const { push } = useToast()

  const report = data?.find((r) => r.key === key)

  function run(fn, label) {
    const ok = fn(report)
    if (ok === false) push('Pop-up blocked. Allow pop-ups to export PDF.', 'error')
    else push(`${report.title} exported as ${label}`)
  }

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Insights" title="Reports" description="Preview a report, then export it for sharing or record-keeping." />

      {status === 'loading' && <><div className="grid gap-4 sm:grid-cols-4"><CardSkeleton /><CardSkeleton /><CardSkeleton /><CardSkeleton /></div><TableSkeleton /></>}
      {status === 'error' && <ErrorState title="Couldn't load reports" onRetry={reload} />}

      {status === 'ready' && report && (
        <>
          <Tabs value={key} onChange={setKey} tabs={data.map((r) => ({ value: r.key, label: r.title.replace(' report', '') }))} />

          <Card>
            <CardHeader
              title={report.title}
              subtitle={`${report.description} ${report.rows.length} rows.`}
              action={
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="secondary" icon={Download} onClick={() => run(exportCsv, 'CSV')}>CSV</Button>
                  <Button size="sm" variant="secondary" icon={FileSpreadsheet} onClick={() => run(exportExcel, 'Excel')}>Excel</Button>
                  <Button size="sm" variant="secondary" icon={Printer} onClick={() => run(exportPdf, 'PDF')}>PDF</Button>
                </div>
              }
            />
            <div className="grid grid-cols-2 gap-4 border-b border-gray-100 p-5 md:grid-cols-4">
              {report.summary.map((s) => (
                <div key={s.label}>
                  <p className="text-xl font-bold text-gray-900">{s.value}</p>
                  <p className="text-xs text-gray-500">{s.label}</p>
                </div>
              ))}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                  <tr>{report.columns.map((c) => <th key={c} className="px-5 py-3 font-medium">{c}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {report.rows.slice(0, PREVIEW_ROWS).map((r, i) => (
                    <tr key={i}>{r.map((c, j) => <td key={j} className="px-5 py-3 text-gray-700">{c}</td>)}</tr>
                  ))}
                </tbody>
              </table>
            </div>
            {report.rows.length > PREVIEW_ROWS && (
              <p className="flex items-center gap-2 border-t border-gray-100 px-5 py-3 text-xs text-gray-500">
                <FileText size={14} /> Showing {PREVIEW_ROWS} of {report.rows.length} rows. Exports include every row.
              </p>
            )}
          </Card>
        </>
      )}
    </div>
  )
}

export default ReportsPage
