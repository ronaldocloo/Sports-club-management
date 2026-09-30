import { useRef, useState } from 'react'
import { MoreVertical } from 'lucide-react'
import useClickOutside from '../../hooks/useClickOutside'

// items: [{ label, onClick, danger?, hidden? }]
function RowMenu({ items, label = 'Row actions' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useClickOutside(ref, () => setOpen(false))
  const visible = items.filter((i) => !i.hidden)
  if (visible.length === 0) return null
  return (
    <div ref={ref} className="relative inline-block text-left">
      <button aria-label={label} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)} className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100"><MoreVertical size={16} /></button>
      {open && (
        <div role="menu" className="absolute right-0 top-full z-30 mt-1 w-44 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
          {visible.map((i) => (
            <button key={i.label} role="menuitem" onClick={() => { setOpen(false); i.onClick() }}
              className={`block w-full px-4 py-2 text-left text-sm hover:bg-gray-50 ${i.danger ? 'text-red-600' : 'text-gray-700'}`}>{i.label}</button>
          ))}
        </div>
      )}
    </div>
  )
}

export default RowMenu
