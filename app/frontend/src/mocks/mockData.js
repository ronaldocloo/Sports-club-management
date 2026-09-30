// Demo data for Ashesi Sports Club. Used when VITE_DEMO_MODE=true (see api/client.js).
// Field names match what the frontend components expect.

export const mockCoachNames = {
  1: 'Kwabena Mensah', 2: 'Kojo Amponsah', 3: 'Abena Boateng', 4: 'Kwabena Mensah',
  5: 'Yaw Darko', 6: 'Efua Quaye', 7: 'Nana Owusu-Ansah',
  8: 'Kojo Amponsah', 9: 'Abena Boateng', 10: 'Abena Boateng', 11: 'Yaw Darko', 12: 'Akosua Frimpong',
}

const teamRows = [
  [1, 'Falcons FC', 'Football'],
  [2, 'Mensah United', 'Football'],
  [3, 'Accra Hoops', 'Basketball'],
  [4, 'Eagles FC', 'Football'],
  [5, 'Track Blazers', 'Athletics'],
  [6, 'Spikers VC', 'Volleyball'],
  [7, 'Aqua Stars', 'Swimming'],
  [8, 'Tigers FC', 'Football'],
  [9, 'Ashesi Dunkers', 'Basketball'],
  [10, 'Court Kings', 'Basketball'],
  [11, 'Sprint Squad', 'Athletics'],
  [12, 'Shuttle Kings', 'Badminton'],
]

// [id, first, last, dob, position, sport, teamId, gender, heightCm, weightKg]
const athleteRows = [
  [1, 'Kwame', 'Mensah', '2003-02-14', 'Forward', 'Football', 1, 'Male', 181, 74],
  [2, 'Ama', 'Owusu', '2002-08-30', 'Sprinter', 'Athletics', 5, 'Female', 168, 58],
  [3, 'Efua', 'Boateng', '2003-05-09', 'Guard', 'Basketball', 3, 'Female', 175, 66],
  [4, 'Kofi', 'Asante', '2001-11-21', 'Setter', 'Volleyball', 6, 'Male', 186, 78],
  [5, 'Yaw', 'Adjei', '2002-01-17', 'Goalkeeper', 'Football', 2, 'Male', 189, 82],
  [6, 'Akua', 'Sarpong', '2003-07-03', 'Midfielder', 'Football', 4, 'Female', 170, 61],
  [7, 'Nii', 'Lamptey', '2001-03-25', 'Defender', 'Football', 1, 'Male', 183, 77],
  [8, 'Adwoa', 'Nkrumah', '2004-09-12', 'Freestyle', 'Swimming', 7, 'Female', 172, 60],
  [9, 'Selasi', 'Agbeko', '2002-12-05', 'Point Guard', 'Basketball', 3, 'Male', 180, 72],
  [10, 'Fiifi', 'Quansah', '2003-04-18', 'Winger', 'Football', 4, 'Male', 177, 70],
  [11, 'Maame', 'Serwaa', '2002-06-27', 'Hurdler', 'Athletics', 5, 'Female', 169, 57],
  [12, 'Kwesi', 'Bonsu', '2001-10-08', 'Centre Back', 'Football', 2, 'Male', 187, 80],
]

// The 12 athletes above are hand-written; the rest are generated so the club totals 128
// (46 Football, 24 Basketball, 21 Athletics, 16 Volleyball, 12 Swimming, 9 Badminton).
const maleNames = ['Kwabena', 'Kofi', 'Kwame', 'Yaw', 'Kojo', 'Kwesi', 'Nii', 'Fiifi', 'Nana', 'Elikem', 'Mawuli', 'Papa', 'Kobby', 'Ebo', 'Daniel', 'Samuel', 'Emmanuel', 'Prince', 'Isaac', 'Joel']
const femaleNames = ['Yaa', 'Abena', 'Ama', 'Efua', 'Akua', 'Adwoa', 'Esi', 'Afia', 'Maame', 'Naa', 'Dede', 'Araba', 'Sika', 'Mawuena', 'Grace', 'Belinda', 'Priscilla', 'Josephine', 'Linda', 'Vivian']
const lastNames = ['Mensah', 'Owusu', 'Boateng', 'Asante', 'Adjei', 'Sarpong', 'Lamptey', 'Nkrumah', 'Agbeko', 'Quansah', 'Bonsu', 'Darko', 'Quaye', 'Amponsah', 'Frimpong', 'Tetteh', 'Acheampong', 'Ofori', 'Appiah', 'Danso', 'Kyei', 'Addo', 'Ankrah', 'Tagoe', 'Hammond', 'Gyamfi', 'Baidoo', 'Osei', 'Yeboah', 'Amoako', 'Badu', 'Kumi', 'Anim', 'Ampofo']

