import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Timer, Dumbbell, CalendarDays, ClipboardCheck, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

// ─── IPPT scoring (same tables as calculator) ─────────────────────────────────

const PUSHUP_RAW = [[60,25,"","","","","","","","","","","","",""],[59,24,25,"","","","","","","","","","","",""],[58,24,24,25,"","","","","","","","","","",""],[57,24,24,24,25,"","","","","","","","","",""],[56,24,24,24,24,25,"","","","","","","","",""],[55,23,24,24,24,24,25,"","","","","","","",""],[54,23,23,24,24,24,24,25,"","","","","","",""],[53,23,23,23,24,24,24,24,25,"","","","","",""],[52,23,23,23,23,24,24,24,24,"","","","","",""],[51,22,23,23,23,23,24,24,24,25,"","","","",""],[50,22,22,23,23,23,23,24,24,24,"","","","",""],[49,22,22,22,23,23,23,23,24,24,25,"","","",""],[48,22,22,22,22,23,23,23,23,24,24,"","","",""],[47,21,22,22,22,22,23,23,23,24,24,25,"","",""],[46,21,21,22,22,22,22,23,23,23,24,24,"","",""],[45,21,21,21,22,22,22,22,23,23,24,24,25,"",""],[44,21,21,21,21,22,22,22,22,23,23,24,24,"",""],[43,20,21,21,21,21,22,22,22,23,23,24,24,25,""],[42,20,20,21,21,21,21,22,22,22,23,23,24,25,""],[41,20,20,20,21,21,21,21,22,22,23,23,24,24,25],[40,20,20,20,20,21,21,21,21,22,22,23,23,24,25],[39,19,20,20,20,20,21,21,21,22,22,23,23,24,24],[38,19,19,20,20,20,20,21,21,21,22,22,23,23,24],[37,19,19,19,20,20,20,20,21,21,22,22,22,23,24],[36,18,19,19,19,20,20,20,20,21,21,22,22,23,23],[35,18,18,19,19,19,20,20,20,21,21,21,22,22,23],[34,18,18,18,19,19,19,20,20,20,21,21,21,22,23],[33,17,18,18,18,19,19,19,20,20,20,21,21,22,22],[32,17,17,18,18,18,19,19,19,20,20,20,21,21,22],[31,17,17,17,18,18,18,19,19,19,20,20,20,21,22],[30,16,17,17,17,18,18,18,19,19,19,20,20,21,21],[29,16,16,17,17,17,18,18,18,19,19,19,20,20,21],[28,16,16,16,17,17,17,18,18,18,19,19,19,20,20],[27,15,16,16,16,17,17,17,18,18,18,19,19,19,20],[26,15,15,16,16,16,17,17,17,18,18,18,19,19,19],[25,14,15,15,16,16,16,17,17,17,18,18,18,19,19],[24,13,14,15,15,16,16,16,17,17,17,18,18,18,19],[23,12,13,14,15,15,16,16,16,17,17,17,18,18,18],[22,11,12,13,14,15,15,16,16,16,17,17,17,18,18],[21,10,11,12,13,14,15,15,16,16,16,17,17,17,18],[20,9,10,11,12,13,14,15,15,16,16,16,17,17,17],[19,8,9,10,11,12,13,14,15,15,16,16,16,17,17],[18,6,8,9,10,11,12,13,14,15,15,16,16,16,17],[17,4,6,8,9,10,11,12,13,14,15,15,16,16,16],[16,2,4,6,8,9,10,11,12,13,14,15,15,16,16],[15,1,2,4,6,8,9,10,11,12,13,14,15,15,16],[14,0,1,2,4,6,8,9,10,11,12,13,14,15,15]];
const SITUP_RAW  = [[60,25,"","","","","","","","","","","","",""],[59,24,25,"","","","","","","","","","","",""],[58,24,24,25,"","","","","","","","","","",""],[57,24,24,24,25,"","","","","","","","","",""],[56,24,24,24,24,25,"","","","","","","","",""],[55,23,24,24,24,24,25,"","","","","","","",""],[54,23,23,24,24,24,24,25,"","","","","","",""],[53,23,23,23,24,24,24,24,25,"","","","","",""],[52,23,23,23,23,24,24,24,24,"","","","","",""],[51,22,23,23,23,23,24,24,24,25,"","","","",""],[50,22,22,23,23,23,23,24,24,24,"","","","",""],[49,22,22,22,23,23,23,23,24,24,25,"","","",""],[48,22,22,22,22,23,23,23,23,24,24,"","","",""],[47,21,22,22,22,22,23,23,23,24,24,25,"","",""],[46,21,21,22,22,22,22,23,23,23,24,24,"","",""],[45,21,21,21,22,22,22,22,23,23,24,24,24,"",""],[44,21,21,21,21,22,22,22,22,23,23,24,24,25,""],[43,20,21,21,21,21,22,22,22,23,23,23,24,24,""],[42,20,20,21,21,21,21,22,22,22,23,23,24,24,25],[41,20,20,20,21,21,21,21,22,22,23,23,23,24,24],[40,20,20,20,20,21,21,21,21,22,22,23,23,24,24],[39,19,20,20,20,20,21,21,21,22,22,22,23,23,24],[38,19,19,20,20,20,20,21,21,21,22,22,23,23,23],[37,18,19,19,20,20,20,20,21,21,22,22,22,23,23],[36,18,18,19,19,20,20,20,20,21,21,22,22,22,23],[35,17,18,18,19,19,20,20,20,21,21,21,22,22,22],[34,16,17,18,18,19,19,20,20,20,21,21,21,22,22],[33,15,16,17,18,18,19,19,20,20,20,21,21,21,22],[32,14,15,16,17,18,18,19,19,20,20,20,21,21,21],[31,14,14,15,16,17,18,18,19,19,20,20,20,21,21],[30,13,14,14,15,16,17,18,18,19,19,20,20,20,21],[29,13,13,14,14,15,16,17,18,18,18,19,20,20,20],[28,12,13,13,14,14,15,16,17,18,18,19,19,20,20],[27,11,12,13,13,14,14,15,16,17,18,18,19,19,20],[26,10,11,12,13,13,14,14,15,16,17,18,18,19,19],[25,9,10,11,12,13,13,14,14,15,16,17,18,18,19],[24,8,9,10,11,12,13,13,14,14,15,16,17,18,18],[23,7,8,9,10,11,12,13,13,14,14,15,16,17,18],[22,7,7,8,9,10,11,12,13,13,14,14,15,16,17],[21,6,7,7,8,9,10,11,12,13,13,14,14,15,16],[20,6,6,7,7,8,9,10,11,12,13,13,14,14,15],[19,5,6,6,7,7,8,9,10,11,12,13,13,14,14],[18,4,5,6,6,7,7,8,9,10,11,12,13,13,14],[17,3,4,5,6,6,7,7,8,9,10,11,12,13,13],[16,2,3,4,5,6,6,7,7,8,9,10,11,12,13],[15,1,2,3,4,5,6,6,7,7,8,9,10,11,12],[14,0,1,2,3,4,5,6,6,7,7,8,9,10,11]];
const RUN_RAW = [["8:30",50],["8:40",49,50],["8:50",48,49,50],["9:00",47,48,49],["9:10",46,47,48,50],["9:20",45,46,47,49,50],["9:30",44,45,46,48,49,50],["9:40",43,44,45,47,48,49,50],["9:50",42,43,44,46,47,48,49,50],["10:00",41,42,43,45,46,47,48,49,50],["10:10",40,41,42,44,45,46,47,48,49,50],["10:20",39,40,41,43,44,45,46,47,48,49,50],["10:30",38,39,40,42,43,44,45,46,47,48,49,50],["10:40",38,38,39,41,42,43,44,45,46,47,48,49,50],["10:50",37,38,38,40,41,42,43,44,45,46,47,48,49,50],["11:00",37,37,38,39,40,41,42,43,44,45,46,47,48,49],["11:10",36,37,37,38,39,40,41,42,43,44,45,46,47,48],["11:20",36,36,37,38,38,39,40,41,42,43,44,45,46,47],["11:30",35,36,36,37,38,38,39,40,41,42,43,44,45,46],["11:40",35,35,36,37,37,38,38,39,40,41,42,43,44,45],["11:50",34,35,35,36,37,37,38,38,39,40,41,42,43,44],["12:00",33,34,35,36,36,37,37,38,38,39,40,41,42,43],["12:10",32,33,34,35,36,36,37,37,38,38,39,40,41,42],["12:20",31,32,33,35,35,36,36,37,37,38,38,39,40,41],["12:30",30,31,32,34,35,35,36,36,37,37,38,38,39,40],["12:40",29,30,31,33,34,35,35,36,36,37,37,38,38,39],["12:50",28,29,30,32,33,34,35,35,36,36,37,37,38,38],["13:00",27,28,29,31,32,33,34,35,35,36,36,37,37,38],["13:10",26,27,28,30,31,32,33,34,35,35,36,36,37,37],["13:20",25,26,27,29,30,31,32,33,34,35,35,36,36,37],["13:30",24,25,26,28,29,30,31,32,33,34,35,35,36,36],["13:40",23,24,25,27,28,29,30,31,32,33,34,35,35,36],["13:50",22,23,24,26,27,28,29,30,31,32,33,34,35,35],["14:00",21,22,23,25,26,27,28,29,30,31,32,33,34,35],["14:10",20,21,22,24,25,26,27,28,29,30,31,32,33,34],["14:20",19,20,21,23,24,25,26,27,28,29,30,31,32,33],["14:30",18,19,20,22,23,24,25,26,27,28,29,30,31,32],["14:40",16,18,19,21,22,23,24,25,26,27,28,29,30,31],["14:50",14,16,18,20,21,22,23,24,25,26,27,28,29,30],["15:00",12,14,16,19,20,21,22,23,24,25,26,27,28,29],["15:10",10,12,14,18,19,20,21,22,23,24,25,26,27,28],["15:20",8,10,12,16,18,19,20,21,22,23,24,25,26,27],["15:30",6,8,10,14,16,18,19,20,21,22,23,24,25,26],["15:40",4,6,8,12,14,16,18,19,20,21,22,23,24,25],["15:50",2,4,6,10,12,14,16,18,19,20,21,22,23,24],["16:00",1,2,4,8,10,12,14,16,18,19,20,21,22,23],["16:10",0,1,2,6,8,10,12,14,16,18,19,20,21,22]];

