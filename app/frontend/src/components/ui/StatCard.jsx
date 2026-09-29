import { Link } from 'react-router-dom'
import { ArrowRight, TrendingDown, TrendingUp } from 'lucide-react'
import Card from './Card'

function StatCard({ icon: Icon, label, value, trend, note, to, linkLabel, tone = 'blue' }) {
  const tones = { blue: 'bg-blue-50 text-blue-600', green: 'bg-emerald-50 text-emerald-600', amber: 'bg-amber-50 text-amber-600', violet: 'bg-violet-50 text-violet-600' }
  const up = trend > 0
  const flat = trend === 0 || trend === undefined

  return (
    <Card className="p-5 transition-shadow hover:shadow-md">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-500">{label}</p>
        {Icon && (
          <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${tones[tone]}`}>
            <Icon size={18} />
          </div>
        )}
      </div>
      <p className="mt-3 text-3xl font-bold tracking-tight text-gray-900">{value}</p>
      <div className="mt-2 flex items-center gap-2 text-xs">
        {!flat && (
          <span className={`inline-flex items-center gap-1 font-semibold ${up ? 'text-emerald-600' : 'text-red-600'}`}>
            {up ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {up ? '+' : ''}{trend}%
          </span>
        )}
        {note && <span className="text-gray-500">{note}</span>}
      </div>
      {to && (
        <Link to={to} className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700">
          {linkLabel} <ArrowRight size={14} />
        </Link>
      )}
    </Card>
  )
}

export default StatCard
