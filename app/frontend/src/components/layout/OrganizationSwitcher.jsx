import { useEffect, useRef, useState } from 'react'
import { Building, ChevronDown } from 'lucide-react'
import { getOrganizations } from '../../api/organizations'
import { useOrganization } from '../../context/OrganizationContext'
import useClickOutside from '../../hooks/useClickOutside'

// Super Admin only: pick which organization's data to work in.
function OrganizationSwitcher() {
  const { organization, activeId, switchTo } = useOrganization()
  const [open, setOpen] = useState(false)
  const [orgs, setOrgs] = useState([])
  const ref = useRef(null)
  useClickOutside(ref, () => setOpen(false))

  useEffect(() => { if (open) getOrganizations().then(setOrgs).catch(() => setOrgs([])) }, [open])

  return (
    <div ref={ref} className="relative hidden sm:block">
      <button onClick={() => setOpen((o) => !o)} aria-haspopup="menu" aria-expanded={open}
        className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm ${activeId ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-amber-300 bg-amber-50 text-amber-800'}`}>
        <Building size={15} />
        <span className="max-w-[10rem] truncate">{activeId ? organization?.name || 'Organization' : 'Select organization'}</span>
        <ChevronDown size={14} />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
          <p className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">Work inside</p>
          {orgs.map((o) => (
            <button key={o.organizationId} role="menuitem" onClick={() => switchTo(o.organizationId)}
              className={`flex w-full items-center justify-between px-4 py-2 text-left text-sm hover:bg-gray-50 ${String(o.organizationId) === String(activeId) ? 'font-medium text-blue-700' : 'text-gray-700'}`}>
              <span className="truncate">{o.name}</span><span className="ml-2 text-xs text-gray-400">{o.plan}</span>
            </button>
          ))}
          {orgs.length === 0 && <p className="px-4 py-3 text-sm text-gray-500">No organizations yet.</p>}
          {activeId && <button role="menuitem" onClick={() => switchTo(null)} className="block w-full border-t border-gray-100 px-4 py-2 text-left text-sm text-gray-600 hover:bg-gray-50">Leave organization</button>}
        </div>
      )}
    </div>
  )
}

export default OrganizationSwitcher
