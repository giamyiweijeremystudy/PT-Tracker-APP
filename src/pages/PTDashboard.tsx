import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Timer, Dumbbell, CalendarDays, ClipboardCheck, Target, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

const quickStats = [
  { icon: Trophy, label: 'IPPT Score', value: '72', sub: 'Silver', color: 'text-yellow-500', to: '/ippt' },
  { icon: Timer, label: 'Best 2.4km', value: '9:30', sub: 'Last: Apr 8', color: 'text-primary', to: '/leaderboard' },
  { icon: Dumbbell, label: 'Push-ups', value: '45', sub: 'Last test', color: 'text-primary', to: '/leaderboard' },
  { icon: ClipboardCheck, label: 'Attendance', value: '86%', sub: 'This month', color: 'text-success', to: '/attendance' },
];

const upcomingEvents = [
  { date: 'Today', title: 'Swim 1km + Core Workout', type: 'swim' },
  { date: 'Tomorrow', title: '5km Run', type: 'run' },
  { date: 'Fri', title: 'Rest Day', type: 'rest' },
  { date: 'Sat', title: 'Spartan Prep – Obstacle Training', type: 'gym' },
];

const typeColors: Record<string, string> = {
  run: 'bg-blue-500/20 text-blue-700',
  swim: 'bg-cyan-500/20 text-cyan-700',
  gym: 'bg-orange-500/20 text-orange-700',
  rest: 'bg-muted text-muted-foreground',
};

export default function PTDashboard() {
  const { profile } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Welcome back, {profile?.rank} {profile?.full_name || 'Soldier'} 💪
        </h1>
        <p className="text-muted-foreground">Here's your fitness overview for today</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {quickStats.map(s => (
          <Link key={s.label} to={s.to}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <s.icon className={`h-5 w-5 ${s.color}`} />
                  <span className="text-xs text-muted-foreground">{s.label}</span>
                </div>
                <div className="text-2xl font-bold text-foreground">{s.value}</div>
                <div className="text-xs text-muted-foreground">{s.sub}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><CalendarDays className="h-5 w-5" /> Upcoming Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingEvents.map((e, i) => (
                <div key={i} className="flex items-center gap-3 rounded-lg border p-3">
                  <div className="w-16 text-sm font-medium text-muted-foreground">{e.date}</div>
                  <Badge className={typeColors[e.type]}>{e.type}</Badge>
                  <span className="text-sm text-foreground">{e.title}</span>
                </div>
              ))}
            </div>
            <Link to="/schedule" className="text-sm text-primary hover:underline mt-3 inline-block">View full schedule →</Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5" /> Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'BMI Calculator', to: '/bmi', icon: '🧮' },
                { label: 'IPPT Calculator', to: '/ippt', icon: '🏃' },
                { label: 'Calorie Calc', to: '/calories', icon: '🍎' },
                { label: 'Programmes', to: '/programmes', icon: '💪' },
                { label: 'Leaderboard', to: '/leaderboard', icon: '🏆' },
                { label: 'Spartan', to: '/spartan', icon: '⚔️' },
              ].map(a => (
                <Link key={a.label} to={a.to}>
                  <div className="rounded-lg border p-3 text-center hover:bg-muted/50 transition-colors cursor-pointer">
                    <div className="text-2xl mb-1">{a.icon}</div>
                    <div className="text-xs font-medium text-foreground">{a.label}</div>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