const generatedPlan = {
  Football: { count: 40, teams: [1, 2, 4, 8], positions: ['Forward', 'Midfielder', 'Defender', 'Winger', 'Goalkeeper', 'Centre Back'] },
  Basketball: { count: 22, teams: [3, 9, 10], positions: ['Guard', 'Point Guard', 'Forward', 'Centre'] },
  Athletics: { count: 19, teams: [5, 11], positions: ['Sprinter', 'Hurdler', 'Distance runner', 'Jumper', 'Thrower'] },
  Volleyball: { count: 15, teams: [6], positions: ['Setter', 'Outside hitter', 'Libero', 'Middle blocker'] },
  Swimming: { count: 11, teams: [7], positions: ['Freestyle', 'Backstroke', 'Butterfly', 'Breaststroke'] },
  Badminton: { count: 9, teams: [12], positions: ['Singles', 'Doubles'] },
}

function generateAthletes(startId) {
  const used = new Set(athleteRows.map((r) => `${r[1]} ${r[2]}`))
  const out = []
  let id = startId
  let i = 0
  Object.entries(generatedPlan).forEach(([sport, plan]) => {
    for (let k = 0; k < plan.count; k++, i++) {
      const female = i % 2 === 1
      const pool = female ? femaleNames : maleNames
      let first = pool[(i * 3 + k) % pool.length]
      let last = lastNames[(i * 7 + Math.floor(i / pool.length)) % lastNames.length]
      let bump = 0
      while (used.has(`${first} ${last}`)) { bump++; last = lastNames[(i * 7 + bump) % lastNames.length] }
      used.add(`${first} ${last}`)
      const year = 2000 + (i * 5) % 7
      const month = String(1 + (i * 7) % 12).padStart(2, '0')
      const day = String(1 + (i * 11) % 28).padStart(2, '0')
      out.push([
        id++, first, last, `${year}-${month}-${day}`,
        plan.positions[k % plan.positions.length], sport, plan.teams[k % plan.teams.length],
        female ? 'Female' : 'Male', (female ? 160 : 172) + ((i * 13) % 20), (female ? 52 : 66) + ((i * 7) % 22),
      ])
    }
  })
  return out
}

athleteRows.push(...generateAthletes(13))

export const mockAthletes = athleteRows.map(([athleteId, firstName, lastName, dateOfBirth, position, sport, teamId, gender, heightCm, weightKg]) => ({
  athleteId, firstName, lastName, dateOfBirth, position, sport, teamId, gender, heightCm, weightKg,
  email: `${firstName}.${lastName}@ashesisports.example`.toLowerCase(),
}))

export const mockTeams = teamRows.map(([teamId, teamName, sport]) => ({
  teamId,
  teamName,
  sport,
  coachName: mockCoachNames[teamId],
  roster: mockAthletes.filter((a) => a.teamId === teamId),
  competitions: [],
}))

export const mockCompetitions = [
  { competitionId: 1, competitionName: 'Inter-Club Championship', date: '2026-10-03', location: 'Main Stadium Pitch', status: 'Ongoing', sport: 'Football' },
  { competitionId: 2, competitionName: 'Kwame Cup', date: '2026-11-14', location: 'Main Stadium Pitch', status: 'Upcoming', sport: 'Football' },
  { competitionId: 3, competitionName: 'Inter-University Basketball Games', date: '2026-09-12', location: 'Indoor Basketball Court', status: 'Completed', sport: 'Basketball' },
  { competitionId: 4, competitionName: 'Volleyball Open', date: '2026-10-18', location: 'Indoor Basketball Court', status: 'Upcoming', sport: 'Volleyball' },
  { competitionId: 5, competitionName: 'Freshers Football Sevens', date: '2026-08-22', location: 'Main Stadium Pitch', status: 'Completed', sport: 'Football' },
]
