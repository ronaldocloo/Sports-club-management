// Realistic demo data for "Ashesi Sports Club". Used by UI that has no backend API yet.

export const organization = {
  id: 1,
  name: 'Ashesi Sports Club',
  location: 'Berekuso, Eastern Region, Ghana',
  plan: 'Professional',
  currency: 'GH₵',
}

export const currentUser = {
  name: 'Ronald Ocloo',
  role: 'Club Admin',
  email: 'admin@ashesisports.example',
}

export const sports = [
  { id: 1, name: 'Football', athletes: 46, teams: 4, color: '#2563eb' },
  { id: 2, name: 'Basketball', athletes: 24, teams: 3, color: '#f59e0b' },
  { id: 3, name: 'Athletics', athletes: 21, teams: 2, color: '#10b981' },
  { id: 4, name: 'Volleyball', athletes: 16, teams: 1, color: '#8b5cf6' },
  { id: 5, name: 'Swimming', athletes: 12, teams: 1, color: '#06b6d4' },
  { id: 6, name: 'Badminton', athletes: 9, teams: 1, color: '#ef4444' },
]

export const kpis = [
  { key: 'athletes', label: 'Total Athletes', value: 128, trend: 12.4, note: 'this month', to: '/athletes', linkLabel: 'View athletes' },
  { key: 'teams', label: 'Active Teams', value: 12, trend: 8.3, note: '2 new this season', to: '/teams', linkLabel: 'View teams' },
  { key: 'coaches', label: 'Coaches', value: 8, trend: 0, note: 'no change', to: '/coaches', linkLabel: 'View coaches' },
  { key: 'memberships', label: 'Active Memberships', value: 104, trend: 5.1, note: '14 expiring in 30 days', to: '/memberships', linkLabel: 'Manage memberships' },
  { key: 'competitions', label: 'Upcoming Competitions', value: 5, trend: 25, note: 'next: Fri 3 Oct', to: '/competitions', linkLabel: 'View competitions' },
  { key: 'outstanding', label: 'Outstanding Payments', value: 7200, money: true, trend: -6.2, note: '18 members', to: '/payments', linkLabel: 'View payments' },
  { key: 'utilization', label: 'Facility Utilization', value: 74, suffix: '%', trend: 4.7, note: 'Wed evening busiest', to: '/facilities', linkLabel: 'View facilities' },
  { key: 'events', label: 'Upcoming Events', value: 14, trend: 16.7, note: 'next 30 days', to: '/events', linkLabel: 'View events' },
]

export const athleteGrowth = [
  { month: 'Jan', athletes: 20 }, { month: 'Feb', athletes: 35 }, { month: 'Mar', athletes: 42 },
  { month: 'Apr', athletes: 58 }, { month: 'May', athletes: 70 }, { month: 'Jun', athletes: 90 },
  { month: 'Jul', athletes: 108 }, { month: 'Aug', athletes: 128 },
]

export const membershipBreakdown = [
  { name: 'Active', value: 104, color: '#10b981' },
  { name: 'Expiring soon', value: 14, color: '#f59e0b' },
  { name: 'Expired', value: 6, color: '#ef4444' },
  { name: 'Pending', value: 4, color: '#94a3b8' },
]

export const revenueByMonth = [
  { month: 'Apr', memberships: 20000, competitions: 5500, facilities: 6500, other: 1400 },
  { month: 'May', memberships: 21800, competitions: 6000, facilities: 7000, other: 1300 },
  { month: 'Jun', memberships: 24000, competitions: 7000, facilities: 8000, other: 1500 },
  { month: 'Jul', memberships: 26000, competitions: 7800, facilities: 8600, other: 1800 },
  { month: 'Aug', memberships: 27500, competitions: 8500, facilities: 9000, other: 1900 },
  { month: 'Sep', memberships: 26300, competitions: 8100, facilities: 12300, other: 3100 },
]

export const facilities = [
  { id: 1, name: 'Main Stadium Pitch', type: 'Football pitch', capacity: 500, status: 'Available', utilization: 82 },
  { id: 2, name: 'Indoor Basketball Court', type: 'Basketball court', capacity: 150, status: 'Available', utilization: 91 },
  { id: 3, name: 'Olympic Pool', type: 'Swimming pool', capacity: 60, status: 'Maintenance', utilization: 40 },
  { id: 4, name: 'Fitness Centre', type: 'Gym', capacity: 45, status: 'Available', utilization: 68 },
  { id: 5, name: 'Tennis Court A', type: 'Tennis court', capacity: 20, status: 'Available', utilization: 55 },
  { id: 6, name: 'Conference Room', type: 'Meeting room', capacity: 30, status: 'Available', utilization: 38 },
]

