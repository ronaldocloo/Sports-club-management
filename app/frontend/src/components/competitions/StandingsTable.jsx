import { Card } from '../ui'

function StandingsTable({ rows }) {
  const head = 'px-4 py-3 text-center font-medium'
  return (
    <Card className="overflow-x-auto">
      <table className="w-full min-w-[520px] text-sm">
        <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
          <tr>
            <th className="px-4 py-3 text-left font-medium">#</th>
            <th className="px-4 py-3 text-left font-medium">Team</th>
            {['P', 'W', 'D', 'L', 'GF', 'GA', 'GD', 'Pts'].map((h) => <th key={h} className={head}>{h}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((r, i) => (
            <tr key={r.team} className={i < 2 ? 'bg-blue-50/40' : ''}>
              <td className="px-4 py-3 text-gray-500">{i + 1}</td>
              <td className="px-4 py-3 font-medium text-gray-900">{r.team}</td>
              <td className="px-4 py-3 text-center">{r.played}</td>
              <td className="px-4 py-3 text-center">{r.won}</td>
              <td className="px-4 py-3 text-center">{r.drawn}</td>
              <td className="px-4 py-3 text-center">{r.lost}</td>
              <td className="px-4 py-3 text-center">{r.gf}</td>
              <td className="px-4 py-3 text-center">{r.ga}</td>
              <td className="px-4 py-3 text-center">{r.gf - r.ga > 0 ? '+' : ''}{r.gf - r.ga}</td>
              <td className="px-4 py-3 text-center font-bold text-gray-900">{r.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  )
}

export default StandingsTable
