import { ChevronLeft, ChevronRight } from 'lucide-react'

function Pagination({ page, pageSize, total, onChange }) {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  if (total <= pageSize) return null
  const from = (page - 1) * pageSize + 1
  const to = Math.min(total, page * pageSize)
  const btn = 'rounded-lg border border-gray-200 p-1.5 text-gray-600 hover:bg-gray-50 disabled:opacity-40'
  return (
    <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3 text-sm text-gray-500">
      <span>{from}–{to} of {total}</span>
      <div className="flex items-center gap-2">
        <button aria-label="Previous page" className={btn} disabled={page <= 1} onClick={() => onChange(page - 1)}><ChevronLeft size={16} /></button>
        <span>Page {page} of {pages}</span>
        <button aria-label="Next page" className={btn} disabled={page >= pages} onClick={() => onChange(page + 1)}><ChevronRight size={16} /></button>
      </div>
    </div>
  )
}

export default Pagination