function getAgeGroupIdx(age: number): number {
  if (age < 22) return 0; if (age <= 24) return 1; if (age <= 27) return 2;
  if (age <= 30) return 3; if (age <= 33) return 4; if (age <= 36) return 5;
  if (age <= 39) return 6; if (age <= 42) return 7; if (age <= 45) return 8;
  if (age <= 48) return 9; if (age <= 51) return 10; if (age <= 54) return 11;
  if (age <= 57) return 12; return 13;
}
function buildMap(raw: (number|string)[][]): Map<number,number[]> {
  const m = new Map<number,number[]>();
  for (const row of raw) {
    const pts: number[] = [];
    for (let i=1;i<=14;i++) { const v=row[i]; pts.push(v===""||v===undefined?25:v as number); }
    m.set(row[0] as number, pts);
  }
  return m;
}
const PU_MAP = buildMap(PUSHUP_RAW);
const SU_MAP = buildMap(SITUP_RAW);
function timeToSec(t: string) { const [m,s]=t.split(':').map(Number); return m*60+s; }
const RUN_TABLE: [number,number[]][] = (RUN_RAW as (string|number)[][]).map(row => {
  const pts: number[] = [];
  for (let i=1;i<=14;i++) { const v=row[i]; pts.push(v===""||v===undefined?50:v as number); }
  return [timeToSec(row[0] as string), pts];
});
function getPts(map: Map<number,number[]>, reps: number, idx: number) { return (map.get(reps)??[])[idx]??0; }
function getRunPts(sec: number, idx: number) {
  const r = Math.ceil(sec/10)*10;
  for (const [ms,pts] of RUN_TABLE) { if (r<=ms) return pts[idx]??0; }
  return 0;
}
function calcIppt(pu: number, su: number, runSec: number, age: number) {
  const idx = getAgeGroupIdx(age);
  const puPts = getPts(PU_MAP, pu, idx);
  const suPts = getPts(SU_MAP, su, idx);
  const runPts = getRunPts(runSec, idx);
  const total = puPts + suPts + runPts;
  let award = 'Fail';
  if (puPts>=1 && suPts>=1 && runPts>=1) {
    if (total>=85) award='Gold';
    else if (total>=75) award='Silver';
    else if (total>=51) award='Pass';
  }
  return { total, award, puPts, suPts, runPts };
}

