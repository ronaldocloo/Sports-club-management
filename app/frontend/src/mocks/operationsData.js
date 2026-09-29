// Demo data for the operations modules (memberships, payments, facilities, bookings, events).
import { mockAthletes } from './mockData'
import { facilities as demoFacilities } from './demoData'

function rng(seed) {
  let s = seed * 2654435761 % 4294967296
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
}

export const initialPlans = [
  { id: 1, name: 'Student', price: 100, period: 'month', perks: ['Training sessions', 'Student facility rates'] },
  { id: 2, name: 'Standard', price: 200, period: 'month', perks: ['Training sessions', 'Competition entry', 'Locker access'] },
  { id: 3, name: 'Premium', price: 350, period: 'month', perks: ['Everything in Standard', 'Priority facility booking', 'Personal coaching'] },
]

// ---------- Payments ----------
const methods = ['MTN MoMo', 'Vodafone Cash', 'Card', 'Cash', 'Bank transfer']
const types = [
  ['Membership', 0.6], ['Competition fee', 0.15], ['Facility booking', 0.17], ['Other', 0.08],
]
const amountByType = { Membership: [100, 200, 350], 'Competition fee': [150, 250, 400], 'Facility booking': [300, 600, 1000], Other: [50, 100, 150] }

export const initialPayments = (() => {
  const r = rng(99)
  const rows = []
  for (let i = 0; i < 440; i++) {
    const a = mockAthletes[Math.floor(r() * mockAthletes.length)]
    let x = r(); let type = 'Membership'
    for (const [t, w] of types) { if (x < w) { type = t; break } x -= w }
    const amounts = amountByType[type]
    const daysAgo = Math.floor(r() * 60)
    const d = new Date('2026-09-29'); d.setDate(d.getDate() - daysAgo)
    const y = r()
    rows.push({
      id: 1100 - i,
      date: d.toISOString().slice(0, 10),
      member: `${a.firstName} ${a.lastName}`,
      type,
      amount: amounts[Math.floor(r() * amounts.length)],
      method: methods[Math.floor(r() * methods.length)],
      status: y < 0.8 ? 'Paid' : y < 0.89 ? 'Pending' : y < 0.94 ? 'Failed' : 'Refunded',
    })
  }
  return rows.sort((p, q) => q.date.localeCompare(p.date) || q.id - p.id)
})()

// ---------- Facilities ----------
export const initialFacilities = demoFacilities.map((f) => ({ ...f }))

// ---------- Bookings (week of Mon 28 Sep 2026) ----------
export const weekDays = [
  { key: 'Mon', date: '2026-09-28' }, { key: 'Tue', date: '2026-09-29' }, { key: 'Wed', date: '2026-09-30' },
  { key: 'Thu', date: '2026-10-01' }, { key: 'Fri', date: '2026-10-02' },
]
export const timeSlots = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00']

const purposes = ['Football training', 'Team meeting', 'Match preparation', 'Fitness session', 'Coaches workshop', 'Skills clinic', 'Friendly match']
const bookers = ['Coach Mensah', 'Coach Boateng', 'Coach Darko', 'Coach Quaye', 'Front Desk', 'Student Affairs']

export const initialBookings = (() => {
  const r = rng(7)
  const list = []
  let id = 1
  initialFacilities.forEach((f) => {
    weekDays.forEach((d) => {
      timeSlots.forEach((t) => {
        if (f.status === 'Maintenance') return
        const x = r()
        // Higher-utilisation facilities are booked more often; Wednesday evening is busiest.
        const heat = (f.utilization / 100) * (d.key === 'Wed' && t >= '16:00' ? 1.35 : 0.85)
        if (x < heat * 0.55) {
          const pending = r() < 0.12
          list.push({
            id: id++, facilityId: f.id, date: d.date, time: t,
            purpose: purposes[Math.floor(r() * purposes.length)],
            bookedBy: bookers[Math.floor(r() * bookers.length)],
            status: pending ? 'Pending' : 'Confirmed',
          })
        }
      })
    })
  })
  return list
})()

// ---------- Events ----------
export const initialEvents = [
  { id: 1, title: 'Football Training – Senior Squad', type: 'Training', date: '2026-10-01', time: '08:00', location: 'Main Stadium Pitch', organizer: 'Coach Mensah', participants: 34, status: 'Scheduled' },
  { id: 2, title: 'Athletics Session', type: 'Training', date: '2026-10-01', time: '15:00', location: 'Fitness Centre', organizer: 'Coach Darko', participants: 21, status: 'Scheduled' },
  { id: 3, title: 'Inter-Club Championship Final', type: 'Match', date: '2026-10-03', time: '16:00', location: 'Main Stadium Pitch', organizer: 'Ashesi Sports Club', participants: 500, status: 'Scheduled' },
  { id: 4, title: 'Inter-Club Championship Third-place Match', type: 'Match', date: '2026-10-03', time: '13:00', location: 'Main Stadium Pitch', organizer: 'Ashesi Sports Club', participants: 300, status: 'Scheduled' },
  { id: 5, title: 'Coaches Workshop: Modern Tactics', type: 'Workshop', date: '2026-10-04', time: '10:00', location: 'Conference Room', organizer: 'Coach Mensah', participants: 8, status: 'Scheduled' },
  { id: 6, title: 'Weekly Team Meeting', type: 'Team meeting', date: '2026-10-05', time: '17:30', location: 'Conference Room', organizer: 'Club Admin', participants: 12, status: 'Scheduled' },
  { id: 7, title: 'Basketball Skills Clinic', type: 'Training', date: '2026-10-07', time: '16:00', location: 'Indoor Basketball Court', organizer: 'Coach Boateng', participants: 24, status: 'Scheduled' },
  { id: 8, title: 'Annual Awards Night', type: 'Awards', date: '2026-10-11', time: '18:30', location: 'Main Auditorium', organizer: 'Ashesi Sports Club', participants: 200, status: 'Scheduled' },
  { id: 9, title: 'New Member Orientation', type: 'Club event', date: '2026-10-12', time: '11:00', location: 'Conference Room', organizer: 'Front Desk', participants: 40, status: 'Scheduled' },
  { id: 10, title: 'Volleyball Open', type: 'Competition', date: '2026-10-18', time: '10:00', location: 'Indoor Basketball Court', organizer: 'Coach Quaye', participants: 64, status: 'Scheduled' },
  { id: 11, title: 'Swimming Gala Trials', type: 'Competition', date: '2026-10-24', time: '09:00', location: 'Olympic Pool', organizer: 'Coach Owusu-Ansah', participants: 40, status: 'Scheduled' },
  { id: 12, title: 'Sports Nutrition Workshop', type: 'Workshop', date: '2026-10-25', time: '14:00', location: 'Conference Room', organizer: 'Club Admin', participants: 50, status: 'Scheduled' },
  { id: 13, title: 'Kwame Cup Semi-finals', type: 'Match', date: '2026-11-14', time: '14:00', location: 'Main Stadium Pitch', organizer: 'Ashesi Sports Club', participants: 400, status: 'Scheduled' },
  { id: 14, title: 'Kwame Cup Final', type: 'Match', date: '2026-11-21', time: '16:00', location: 'Main Stadium Pitch', organizer: 'Ashesi Sports Club', participants: 500, status: 'Scheduled' },
  { id: 15, title: 'Inter-University Basketball Final', type: 'Match', date: '2026-09-12', time: '16:00', location: 'Indoor Basketball Court', organizer: 'GUSA', participants: 150, status: 'Completed' },
]
