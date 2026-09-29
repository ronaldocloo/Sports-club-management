import {
  LayoutDashboard, Users, UserCog, Shield, Trophy, Layers, CreditCard, Wallet,
  Building2, CalendarCheck, UserCircle, ClipboardCheck, Landmark, CalendarDays, BarChart3, FileText, UserRound, Bell, Settings,
} from 'lucide-react'

export const navGroups = [
  { label: 'Main', items: [{ name: 'Dashboard', path: '/', icon: LayoutDashboard }, { name: 'My Profile', path: '/me', icon: UserCircle }] },
  {
    label: 'Management',
    items: [
      { name: 'Athletes', path: '/athletes', icon: Users },
      { name: 'Coaches', path: '/coaches', icon: UserCog },
      { name: 'Teams', path: '/teams', icon: Shield },
      { name: 'Attendance', path: '/attendance', icon: ClipboardCheck },
      { name: 'Competitions', path: '/competitions', icon: Trophy },
      { name: 'Sports', path: '/sports', icon: Layers },
    ],
  },
  {
    label: 'Operations',
    items: [
      { name: 'Memberships', path: '/memberships', icon: CreditCard },
      { name: 'Payments', path: '/payments', icon: Wallet },
      { name: 'Facilities', path: '/facilities', icon: Building2 },
      { name: 'Bookings', path: '/bookings', icon: CalendarCheck },
      { name: 'Events', path: '/events', icon: CalendarDays },
    ],
  },
  {
    label: 'Insights',
    items: [
      { name: 'Analytics', path: '/analytics', icon: BarChart3 },
      { name: 'Reports', path: '/reports', icon: FileText },
    ],
  },
  {
    label: 'System',
    items: [
      { name: 'Organizations', path: '/organizations', icon: Landmark },
      { name: 'Users', path: '/users', icon: UserRound },
      { name: 'Notifications', path: '/notifications', icon: Bell },
      { name: 'Settings', path: '/settings', icon: Settings },
    ],
  },
]

export const flatNav = navGroups.flatMap((g) => g.items)

export const pathTitles = Object.fromEntries(flatNav.map((n) => [n.path, n.name]))
