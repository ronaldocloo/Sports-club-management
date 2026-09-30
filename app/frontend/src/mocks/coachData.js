// Mock coaches until the backend exposes a usable /coaches API.
export const mockCoaches = [
  {
    coachId: 1, firstName: 'Kwabena', lastName: 'Mensah', sport: 'Football', specialization: 'Head coach · Tactics',
    experienceYears: 14, status: 'Active', email: 'k.mensah@ashesisports.example', phone: '+233 24 410 2231',
    teams: ['Falcons FC', 'Eagles FC'], athletes: 34, certifications: ['CAF B Licence', 'First Aid & CPR', 'Sports Psychology Cert.'],
    schedule: { Mon: ['08:00 Football Training'], Tue: ['15:00 Youth Session'], Wed: ['18:00 Match Preparation'], Thu: ['08:00 Football Training'], Fri: ['16:00 Inter-Club Final'] },
    today: [{ time: '08:00', title: 'Football Training', place: 'Main Stadium Pitch' }, { time: '10:00', title: 'Team Meeting', place: 'Conference Room' }, { time: '18:00', title: 'Match Preparation', place: 'Main Stadium Pitch' }],
  },
  {
    coachId: 2, firstName: 'Abena', lastName: 'Boateng', sport: 'Basketball', specialization: 'Head coach · Player development',
    experienceYears: 9, status: 'Active', email: 'a.boateng@ashesisports.example', phone: '+233 20 553 8814',
    teams: ['Accra Hoops', 'Ashesi Dunkers'], athletes: 22, certifications: ['FIBA Level 2', 'First Aid & CPR'],
    schedule: { Mon: ['16:00 Skills Session'], Tue: ['18:00 Scrimmage'], Wed: [], Thu: ['16:00 Skills Session'], Fri: ['17:00 Game Day'] },
    today: [{ time: '16:00', title: 'Skills Session', place: 'Indoor Basketball Court' }],
  },
  {
    coachId: 3, firstName: 'Yaw', lastName: 'Darko', sport: 'Athletics', specialization: 'Sprints & hurdles',
    experienceYears: 11, status: 'Active', email: 'y.darko@ashesisports.example', phone: '+233 27 190 4467',
    teams: ['Track Blazers'], athletes: 21, certifications: ['World Athletics Level 2', 'Strength & Conditioning'],
    schedule: { Mon: ['06:30 Track Session'], Tue: ['06:30 Track Session'], Wed: ['15:00 Gym Conditioning'], Thu: ['06:30 Track Session'], Fri: [] },
    today: [{ time: '06:30', title: 'Track Session', place: 'Main Stadium Pitch' }, { time: '15:00', title: 'Athletics Session', place: 'Fitness Centre' }],
  },
  {
    coachId: 4, firstName: 'Efua', lastName: 'Quaye', sport: 'Volleyball', specialization: 'Setters & defence',
    experienceYears: 7, status: 'Active', email: 'e.quaye@ashesisports.example', phone: '+233 55 902 1176',
    teams: ['Spikers VC'], athletes: 16, certifications: ['FIVB Level 1', 'First Aid & CPR'],
    schedule: { Mon: [], Tue: ['17:00 Training'], Wed: ['17:00 Training'], Thu: [], Fri: ['16:00 Friendly Match'] },
    today: [],
  },
  {
    coachId: 5, firstName: 'Nana', lastName: 'Owusu-Ansah', sport: 'Swimming', specialization: 'Freestyle & endurance',
    experienceYears: 12, status: 'On leave', email: 'n.owusu@ashesisports.example', phone: '+233 24 771 3092',
    teams: ['Aqua Stars'], athletes: 12, certifications: ['World Aquatics Level 2', 'Lifeguard Certified'],
    schedule: { Mon: [], Tue: [], Wed: [], Thu: [], Fri: [] }, today: [],
  },
  {
    coachId: 6, firstName: 'Kojo', lastName: 'Amponsah', sport: 'Football', specialization: 'Goalkeeping',
    experienceYears: 6, status: 'Active', email: 'k.amponsah@ashesisports.example', phone: '+233 50 318 6620',
    teams: ['Mensah United'], athletes: 14, certifications: ['CAF C Licence', 'Goalkeeping Specialist'],
    schedule: { Mon: ['16:00 GK Training'], Tue: [], Wed: ['16:00 GK Training'], Thu: [], Fri: ['16:00 Inter-Club Final'] },
    today: [{ time: '16:00', title: 'Goalkeeper Training', place: 'Main Stadium Pitch' }],
  },
  {
    coachId: 7, firstName: 'Akosua', lastName: 'Frimpong', sport: 'Badminton', specialization: 'Singles & doubles',
    experienceYears: 5, status: 'Active', email: 'a.frimpong@ashesisports.example', phone: '+233 26 445 7781',
    teams: ['Shuttle Kings'], athletes: 9, certifications: ['BWF Level 1'],
    schedule: { Mon: ['18:00 Training'], Tue: [], Wed: ['18:00 Training'], Thu: [], Fri: [] },
    today: [],
  },
  {
    coachId: 8, firstName: 'Emmanuel', lastName: 'Tetteh', sport: 'Football', specialization: 'Fitness & conditioning',
    experienceYears: 4, status: 'Inactive', email: 'e.tetteh@ashesisports.example', phone: '+233 24 209 5533',
    teams: [], athletes: 0, certifications: ['Strength & Conditioning'],
    schedule: { Mon: [], Tue: [], Wed: [], Thu: [], Fri: [] }, today: [],
  },
]
