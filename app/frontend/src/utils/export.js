// Client-side report exports. CSV is standard; "Excel" is an HTML table saved as .xls, which
// Excel opens directly; PDF uses the browser's print dialog ("Save as PDF").

function download(filename, content, type) {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

const escapeHtml = (v) => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

function table(report) {
  const head = report.columns.map((c) => `<th>${escapeHtml(c)}</th>`).join('')
  const body = report.rows.map((r) => `<tr>${r.map((c) => `<td>${escapeHtml(c)}</td>`).join('')}</tr>`).join('')
  return `<table border="1" cellspacing="0" cellpadding="6"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`
}

export function exportCsv(report) {
  const cell = (v) => {
    let s = String(v)
    if (/^[=+\-@]/.test(s)) s = `'${s}` // avoid spreadsheet formula injection
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const lines = [report.columns, ...report.rows].map((r) => r.map(cell).join(','))
  download(`${report.key}-report.csv`, '﻿' + lines.join('\n'), 'text/csv;charset=utf-8')
}

export function exportExcel(report) {
  const html = `<html><head><meta charset="utf-8"></head><body>${table(report)}</body></html>`
  download(`${report.key}-report.xls`, html, 'application/vnd.ms-excel')
}

export function exportPdf(report) {
  const w = window.open('', '_blank')
  if (!w) return false
  const summary = report.summary.map((s) => `<div><b>${escapeHtml(s.value)}</b><br><small>${escapeHtml(s.label)}</small></div>`).join('')
  w.document.write(`<html><head><title>${escapeHtml(report.title)}</title><style>
    body{font-family:-apple-system,Segoe UI,sans-serif;padding:24px;color:#111}
    h1{margin:0 0 4px} p{color:#555;margin:0 0 16px}
    .s{display:flex;gap:32px;margin:16px 0}
    table{border-collapse:collapse;width:100%;font-size:12px} th{background:#f3f4f6;text-align:left} td,th{border:1px solid #ddd;padding:6px}
  </style></head><body><h1>${escapeHtml(report.title)}</h1><p>Ashesi Sports Club · Generated ${new Date().toLocaleDateString('en-GB')}</p><div class="s">${summary}</div>${table(report)}</body></html>`)
  w.document.close()
  w.focus()
  w.print()
  return true
}
