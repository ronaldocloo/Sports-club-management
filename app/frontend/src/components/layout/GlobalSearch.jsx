import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { searchIndex } from '../../mocks/demoData'
import useClickOutside from '../../hooks/useClickOutside'

function GlobalSearch() {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const navigate = useNavigate()
  useClickOutside(ref, () => setOpen(false))

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    const hits = searchIndex.filter((i) => `${i.label} ${i.sub}`.toLowerCase().includes(q))
    const map = new Map()
    hits.forEach((h) => map.set(h.type, [...(map.get(h.type) || []), h]))
    return [...map.entries()]
  }, [query])

  function go(item) {
    setOpen(false)
    setQuery('')
    navigate(item.to)
  }

  return (
    <div ref={ref} className="relative w-full max-w-md">
      <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
      <input
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        placeholder="Search athletes, teams, competitions..."
        aria-label="Global search"
        className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm placeholder-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
      />
      {open && query.trim() && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-96 overflow-y-auto rounded-xl border border-gray-200 bg-white p-2 shadow-lg">
          {groups.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-gray-500">No results for “{query}”</p>
          ) : (
            groups.map(([type, items]) => (
              <div key={type} className="mb-1">
                <p className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-gray-400">{type}</p>
                {items.map((item) => (
                  <button key={item.label} onClick={() => go(item)} className="flex w-full flex-col rounded-lg px-3 py-2 text-left hover:bg-gray-50">
                    <span className="text-sm font-medium text-gray-900">{item.label}</span>
                    <span className="text-xs text-gray-500">{item.sub}</span>
                  </button>
                ))}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default GlobalSearch
