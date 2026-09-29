// Fixtures and results per competition. The backend has no match/fixture API yet.
// Fixture: { id, round, home, away, date, time, venue, officials, homeScore, awayScore, status }

const venue = 'Main Stadium Pitch'
const hall = 'Indoor Basketball Court'
const ref = 'Referee: E. Addo'

function fx(id, round, home, away, date, time, v, homeScore = null, awayScore = null) {
  const done = homeScore !== null
  return { id, round, home, away, date, time, venue: v, officials: ref, homeScore, awayScore, status: done ? 'Completed' : 'Scheduled' }
}

export const competitionDetails = {
  1: {
    level: 'Inter-club', organizer: 'Ashesi Sports Club', registrationDeadline: '2026-09-01',
    description: 'The club’s flagship football championship. A round-robin group stage decides the finalists.',
    teams: ['Falcons FC', 'Mensah United', 'Eagles FC', 'Tigers FC'],
    fixtures: [
      fx(101, 'Group Stage', 'Falcons FC', 'Eagles FC', '2026-09-15', '16:00', venue, 2, 1),
      fx(102, 'Group Stage', 'Tigers FC', 'Mensah United', '2026-09-15', '18:00', venue, 0, 0),
      fx(103, 'Group Stage', 'Falcons FC', 'Mensah United', '2026-09-22', '16:00', venue, 3, 1),
      fx(104, 'Group Stage', 'Eagles FC', 'Tigers FC', '2026-09-22', '18:00', venue, 2, 2),
      fx(105, 'Group Stage', 'Mensah United', 'Eagles FC', '2026-09-27', '16:00', venue, 1, 0),
      fx(106, 'Group Stage', 'Tigers FC', 'Falcons FC', '2026-09-27', '18:00', venue, 1, 2),
      fx(107, 'Third-place match', 'Eagles FC', 'Tigers FC', '2026-10-03', '13:00', venue),
      fx(108, 'Final', 'Falcons FC', 'Mensah United', '2026-10-03', '16:00', venue),
    ],
  },
  2: {
    level: 'Inter-club', organizer: 'Ashesi Sports Club', registrationDeadline: '2026-10-25',
    description: 'A knockout cup open to all football teams in the club.',
    teams: ['Falcons FC', 'Eagles FC', 'Mensah United', 'Tigers FC'],
    fixtures: [
      fx(201, 'Semi-final', 'Falcons FC', 'Tigers FC', '2026-11-14', '14:00', venue),
      fx(202, 'Semi-final', 'Mensah United', 'Eagles FC', '2026-11-14', '16:30', venue),
      fx(203, 'Final', 'TBD', 'TBD', '2026-11-21', '16:00', venue),
    ],
  },
  3: {
    level: 'Inter-university', organizer: 'Ghana University Sports Association', registrationDeadline: '2026-08-20',
    description: 'A four-team basketball round-robin between universities.',
    teams: ['Accra Hoops', 'Legon Wildcats', 'KNUST Kings', 'Cape Coast Sharks'],
    fixtures: [
      fx(301, 'Round 1', 'Accra Hoops', 'Legon Wildcats', '2026-09-10', '15:00', hall, 78, 71),
      fx(302, 'Round 1', 'KNUST Kings', 'Cape Coast Sharks', '2026-09-10', '17:00', hall, 66, 69),
      fx(303, 'Round 2', 'Accra Hoops', 'KNUST Kings', '2026-09-11', '15:00', hall, 82, 80),
      fx(304, 'Round 2', 'Legon Wildcats', 'Cape Coast Sharks', '2026-09-11', '17:00', hall, 74, 60),
      fx(305, 'Final', 'Accra Hoops', 'Cape Coast Sharks', '2026-09-12', '16:00', hall, 85, 77),
    ],
  },
  4: {
    level: 'Open', organizer: 'Ashesi Sports Club', registrationDeadline: '2026-10-10',
    description: 'Open volleyball tournament. Scores show sets won.',
    teams: ['Spikers VC', 'Legon Spikers', 'Volta Smashers', 'Ho Titans'],
    fixtures: [
      fx(401, 'Semi-final', 'Spikers VC', 'Ho Titans', '2026-10-18', '10:00', hall),
      fx(402, 'Semi-final', 'Legon Spikers', 'Volta Smashers', '2026-10-18', '12:00', hall),
      fx(403, 'Final', 'TBD', 'TBD', '2026-10-18', '15:00', hall),
    ],
  },
  5: {
    level: 'Freshers', organizer: 'Student Affairs', registrationDeadline: '2026-08-10',
    description: 'A seven-a-side football tournament for first-year students.',
    teams: ['Falcons FC', 'Eagles FC', 'Mensah United', 'Tigers FC'],
    fixtures: [
      fx(501, 'Semi-final', 'Falcons FC', 'Mensah United', '2026-08-22', '10:00', venue, 1, 0),
      fx(502, 'Semi-final', 'Eagles FC', 'Tigers FC', '2026-08-22', '11:30', venue, 3, 1),
      fx(503, 'Final', 'Falcons FC', 'Eagles FC', '2026-08-22', '15:00', venue, 2, 3),
    ],
  },
}