const AWARD_COLOR: Record<string,string> = {
  Gold:'text-yellow-500', Silver:'text-slate-400', Pass:'text-green-600', Fail:'text-red-500',
};

const fmtTime = (sec: number) => `${Math.floor(sec/60)}:${String(sec%60).padStart(2,'0')}`;

const upcomingEvents = [
  { date: 'Today',    title: 'Swim 1km + Core Workout',       type: 'swim' },
  { date: 'Tomorrow', title: '5km Run',                        type: 'run'  },
  { date: 'Fri',      title: 'Rest Day',                       type: 'rest' },
  { date: 'Sat',      title: 'Spartan Prep – Obstacle Training', type: 'gym' },
];
const typeColors: Record<string,string> = {
  run:'bg-blue-500/20 text-blue-700', swim:'bg-cyan-500/20 text-cyan-700',
  gym:'bg-orange-500/20 text-orange-700', rest:'bg-muted text-muted-foreground',
};

const quickActions = [
  { label: 'BMI Calculator',  to: '/bmi',        icon: '🧮' },
  { label: 'IPPT Calculator', to: '/ippt',        icon: '🏃' },
  { label: 'Calorie Calc',    to: '/calories',    icon: '🍎' },
  { label: 'Programmes',      to: '/programmes',  icon: '💪' },
  { label: 'Leaderboard',     to: '/leaderboard', icon: '🏆' },
  { label: 'Spartan',         to: '/spartan',     icon: '⚔️' },
  { label: 'Schedule',        to: '/schedule',    icon: '📅' },
  { label: 'Attendance',      to: '/attendance',  icon: '✅' },
];

