import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTeam } from '@/contexts/TeamContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Trophy, Timer, Dumbbell, CalendarDays, Calculator,
  Activity, Users, TrendingUp, BookOpen, MessageSquare,
  BookMarked, Pin, ChevronRight, Zap,
} from 'lucide-react';
import { Link } from 'react-router-dom';

// -IPPT scoring -------------------------------------------------------------
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

function fmtTime(sec: number) { return Math.floor(sec/60) + ':' + String(sec%60).padStart(2,'0'); }

function fmtDate(iso: string) {
  const [y,m,d] = iso.slice(0,10).split('-').map(Number);
  return String(d).padStart(2,'0') + '/' + String(m).padStart(2,'0') + '/' + y;
}

function todayStr() {
  const n = new Date();
  return n.getFullYear() + '-' + String(n.getMonth()+1).padStart(2,'0') + '-' + String(n.getDate()).padStart(2,'0');
}

const ACTIVITY_EMOJIS: Record<string,string> = {
  running:'Running', jogging:'Jogging', walking:'Walking', swimming:'Swimming', cycling:'Cycling',
  ippt_training:'IPPT', gym:'Gym', strength_training:'Strength', calisthenics:'Calisthenics', others:'Other',
};

const EVENT_TYPE_STYLE: Record<string,string> = {
  PT:  'bg-blue-100 text-blue-700',
  SFT: 'bg-green-100 text-green-700',
  Personal: 'bg-violet-100 text-violet-700',
  Other: 'bg-muted text-muted-foreground',
};

const quickActions = [
  { label: 'Log Activity',     to: '/activities',  icon: Activity,      color: 'text-green-500'  },
  { label: 'Calculators',      to: '/calculators', icon: Calculator,    color: 'text-blue-500'   },
  { label: 'My Team',          to: '/teams',       icon: Users,         color: 'text-violet-500' },
  { label: 'Schedule',         to: '/schedule',    icon: CalendarDays,  color: 'text-orange-500' },
  { label: 'Programs',         to: '/programs',    icon: BookMarked,    color: 'text-pink-500'   },
  { label: 'Progress',         to: '/progress',    icon: TrendingUp,    color: 'text-teal-500'   },
  { label: 'Useful Info',      to: '/useful-info', icon: BookOpen,      color: 'text-yellow-500' },
  { label: 'PT Assistant',     to: '/chat',        icon: MessageSquare, color: 'text-primary'    },
];

interface PersonalEvent {
  id: string; user_id: string; title: string; description: string;
  event_date: string; event_type: string; source: string;
}

interface TeamEvent {
  id: string; team_id: string; title: string; description: string;
  event_date: string; event_type: string; is_important: boolean;
}

interface LatestActivity {
  id: string; type: string; custom_type: string | null;
  date: string; title: string | null; duration_minutes: number | null;
  distance_km: number | null;
}

