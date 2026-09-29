import { TODAY_ISO } from './today'

const iso = (d) => d.toISOString().slice(0, 10)
const shift = (days) => { const d = new Date(TODAY_ISO); d.setUTCDate(d.getUTCDate() + days); return iso(d) }

// Date-range presets shared by Analytics and Reports.
export const rangePresets = [
  { key: '30d', label: 'Last 30 days', range: () => ({ from: shift(-29), to: TODAY_ISO }) },
  { key: '90d', label: 'Last 90 days', range: () => ({ from: shift(-89), to: TODAY_ISO }) },
  { key: 'ytd', label: 'This year', range: () => ({ from: `${TODAY_ISO.slice(0, 4)}-01-01`, to: TODAY_ISO }) },
  { key: '12m', label: 'Last 12 months', range: () => ({ from: shift(-364), to: TODAY_ISO }) },
  { key: '2y', label: 'Last 2 years', range: () => ({ from: shift(-729), to: TODAY_ISO }) },
]

export function presetRange(key) {
  return (rangePresets.find((p) => p.key === key) || rangePresets[0]).range()
}

export function monthLabel(ym) {
  const [y, m] = String(ym).split('-')
  return new Date(Number(y), Number(m) - 1, 1).toLocaleString('en-GB', { month: 'short', year: '2-digit' })
}