export default function PTDashboard() {
  const { profile, user } = useAuth();
  const [ipptResult, setIpptResult] = useState<ReturnType<typeof calcIppt> | null>(null);

  useEffect(() => {
    if (!user) return;
    // Fetch latest profile data directly to get IPPT fields
    supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data }) => {
      if (
        data?.ippt_pushups && data?.ippt_situps &&
        data?.ippt_run_seconds && data?.age
      ) {
        setIpptResult(calcIppt(data.ippt_pushups, data.ippt_situps, data.ippt_run_seconds, data.age));
      }
    });
  }, [user]);

  const ipptScore = ipptResult?.total ?? null;
  const ipptAward = ipptResult?.award ?? null;
  const runTime   = (profile as any)?.ippt_run_seconds ? fmtTime((profile as any).ippt_run_seconds) : null;
  const pushups   = (profile as any)?.ippt_pushups ?? null;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Welcome back, {profile?.rank && profile.rank !== 'Other' ? `${profile.rank} ` : ''}{profile?.full_name || 'Soldier'} 💪
        </h1>
        <p className="text-muted-foreground">Here's your fitness overview for today</p>
      </div>

      {/* Quick Actions — top on mobile */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base"><TrendingUp className="h-5 w-5" /> Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-2">
            {quickActions.map(a => (
              <Link key={a.label} to={a.to}>
                <div className="rounded-xl border p-2.5 text-center hover:bg-muted/50 active:scale-95 transition-all cursor-pointer">
                  <div className="text-xl mb-1">{a.icon}</div>
                  <div className="text-[10px] font-medium text-foreground leading-tight">{a.label}</div>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* IPPT Stats — live from profile */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link to="/ippt">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                <span className="text-xs text-muted-foreground">IPPT Score</span>
              </div>
              <div className={`text-2xl font-bold ${ipptAward ? AWARD_COLOR[ipptAward] : 'text-foreground'}`}>
                {ipptScore ?? '—'}
              </div>
              <div className="text-xs text-muted-foreground">{ipptAward ?? 'Not set'}</div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/ippt">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Timer className="h-5 w-5 text-primary" />
                <span className="text-xs text-muted-foreground">2.4km Run</span>
              </div>
              <div className="text-2xl font-bold text-foreground">{runTime ?? '—'}</div>
              <div className="text-xs text-muted-foreground">Official IPPT</div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/ippt">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Dumbbell className="h-5 w-5 text-primary" />
                <span className="text-xs text-muted-foreground">Push-ups</span>
              </div>
              <div className="text-2xl font-bold text-foreground">{pushups ?? '—'}</div>
              <div className="text-xs text-muted-foreground">Official IPPT</div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/attendance">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <ClipboardCheck className="h-5 w-5 text-green-500" />
                <span className="text-xs text-muted-foreground">Attendance</span>
              </div>
              <div className="text-2xl font-bold text-foreground">—</div>
              <div className="text-xs text-muted-foreground">This month</div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Schedule */}
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

    </div>
  );
}