export const upcomingEvents = [
  { id: 1, title: 'Inter-Club Championship Final', type: 'Match', date: '2026-10-03', time: '16:00', location: 'Main Stadium Pitch' },
  { id: 2, title: 'Football Training – Senior Squad', type: 'Training', date: '2026-10-01', time: '08:00', location: 'Main Stadium Pitch' },
  { id: 3, title: 'Coaches Workshop', type: 'Workshop', date: '2026-10-04', time: '10:00', location: 'Conference Room' },
  { id: 4, title: 'Annual Awards Night', type: 'Awards', date: '2026-10-11', time: '18:30', location: 'Main Auditorium' },
]

export const recentActivity = [
  { id: 1, text: 'Ronald created athlete Kwame Mensah', time: 'Today, 10:42 AM', kind: 'athlete' },
  { id: 2, text: 'Admin updated Falcons FC', time: 'Today, 10:38 AM', kind: 'team' },
  { id: 3, text: 'Payment #1024 marked as paid', time: 'Today, 09:51 AM', kind: 'payment' },
  { id: 4, text: 'Facility booking approved: Indoor Basketball Court', time: 'Yesterday, 4:15 PM', kind: 'facility' },
  { id: 5, text: 'Ama Owusu registered for Inter-Club Championship', time: 'Yesterday, 2:03 PM', kind: 'competition' },
]

export const notifications = [
  { id: 1, kind: 'membership', text: 'Membership expires in 7 days for Kofi Asante.', time: '10 min ago', unread: true },
  { id: 2, kind: 'competition', text: 'Inter-Club Championship Final is scheduled for Friday.', time: '1 hour ago', unread: true },
  { id: 3, kind: 'athlete', text: 'New athlete registered: Kwame Mensah.', time: '2 hours ago', unread: true },
  { id: 4, kind: 'payment', text: 'Payment received: GH₵350 from Efua Boateng.', time: 'Yesterday', unread: false },
  { id: 5, kind: 'facility', text: 'Facility booking approved: Indoor Basketball Court.', time: 'Yesterday', unread: false },
  { id: 6, kind: 'facility', text: 'Olympic Pool is under maintenance until further notice.', time: 'Yesterday', unread: false },
  { id: 7, kind: 'payment', text: 'Payment failed for Nii Lamptey (MTN MoMo).', time: '2 days ago', unread: false },
  { id: 8, kind: 'event', text: 'Coaches Workshop starts Sunday at 10:00.', time: '2 days ago', unread: false },
  { id: 9, kind: 'membership', text: '18 memberships expire within 30 days.', time: '3 days ago', unread: false },
  { id: 10, kind: 'competition', text: 'Registration for Kwame Cup closes on 25 October.', time: '4 days ago', unread: false },
]

// Items the global search looks through (in addition to live API data).
export const searchIndex = [
  { type: 'Athletes', label: 'Kwame Mensah', sub: 'Football · Forward', to: '/athletes' },
  { type: 'Athletes', label: 'Ama Owusu', sub: 'Athletics · Sprinter', to: '/athletes' },
  { type: 'Athletes', label: 'Efua Boateng', sub: 'Basketball · Guard', to: '/athletes' },
  { type: 'Athletes', label: 'Kofi Asante', sub: 'Volleyball · Setter', to: '/athletes' },
  { type: 'Teams', label: 'Falcons FC', sub: 'Football', to: '/teams' },
  { type: 'Teams', label: 'Mensah United', sub: 'Football', to: '/teams' },
  { type: 'Teams', label: 'Eagles FC', sub: 'Football', to: '/teams' },
  { type: 'Teams', label: 'Accra Hoops', sub: 'Basketball', to: '/teams' },
  { type: 'Competitions', label: 'Inter-Club Championship', sub: '3 Oct · Main Stadium', to: '/competitions' },
  { type: 'Competitions', label: 'Kwame Cup', sub: 'Nov · Main Stadium', to: '/competitions' },
  { type: 'Coaches', label: 'Coach Mensah', sub: 'Football · Head coach', to: '/coaches' },
  { type: 'Facilities', label: 'Main Stadium Pitch', sub: 'Football pitch', to: '/facilities' },
]
