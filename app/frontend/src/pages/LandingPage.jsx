import { Link } from 'react-router-dom'
import { BarChart3, Building2, CalendarDays, Check, CreditCard, Shield, Trophy, Users } from 'lucide-react'
import { Button } from '../components/ui'

const features = [
  { icon: Users, title: 'Athletes and teams', text: 'One digital profile per athlete: team, coach, attendance, performance and membership.' },
  { icon: Trophy, title: 'Competitions', text: 'Fixtures, results and standings, from local leagues to inter-club championships.' },
  { icon: CreditCard, title: 'Memberships and payments', text: 'Plans, renewals, transactions and outstanding balances in one view.' },
  { icon: Building2, title: 'Facilities and bookings', text: 'A weekly calendar for pitches, courts and rooms, with approval workflows.' },
  { icon: CalendarDays, title: 'Events', text: 'Training, matches, workshops and club events, organised in one schedule.' },
  { icon: BarChart3, title: 'Analytics and reports', text: 'See trends, spot athletes who need attention, and export reports to CSV, Excel or PDF.' },
]

const tiers = [
  { name: 'Starter', for: 'Small clubs', items: ['Athletes, teams, coaches', 'Memberships', 'Basic dashboard'] },
  { name: 'Professional', for: 'Growing organizations', items: ['Payments and facilities', 'Competitions', 'Analytics and reports'] },
  { name: 'Enterprise', for: 'Large organizations', items: ['Multiple branches', 'Custom roles and API access', 'Dedicated support'] },
]

function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2 text-lg font-bold"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white"><Trophy size={18} /></span> Sports Club</div>
        <Link to="/login" className="text-sm font-medium text-gray-700 hover:text-blue-600">Sign in</Link>
      </header>

      <section className="mx-auto max-w-4xl px-6 pb-20 pt-16 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Run your entire sports organization from one platform.</h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-gray-600">Manage athletes, teams, competitions, memberships, facilities and performance from a single intelligent platform.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/login"><Button>Request a Demo</Button></Link>
          <a href="#features"><Button variant="secondary">Explore Platform</Button></a>
        </div>
      </section>

      <section id="features" className="bg-gray-50 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-2xl font-bold">Everything your organization runs on</h2>
          <p className="mx-auto mt-2 max-w-xl text-center text-gray-600">Replace spreadsheets, group chats and paper records with a single system.</p>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><Icon size={20} /></div>
                <h3 className="mt-4 font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-gray-600">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="flex items-center justify-center gap-2 text-blue-600"><Shield size={18} /><span className="text-sm font-semibold">Built for many organizations</span></div>
        <h2 className="mt-2 text-center text-2xl font-bold">Plans for every size of organization</h2>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {tiers.map((t) => (
            <div key={t.name} className="rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold">{t.name}</h3>
              <p className="text-sm text-gray-500">{t.for}</p>
              <ul className="mt-4 space-y-2 text-sm text-gray-700">{t.items.map((i) => <li key={i} className="flex gap-2"><Check size={15} className="mt-0.5 text-emerald-500" /> {i}</li>)}</ul>
            </div>
          ))}
        </div>
        <p className="mt-4 text-center text-xs text-gray-500">Plan tiers are illustrative. Pricing has not been researched or validated.</p>
      </section>

      <footer className="border-t border-gray-200 py-8 text-center text-sm text-gray-500">© 2026 Sports Platform</footer>
    </div>
  )
}

export default LandingPage
