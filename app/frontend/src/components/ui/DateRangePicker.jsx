import { useState } from 'react'
import { rangePresets, presetRange } from '../../utils/ranges'

// A preset dropdown plus optional custom dates. value: { preset, from, to }.
function DateRangePicker({ value, onChange }) {
  const [custom, setCustom] = useState(value.preset === 'custom')
  const field = 'rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none'

  function choose(key) {
    if (key === 'custom') { setCustom(true); onChange({ preset: 'custom', from: value.from, to: value.to }); return }
    setCustom(false)
    onChange({ preset: key, ...presetRange(key) })
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select aria-label="Date range" value={custom ? 'custom' : value.preset} onChange={(e) => choose(e.target.value)} className={field}>
        {rangePresets.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
        <option value="custom">Custom range…</option>
      </select>
      {custom && (
        <>
          <input type="date" aria-label="From date" value={value.from} max={value.to} onChange={(e) => onChange({ preset: 'custom', from: e.target.value, to: value.to })} className={field} />
          <span className="text-sm text-gray-400">to</span>
          <input type="date" aria-label="To date" value={value.to} min={value.from} onChange={(e) => onChange({ preset: 'custom', from: value.from, to: e.target.value })} className={field} />
        </>
      )}
    </div>
  )
}

export default DateRangePicker
