import { CalendarDays, MapPin } from 'lucide-react'
import { Badge, Button, Card } from '../ui'
import { formatDate } from '../../utils/format'

function FixtureCard({ fixture, onRecord, featured = false }) {
  const done = fixture.status === 'Completed'
  const homeWon = done && fixture.homeScore > fixture.awayScore
  const awayWon = done && fixture.awayScore > fixture.homeScore
  const team = (name, won) => (
    <span className={`text-base ${won ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>{name}</span>
  )

  return (
    <Card className={`p-5 ${featured ? 'border-blue-200 bg-gradient-to-br from-blue-50 to-white' : ''}`}>
      <div className="flex items-center justify-between">
        <Badge tone={featured ? 'blue' : 'gray'}>{fixture.round}</Badge>
        {done ? <Badge tone="green">Full time</Badge> : <Badge tone="amber">Scheduled</Badge>}
      </div>

      <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-center sm:gap-6">
        <div className="text-right">{team(fixture.home, homeWon)}</div>
        {done ? (
          <div className="rounded-lg bg-gray-900 px-4 py-2 text-xl font-bold tabular-nums text-white">
            {fixture.homeScore} – {fixture.awayScore}
          </div>
        ) : (
          <div className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-gray-400 ring-1 ring-gray-200">VS</div>
        )}
        <div className="text-left">{team(fixture.away, awayWon)}</div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-xs text-gray-500">
        <span className="inline-flex items-center gap-1.5"><CalendarDays size={13} /> {formatDate(fixture.date, { weekday: 'short', day: 'numeric', month: 'short' })} · {fixture.time}</span>
        <span className="inline-flex items-center gap-1.5"><MapPin size={13} /> {fixture.venue}</span>
      </div>

      {!done && onRecord && fixture.home !== 'TBD' && (
        <div className="mt-4 flex justify-center">
          <Button variant="secondary" size="sm" onClick={() => onRecord(fixture)}>Record result</Button>
        </div>
      )}
    </Card>
  )
}

export default FixtureCard
