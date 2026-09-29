import {
    Area,
    AreaChart,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
  } from "recharts";
  
  import {
    Users,
    Trophy,
    Medal,
    CalendarDays,
  } from "lucide-react";

  import { motion, animate } from "framer-motion";
import { useEffect, useState } from "react";
  
  function HomePage() {
    const athleteData = [
      { month: "Jan", athletes: 20 },
      { month: "Feb", athletes: 35 },
      { month: "Mar", athletes: 42 },
      { month: "Apr", athletes: 58 },
      { month: "May", athletes: 70 },
      { month: "Jun", athletes: 90 },
      { month: "Jul", athletes: 108 },
      { month: "Aug", athletes: 128 },
    ];
  
    const teamData = [
      { team: "Football", score: 95 },
      { team: "Basketball", score: 78 },
      { team: "Volleyball", score: 64 },
      { team: "Swimming", score: 82 },
    ];
    const [stats, setStats] = useState({
        athletes: 0,
        teams: 0,
        competitions: 0,
        events: 0,
      });
      
      useEffect(() => {
        const controls = [
          animate(0, stats.athletes, {
            duration: 1.2,
            onUpdate: (v) =>
              setStats((s) => ({ ...s, athletes: Math.round(v) })),
          }),
      
          animate(0, stats.teams, {
            duration: 1,
            onUpdate: (v) =>
              setStats((s) => ({ ...s, teams: Math.round(v) })),
          }),
      
          animate(0, 8, {
            duration: 1,
            onUpdate: (v) =>
              setStats((s) => ({ ...s, competitions: Math.round(v) })),
          }),
      
          animate(0, 24, {
            duration: 1.1,
            onUpdate: (v) =>
              setStats((s) => ({ ...s, events: Math.round(v) })),
          }),
        ];
      
        return () => controls.forEach((c) => c.stop());
      }, []);
    return (
        <div>
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
                      <div>
                      <p className="text-sm uppercase tracking-widest text-blue-600 font-semibold">
  Sports Club Management System
</p>

<h1 className="text-4xl font-bold text-gray-900 mt-2">
  Dashboard Overview 👋
</h1>

<p className="text-gray-500 mt-2">
  Manage athletes, teams, competitions and schedules from one place.
</p>
          </div>
  
        </header>
  
        {/* KPI Cards */}
<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
        
{/* Athletes */}
<motion.div
  whileHover={{ y: -8, scale: 1.03 }}
  transition={{ type: "spring", stiffness: 250 }}
  className="rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-600 p-6 text-white shadow-lg transition-all duration-300 hover:shadow-2xl"
>
  <div className="flex justify-between items-start">
    <div>
      <p className="text-blue-100 text-sm">Athletes</p>
      <h2 className="text-4xl font-bold mt-3">128</h2>
      <p className="text-blue-100 mt-2 text-sm">↑ 12% this month</p>
    </div>

    <div className="rounded-2xl bg-white/20 p-3">
      <Users size={28} />
    </div>
  </div>
</motion.div>

{/* Teams */}
<motion.div
  whileHover={{ y: -8, scale: 1.03 }}
  transition={{ type: "spring", stiffness: 250 }}
  className="rounded-3xl bg-gradient-to-br from-emerald-500 to-green-700 p-6 text-white shadow-lg transition-all duration-300 hover:shadow-2xl"
>
  <div className="flex justify-between items-start">
    <div>
      <p className="text-green-100 text-sm">Teams</p>
      <h2 className="text-4xl font-bold mt-3">12</h2>
      <p className="text-green-100 mt-2 text-sm">↑ 5% this month</p>
    </div>

    <div className="rounded-2xl bg-white/20 p-3">
      <Trophy size={28} />
    </div>
  </div>
</motion.div>

{/* Competitions */}
<motion.div
  whileHover={{ y: -8, scale: 1.03 }}
  transition={{ type: "spring", stiffness: 250 }}
  className="rounded-3xl bg-gradient-to-br from-purple-600 to-violet-700 p-6 text-white shadow-lg transition-all duration-300 hover:shadow-2xl"
>
  <div className="flex justify-between items-start">
    <div>
      <p className="text-purple-100 text-sm">Competitions</p>
      <h2 className="text-4xl font-bold mt-3">8</h2>
      <p className="text-purple-100 mt-2 text-sm">↑ 18% this season</p>
    </div>

    <div className="rounded-2xl bg-white/20 p-3">
      <Medal size={28} />
    </div>
  </div>
</motion.div>

{/* Events */}
<motion.div
  whileHover={{ y: -8, scale: 1.03 }}
  transition={{ type: "spring", stiffness: 250 }}
  className="rounded-3xl bg-gradient-to-br from-orange-500 to-red-600 p-6 text-white shadow-lg transition-all duration-300 hover:shadow-2xl"
>
  <div className="flex justify-between items-start">
    <div>
      <p className="text-orange-100 text-sm">Upcoming Events</p>
      <h2 className="text-4xl font-bold mt-3">{stats.athletes}</h2>      <p className="text-orange-100 mt-2 text-sm">3 this week</p>
    </div>

    <div className="rounded-2xl bg-white/20 p-3">
      <CalendarDays size={28} />
    </div>
  </div>
</motion.div>

</div>
  
          {/* Charts */}
          <div className="grid lg:grid-cols-2 gap-8 mt-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition">
            <h2 className="text-xl font-semibold mb-4">
              Athlete Registrations
            </h2>
  
            <ResponsiveContainer width="100%" height={300}>
  <AreaChart data={athleteData}>
    <defs>
      <linearGradient id="athletes" x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.45} />
        <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
      </linearGradient>
    </defs>

    <CartesianGrid stroke="#eef2f7" strokeDasharray="4 4" />

    <XAxis
      dataKey="month"
      tickLine={false}
      axisLine={false}
    />

    <YAxis
      tickLine={false}
      axisLine={false}
    />

    <Tooltip />

    <Area
      type="monotone"
      dataKey="athletes"
      stroke="#2563eb"
      strokeWidth={4}
      fill="url(#athletes)"
    />
  </AreaChart>
</ResponsiveContainer>
          </div>
  
          <div className="bg-white rounded-3xl shadow-lg border-gray-100 p-6 hover:shadow-xl transition-all duration-300">
            <h2 className="text-xl font-semibold mb-4">
              Team Performance
            </h2>
  
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={teamData}>
              <CartesianGrid stroke="#eef2f7" strokeDasharray="4 4" />
                <XAxis dataKey="team" />
                <YAxis />
                <Tooltip />
                <Bar
  dataKey="score"
  fill="#2563eb"
  radius={[10,10,0,0]}
/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
  
        {/* Bottom Section */}
        <div className="grid lg:grid-cols-2 gap-8 mt-8">
  
          <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition">
            <h2 className="text-2xl font-bold mb-6">
              Recent Activity
            </h2>
  
            <div className="space-y-5">
  
              <div className="flex justify-between items-center border-b pb-3">
                <span>✅ New athlete registered</span>
                <span className="text-sm text-gray-500">
                  2 mins ago
                </span>
              </div>
  
              <div className="flex justify-between items-center border-b pb-3">
                <span>🏆 Team Falcons updated</span>
                <span className="text-sm text-gray-500">
                  15 mins ago
                </span>
              </div>
  
              <div className="flex justify-between items-center border-b pb-3">
                <span>📅 Competition scheduled</span>
                <span className="text-sm text-gray-500">
                  Today
                </span>
              </div>
  
              <div className="flex justify-between items-center">
                <span>👤 Coach assigned</span>
                <span className="text-sm text-gray-500">
                  Yesterday
                </span>
              </div>
  
            </div>
          </div>
  
          <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border border-white p-6 hover:shadow-xl transition">
            <h2 className="text-2xl font-bold mb-6">
              Upcoming Events
            </h2>
  
            <div className="space-y-6">
  
              <div>
                <p className="font-semibold">
                  Inter Club Championship
                </p>
                <p className="text-gray-500">
                  15 September
                </p>
              </div>
  
              <div>
                <p className="font-semibold">
                  Regional Qualifiers
                </p>
                <p className="text-gray-500">
                  18 September
                </p>
              </div>
  
              <div>
                <p className="font-semibold">
                  Team Training
                </p>
                <p className="text-gray-500">
                  22 September
                </p>
              </div>
  
              <div>
                <p className="font-semibold">
                  Awards Ceremony
                </p>
                <p className="text-gray-500">
                  30 September
                </p>
              </div>
  
            </div>
          </div>
  
        </div>
  
      </div>
    );
  }
  
  export default HomePage;