// Standings from completed fixtures in a round-robin/group stage (3 pts win, 1 draw).
export function computeStandings(teams, fixtures) {
  const table = Object.fromEntries(
    teams.map((t) => [t, { team: t, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0 }]),
  )
  fixtures
    .filter((f) => f.status === 'Completed' && /group|round/i.test(f.round))
    .forEach((f) => {
      const h = table[f.home]
      const a = table[f.away]
      if (!h || !a) return
      h.played++; a.played++
      h.gf += f.homeScore; h.ga += f.awayScore
      a.gf += f.awayScore; a.ga += f.homeScore
      if (f.homeScore > f.awayScore) { h.won++; a.lost++; h.points += 3 }
      else if (f.homeScore < f.awayScore) { a.won++; h.lost++; a.points += 3 }
      else { h.drawn++; a.drawn++; h.points++; a.points++ }
    })
  return Object.values(table).sort(
    (x, y) => y.points - x.points || (y.gf - y.ga) - (x.gf - x.ga) || y.gf - x.gf,
  )
}

export const statusTone = { Ongoing: 'green', Upcoming: 'blue', Completed: 'gray' }