export default function PTDashboard() {
  const { profile, user } = useAuth();
  const { team } = useTeam();
  const [ipptResult, setIpptResult] = useState<ReturnType<typeof calcIppt> | null>(null);
  const [situps, setSitups] = useState<number | null>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<PersonalEvent[]>([]);
  const [importantTeamEvents, setImportantTeamEvents] = useState<TeamEvent[]>([]);
  const [latestActivity, setLatestActivity] = useState<LatestActivity | null>(null);
  const [loadingEvents, setLoadingEvents] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data }) => {
      if (data?.ippt_pushups && data?.ippt_situps && data?.ippt_run_seconds && data?.age) {
        setIpptResult(calcIppt(data.ippt_pushups, data.ippt_situps, data.ippt_run_seconds, data.age));
        setSitups(data.ippt_situps);
      }
    });
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const today = todayStr();
    const twoWeeks = (() => {
      const d = new Date(); d.setDate(d.getDate() + 14);
      return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
    })();

    // Personal events
    supabase.from('personal_events').select('*')
      .eq('user_id', user.id)
      .gte('event_date', today)
      .lte('event_date', twoWeeks)
      .order('event_date', { ascending: true })
      .limit(5)
      .then(({ data }) => {
        if (data) setUpcomingEvents(data as PersonalEvent[]);
        setLoadingEvents(false);
      });

    // Latest activity
    supabase.from('activities').select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(1)
      .single()
      .then(({ data }) => { if (data) setLatestActivity(data as LatestActivity); });
  }, [user]);

  useEffect(() => {
    if (!team) return;
    const today = todayStr();
    const twoWeeks = (() => {
      const d = new Date(); d.setDate(d.getDate() + 14);
      return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
    })();
    supabase.from('team_events').select('*')
      .eq('team_id', team.id)
      .eq('is_important', true)
      .gte('event_date', today)
      .lte('event_date', twoWeeks)
      .order('event_date', { ascending: true })
      .limit(5)
      .then(({ data }) => { if (data) setImportantTeamEvents(data as TeamEvent[]); });
  }, [team]);

  const ipptScore = ipptResult?.total ?? null;
  const ipptAward = ipptResult?.award ?? null;
  const runTime   = (profile as any)?.ippt_run_seconds ? fmtTime((profile as any).ippt_run_seconds) : null;
  const pushups   = (profile as any)?.ippt_pushups ?? null;

  return (
    <div className="space-y-5">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {'Welcome back, ' + (profile?.rank && profile.rank !== 'Other' ? profile.rank + ' ' : '') + (profile?.full_name || 'Soldier') + ' \u{1F4AA}'}
        </h1>
        <p className="text-muted-foreground text-sm">Here's your fitness overview for today</p>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Zap className="h-5 w-5 text-yellow-500" /> Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-2">
            {quickActions.map(a => (
              <Link key={a.label} to={a.to}>
                <div className="rounded-xl border p-3 flex flex-col items-center gap-1.5 hover:bg-muted/50 active:scale-95 transition-all cursor-pointer">
                  <a.icon className={'h-5 w-5 ' + a.color} />
                  <div className="text-[10px] font-medium text-foreground leading-tight text-center">{a.label}</div>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Important team event notifications */}
      {importantTeamEvents.length > 0 && (
        <div className="space-y-2">
          {importantTeamEvents.map(e => (
            <Link to="/teams" key={e.id}>
              <div className="flex items-start gap-3 rounded-xl border-2 border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20 px-4 py-3 hover:bg-yellow-100 transition-colors">
                <Pin className="h-4 w-4 text-yellow-600 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">{e.title}</span>
                    <span className={'text-xs px-2 py-0.5 rounded-full font-medium ' + (EVENT_TYPE_STYLE[e.event_type] ?? EVENT_TYPE_STYLE.Other)}>
                      {e.event_type}
                    </span>
                  </div>
                  <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-0.5">{fmtDate(e.event_date)}</p>
                  {e.description && <p className="text-xs text-yellow-600 mt-0.5">{e.description}</p>}
                </div>
                <ChevronRight className="h-4 w-4 text-yellow-600 shrink-0 mt-0.5" />
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* IPPT Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Link to="/calculators">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                <span className="text-xs text-muted-foreground">IPPT Score</span>
              </div>
              <div className={'text-2xl font-bold ' + (ipptAward ? AWARD_COLOR[ipptAward] : 'text-foreground')}>
                {ipptScore ?? '--'}
              </div>
              <div className="text-xs text-muted-foreground">{ipptAward ?? 'Not set'}</div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/calculators">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Timer className="h-5 w-5 text-primary" />
                <span className="text-xs text-muted-foreground">2.4km Run</span>
              </div>
              <div className="text-2xl font-bold text-foreground">{runTime ?? '--'}</div>
              <div className="text-xs text-muted-foreground">Official IPPT</div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/calculators">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Dumbbell className="h-5 w-5 text-primary" />
                <span className="text-xs text-muted-foreground">Push-ups</span>
              </div>
              <div className="text-2xl font-bold text-foreground">{pushups ?? '--'}</div>
              <div className="text-xs text-muted-foreground">Official IPPT</div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/calculators">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Dumbbell className="h-5 w-5 text-green-500" />
                <span className="text-xs text-muted-foreground">Sit-ups</span>
              </div>
              <div className="text-2xl font-bold text-foreground">{situps ?? '--'}</div>
              <div className="text-xs text-muted-foreground">Official IPPT</div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Latest Activity */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="h-5 w-5 text-green-500" /> Latest Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {latestActivity ? (
            <div className="flex items-center gap-3">
              <span className="text-2xl">{ACTIVITY_EMOJIS[latestActivity.type] ?? ''}</span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm capitalize">
                  {latestActivity.type === 'others' && latestActivity.custom_type
                    ? latestActivity.custom_type
                    : latestActivity.type.replace(/_/g, ' ')}
                </p>
                <p className="text-xs text-muted-foreground">{fmtDate(latestActivity.date)}</p>
                {(latestActivity.duration_minutes || latestActivity.distance_km) && (
                  <div className="flex gap-3 mt-1">
                    {latestActivity.duration_minutes && (
                      <span className="text-xs text-muted-foreground">{latestActivity.duration_minutes} min</span>
                    )}
                    {latestActivity.distance_km && (
                      <span className="text-xs text-muted-foreground">{latestActivity.distance_km} km</span>
                    )}
                  </div>
                )}
              </div>
              <Link to="/activities">
                <Button variant="ghost" size="sm" className="text-xs shrink-0">
                  View all <ChevronRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </Link>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">No activities logged yet</p>
              <Link to="/activities">
                <Button size="sm" variant="outline" className="text-xs">Log Activity</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upcoming Schedule */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarDays className="h-5 w-5" /> Upcoming Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingEvents ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : upcomingEvents.length === 0 ? (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">No upcoming events in the next 14 days</p>
              <Link to="/schedule">
                <Button size="sm" variant="outline" className="text-xs shrink-0">Add Event</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {upcomingEvents.map(e => (
                <div key={e.id} className="flex items-center gap-3 rounded-lg border p-3">
                  <div className="text-xs font-medium text-muted-foreground w-20 shrink-0">{fmtDate(e.event_date)}</div>
                  <Badge className={EVENT_TYPE_STYLE[e.event_type] ?? EVENT_TYPE_STYLE.Other}>{e.event_type}</Badge>
                  <span className="text-sm text-foreground truncate">{e.title}</span>
                </div>
              ))}
              <Link to="/schedule" className="text-sm text-primary hover:underline mt-1 inline-block">
                View full schedule
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
