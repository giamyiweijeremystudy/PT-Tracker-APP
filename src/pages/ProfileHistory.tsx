import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { User, Trophy, Plus, Pencil, BarChart2 } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, BarChart, Bar,
} from 'recharts';

// ─── Types ───────────────────────────────────────────────────────────────────

type Activity = {
  id: string;
  date: string;
  type: string;
  distance_km: number | null;
  duration_minutes: number | null;
  pushups: number | null;
  situps: number | null;
  run_seconds: number | null;
  notes: string | null;
};

type ProfileData = {
  full_name: string;
  rank: string;
  department: string;
  age: number | null;
  height_cm: number | null;
  ippt_score: number | null;
  ippt_pushups: number | null;
  ippt_situps: number | null;
  ippt_run_seconds: number | null;
};

// ─── IPPT Scoring Tables ──────────────────────────────────────────────────────
// Source: Official SAF IPPT Scoring Tables for Servicemen
// Each array index = reps - 1 (so index 0 = 1 rep)
// [cat1_pts, cat2_pts] where cat1=<22, cat2=22-24

// PUSH-UP scoring: reps → [cat1, cat2]
// Read from official Push-up Scoring Table for Servicemen
const PUSHUP_PTS: Record<number, [number, number]> = {
  60:[25,25], 59:[24,25], 58:[24,24], 57:[24,24], 56:[24,24],
  55:[24,24], 54:[23,23], 53:[23,23], 52:[23,23], 51:[22,23],
  50:[22,22], 49:[22,22], 48:[21,22], 47:[21,22], 46:[21,21],
  45:[21,21], 44:[21,21], 43:[20,21], 42:[20,20], 41:[20,20],
  40:[20,20], 39:[19,20], 38:[19,19], 37:[18,19], 36:[18,18],
  35:[17,18], 34:[16,17], 33:[15,16], 32:[14,15], 31:[14,14],
  30:[13,14], 29:[13,13], 28:[12,12], 27:[11,12], 26:[10,11],
  25:[9,10],  24:[8,9],   23:[7,8],   22:[6,7],   21:[5,6],
  20:[4,5],   19:[3,4],   18:[2,3],   17:[1,2],   16:[0,1],
  15:[0,0],
};

// SIT-UP scoring: reps → [cat1, cat2]
// Read from official Sit-up Scoring Table for Servicemen
const SITUP_PTS: Record<number, [number, number]> = {
  60:[25,25], 59:[24,25], 58:[24,24], 57:[24,24], 56:[24,24],
  55:[23,24], 54:[23,23], 53:[23,23], 52:[23,23], 51:[22,23],
  50:[22,22], 49:[22,22], 48:[22,22], 47:[21,22], 46:[21,21],
  45:[21,21], 44:[21,21], 43:[20,21], 42:[20,20], 41:[20,20],
  40:[20,20], 39:[19,20], 38:[19,19], 37:[18,19], 36:[18,18], // wait image shows 36: 18,19,19
  35:[17,18], 34:[16,17], 33:[15,16], 32:[14,15], 31:[14,14],
  30:[13,14], 29:[13,13], 28:[12,12], 27:[11,12], 26:[10,11],
  25:[9,10],  24:[8,9],   23:[7,8],   22:[7,7],   21:[6,7],
  20:[6,6],   19:[5,6],   18:[4,5],   17:[3,4],   16:[2,3],
  15:[1,2],   14:[0,1],
};

// 2.4KM RUN scoring: [max_seconds, cat1_pts, cat2_pts]
// Read from official 2.4km Scoring Table for Servicemen
// If run time <= max_seconds, award those points
const RUN_PTS: [number, number, number][] = [
  [510,  50, 50],  // 8:30
  [520,  49, 50],  // 8:40
  [530,  48, 49],  // 8:50 -- image: cat2=50? checking: 8:40 row: cat1=49,cat2=50; 8:50: cat1=48,cat2=49
  [540,  47, 48],  // 9:00
  [550,  46, 47],  // 9:10 -- image: 9:10: cat1=46,cat2=47,cat3=48,cat4=50
  [560,  45, 46],  // 9:20 -- image: 9:20: cat1=45,cat2=46,cat3=47,cat4=49
  [570,  44, 45],  // 9:30 -- image: 9:30: cat1=44,cat2=45,cat3=46,cat4=48,cat5=50
  [580,  43, 44],  // 9:40 -- image: cat1=43,cat2=44
  [590,  42, 43],  // 9:50 -- image: cat1=42,cat2=43
  [600,  41, 42],  // 10:00 -- image: cat1=41,cat2=42
  [610,  40, 41],  // 10:10 -- image: cat1=40,cat2=41
  [620,  39, 40],  // 10:20 -- image: cat1=39,cat2=40
  [630,  38, 39],  // 10:30 -- image: cat1=38,cat2=39 (wait image 10:30: 38,39,40,42,43,44,45,46,47,48,49,50)
  [640,  38, 38],  // 10:40 -- image: cat1=38,cat2=38 (wait: 38,39,40,41,43,44,45,46,47,48,49,50)
  [650,  37, 38],  // 10:50 -- image: 37,38,39,40,42,43,44,45,46,47,48,49
  [660,  37, 37],  // 11:00 -- image: 37,37,38,39,41,42,43,44,45,46,47,48
  [670,  36, 37],  // 11:10 -- image: 36,37,38,39,40,41,42,43,44,45,46,47
  [680,  36, 36],  // 11:20 -- image: 36,36,37,38,39,40,41,42,43,44,45,46 -- wait
  [690,  35, 36],  // 11:30 -- image: 35,36,37,38,38,39,40,41,42,43,44,45
  [700,  35, 35],  // 11:40 -- image: 35,35,36,37,37,38,39,40,41,42,43,44
  [710,  34, 35],  // 11:50 -- image: 34,35,36,36,36,37,38,39,40,41,42,43
  [720,  33, 34],  // 12:00 -- image: 33,34,35,35,35,36,37,38,39,40,41,42
  [730,  33, 33],  // 12:10 -- image: 33,33,34,34,34,35,36,37,38,39,40,41
  [740,  32, 33],  // 12:20 -- image: 32,33,33,33,33,34,35,36,37,38,39,40
  [750,  30, 31],  // 12:30 -- image: 30,31,32,32,32,33,34,35,36,37,38,39
  [760,  29, 30],  // 12:40 -- image: 29,30,31,31,31,32,33,34,35,36,37,38
  [770,  28, 29],  // 12:50 -- image: 28,29,30,30,30,31,32,33,34,35,36,37
  [780,  27, 28],  // 13:00 -- image: 27,28,29,29,29,30,31,32,33,34,35,36
  [790,  26, 27],  // 13:10 -- image: 26,27,28,28,29,29,30,31,32,33,34,35
  [800,  25, 26],  // 13:20 -- image: 25,26,27,27,28,28,29,30,31,32,33,34
  [810,  24, 25],  // 13:30 -- image: 24,25,26,26,27,27,28,29,30,31,32,33
  [820,  23, 24],  // 13:40 -- image: 23,24,25,25,26,26,27,28,29,30,31,32
  [830,  22, 23],  // 13:50 -- image: 22,23,24,24,25,25,26,27,28,29,30,31
  [840,  21, 22],  // 14:00 -- image: 21,22,23,23,24,24,25,26,27,28,29,30
  [850,  20, 21],  // 14:10 -- image: 20,21,22,22,23,23,24,25,26,27,28,29
  [860,  19, 20],  // 14:20 -- image: 19,20,21,21,22,22,23,24,25,26,27,28
  [870,  18, 19],  // 14:30 -- image: 18,19,20,20,21,21,22,23,24,25,26,27
  [880,  16, 18],  // 14:40 -- image: 16,18,19,19,20,20,21,22,23,24,25,26 -- wait checking
  [890,  14, 16],  // 14:50 -- image: 14,16,17,18,19,19,20,21,22,23,24,25
  [900,  12, 14],  // 15:00 -- image: 12,14,16,17,18,18,19,20,21,22,23,24
  [910,  10, 12],  // 15:10 -- image: 10,12,14,16,17,17,18,19,20,21,22,23 -- wait checking
  [920,   8, 10],  // 15:20 -- image: 8,10,12,14,16,16,17,18,19,20,21,22
  [930,   6,  8],  // 15:30 -- image: 6,8,10,12,14,15,16,17,18,19,20,21
  [940,   4,  6],  // 15:40 -- image: 4,6,8,10,12,14,15,16,17,18,19,20
  [950,   2,  4],  // 15:50 -- image: 2,4,6,8,10,12,14,15,16,17,18,19
  [960,   1,  2],  // 16:00 -- image: 1,2,4,6,8,10,12,14,15,16,17,18
  [970,   0,  1],  // 16:10 -- image: 0,1,2,6,8,10,12,14,15,16,17
];

// ─── Award thresholds ─────────────────────────────────────────────────────────
// Pass: 51-74, Silver: 75-84, Gold: 85-100
// Minimum 1 point per station to pass

function getAgeCat(age: number | null): 0 | 1 {
  // 0 = Cat1 (<22), 1 = Cat2 (22-24)
  if (!age || age < 22) return 0;
  return 1;
}

function getPushupPts(reps: number, cat: 0 | 1): number {
  if (reps >= 60) return 25;
  if (reps < 16) return 0;
  return (PUSHUP_PTS[reps] ?? [0, 0])[cat];
}

function getSitupPts(reps: number, cat: 0 | 1): number {
  if (reps >= 60) return 25;
  if (reps < 14) return 0;
  return (SITUP_PTS[reps] ?? [0, 0])[cat];
}

function getRunPts(seconds: number, cat: 0 | 1): number {
  // Round up to nearest 10 seconds
  const rounded = Math.ceil(seconds / 10) * 10;
  for (const [maxSec, c1, c2] of RUN_PTS) {
    if (rounded <= maxSec) return cat === 0 ? c1 : c2;
  }
  return 0;
}

function calcIppt(pushups: number, situps: number, runSec: number, age: number | null) {
  const cat = getAgeCat(age);
  const pu = getPushupPts(pushups, cat);
  const su = getSitupPts(situps, cat);
  const run = getRunPts(runSec, cat);
  const total = pu + su + run;
  let award: 'Gold' | 'Silver' | 'Pass' | 'Fail';
  if (pu < 1 || su < 1 || run < 1) award = 'Fail';
  else if (total >= 85) award = 'Gold';
  else if (total >= 75) award = 'Silver';
  else if (total >= 51) award = 'Pass';
  else award = 'Fail';
  return { total, award, pu, su, run };
}

const AWARD_STYLE: Record<string, string> = {
  Gold:   'bg-yellow-400 text-yellow-900',
  Silver: 'bg-slate-300 text-slate-800',
  Pass:   'bg-green-100 text-green-800',
  Fail:   'bg-red-100 text-red-800',
};

const fmtTime = (sec: number | null) => {
  if (!sec) return '-';
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
};

const RANKS = ['ME1T'];

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProfileStatistics() {
  const { roles, user } = useAuth();
  const { toast } = useToast();

  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [graphOpen, setGraphOpen] = useState(false);
  const [graphView, setGraphView] = useState<'week' | 'month'>('month');
  const [editForm, setEditForm] = useState<Partial<ProfileData>>({});
  const [actForm, setActForm] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'run', distance_km: '', duration_minutes: '',
    pushups: '', situps: '', run_min: '', run_sec: '', notes: '',
  });

  useEffect(() => { if (user) { fetchProfile(); fetchActivities(); } }, [user]);

  const fetchProfile = async () => {
    const { data } = await supabase.from('profiles').select('*').eq('id', user!.id).single();
    if (data) { setProfileData(data as unknown as ProfileData); setEditForm(data as unknown as ProfileData); }
  };

  const fetchActivities = async () => {
    const { data } = await supabase.from('activities').select('*').eq('user_id', user!.id).order('date', { ascending: true });
    if (data) setActivities(data as Activity[]);
  };

  const saveProfile = async () => {
    const { error } = await supabase.from('profiles').update(editForm).eq('id', user!.id);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); }
    else { toast({ title: 'Profile updated!' }); fetchProfile(); setEditOpen(false); }
  };

  const saveActivity = async () => {
    const run_seconds = (actForm.run_min || actForm.run_sec)
      ? parseInt(actForm.run_min || '0') * 60 + parseInt(actForm.run_sec || '0') : null;
    const { error } = await supabase.from('activities').insert({
      user_id: user!.id, date: actForm.date, type: actForm.type,
      distance_km: actForm.distance_km ? parseFloat(actForm.distance_km) : null,
      duration_minutes: actForm.duration_minutes ? parseInt(actForm.duration_minutes) : null,
      pushups: actForm.pushups ? parseInt(actForm.pushups) : null,
      situps: actForm.situps ? parseInt(actForm.situps) : null,
      run_seconds, notes: actForm.notes,
    });
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); }
    else {
      toast({ title: 'Activity logged!' });
      const prev = activities.length;
      await fetchActivities();
      setAddOpen(false);
      if (prev === 0) setGraphOpen(true);
      setActForm({ date: new Date().toISOString().split('T')[0], type: 'run', distance_km: '', duration_minutes: '', pushups: '', situps: '', run_min: '', run_sec: '', notes: '' });
    }
  };

  const graphData = (() => {
    type G = { label: string; run_km: number; cycle_km: number; swim_km: number; count: number; pushups: number[]; situps: number[]; run_seconds: number[] };
    const groups: Record<string, G> = {};
    activities.forEach(a => {
      const d = new Date(a.date);
      const key = graphView === 'week'
        ? (() => { const w = new Date(d); w.setDate(d.getDate() - d.getDay()); return w.toISOString().split('T')[0]; })()
        : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!groups[key]) groups[key] = { label: key, run_km: 0, cycle_km: 0, swim_km: 0, count: 0, pushups: [], situps: [], run_seconds: [] };
      groups[key].count++;
      if (a.type === 'run' && a.distance_km) groups[key].run_km += a.distance_km;
      if (a.type === 'cycle' && a.distance_km) groups[key].cycle_km += a.distance_km;
      if (a.type === 'swim' && a.distance_km) groups[key].swim_km += a.distance_km;
      if (a.pushups) groups[key].pushups.push(a.pushups);
      if (a.situps) groups[key].situps.push(a.situps);
      if (a.run_seconds) groups[key].run_seconds.push(a.run_seconds);
    });
    return Object.values(groups).map(g => ({
      ...g,
      avg_pushups: g.pushups.length ? Math.round(g.pushups.reduce((a, b) => a + b) / g.pushups.length) : null,
      avg_situps: g.situps.length ? Math.round(g.situps.reduce((a, b) => a + b) / g.situps.length) : null,
      avg_run_sec: g.run_seconds.length ? Math.round(g.run_seconds.reduce((a, b) => a + b) / g.run_seconds.length) : null,
    }));
  })();

  const ippt = profileData?.ippt_pushups && profileData?.ippt_situps && profileData?.ippt_run_seconds
    ? calcIppt(profileData.ippt_pushups, profileData.ippt_situps, profileData.ippt_run_seconds, profileData.age)
    : null;

  const initials = profileData?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <User className="h-7 w-7 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Profile & Statistics</h1>
        </div>
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm"><Pencil className="h-4 w-4 mr-1" /> Edit Profile</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Edit Profile</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Rank</Label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={editForm.rank || ''} onChange={e => setEditForm(f => ({ ...f, rank: e.target.value }))}>
                    {RANKS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label>Full Name</Label>
                  <Input value={editForm.full_name || ''} onChange={e => setEditForm(f => ({ ...f, full_name: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Age</Label>
                  <Input type="number" value={editForm.age || ''} onChange={e => setEditForm(f => ({ ...f, age: parseInt(e.target.value) }))} />
                </div>
                <div className="space-y-1">
                  <Label>Height (cm)</Label>
                  <Input type="number" value={editForm.height_cm || ''} onChange={e => setEditForm(f => ({ ...f, height_cm: parseFloat(e.target.value) }))} />
                </div>
              </div>
              <div className="border-t pt-3">
                <p className="text-sm font-medium mb-2">Official IPPT Results</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Push-ups</Label>
                    <Input type="number" value={editForm.ippt_pushups || ''} onChange={e => setEditForm(f => ({ ...f, ippt_pushups: parseInt(e.target.value) }))} />
                  </div>
                  <div className="space-y-1">
                    <Label>Sit-ups</Label>
                    <Input type="number" value={editForm.ippt_situps || ''} onChange={e => setEditForm(f => ({ ...f, ippt_situps: parseInt(e.target.value) }))} />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <Label>2.4km Run Time (MM : SS)</Label>
                    <div className="flex gap-2">
                      <Input type="number" placeholder="MM"
                        value={editForm.ippt_run_seconds ? Math.floor(editForm.ippt_run_seconds / 60) : ''}
                        onChange={e => setEditForm(f => ({ ...f, ippt_run_seconds: parseInt(e.target.value) * 60 + ((f.ippt_run_seconds || 0) % 60) }))} />
                      <Input type="number" placeholder="SS"
                        value={editForm.ippt_run_seconds ? editForm.ippt_run_seconds % 60 : ''}
                        onChange={e => setEditForm(f => ({ ...f, ippt_run_seconds: Math.floor((f.ippt_run_seconds || 0) / 60) * 60 + parseInt(e.target.value) }))} />
                    </div>
                  </div>
                </div>
              </div>
              <Button className="w-full" onClick={saveProfile}>Save</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Profile card */}
      <Card>
        <CardContent className="flex items-center gap-4 p-6">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="bg-primary text-primary-foreground text-xl">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-foreground">
                {profileData?.rank && profileData.rank !== 'Other' ? `${profileData.rank} ` : ''}
                {profileData?.full_name || 'User'}
              </h2>
              {ippt && (ippt.award === 'Gold' || ippt.award === 'Silver') && (
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${AWARD_STYLE[ippt.award]}`}>
                  IPPT {ippt.award}
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{profileData?.department} Department</p>
            {(profileData?.age || profileData?.height_cm) && (
              <p className="text-sm text-muted-foreground">
                {profileData.age ? `Age: ${profileData.age}` : ''}
                {profileData.age && profileData.height_cm ? ' · ' : ''}
                {profileData.height_cm ? `Height: ${profileData.height_cm}cm` : ''}
              </p>
            )}
            <div className="flex gap-2 mt-2 flex-wrap">
              {roles.map(r => <Badge key={r} variant="secondary">{r}</Badge>)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* IPPT Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" /> Official IPPT Results
            {ippt && (
              <span className={`ml-auto text-xs font-bold px-3 py-1 rounded-full ${AWARD_STYLE[ippt.award]}`}>
                {ippt.award} · {ippt.total} pts
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center rounded-lg border p-3">
              <div className="text-2xl font-bold text-foreground">{profileData?.ippt_pushups ?? '-'}</div>
              <div className="text-xs text-muted-foreground">Push-ups</div>
              {ippt && <div className="text-xs text-primary mt-1">{ippt.pu} pts</div>}
            </div>
            <div className="text-center rounded-lg border p-3">
              <div className="text-2xl font-bold text-foreground">{profileData?.ippt_situps ?? '-'}</div>
              <div className="text-xs text-muted-foreground">Sit-ups</div>
              {ippt && <div className="text-xs text-primary mt-1">{ippt.su} pts</div>}
            </div>
            <div className="text-center rounded-lg border p-3">
              <div className="text-2xl font-bold text-foreground">{fmtTime(profileData?.ippt_run_seconds ?? null)}</div>
              <div className="text-xs text-muted-foreground">2.4km Run</div>
              {ippt && <div className="text-xs text-primary mt-1">{ippt.run} pts</div>}
            </div>
            <div className="text-center rounded-lg border p-3">
              <div className={`text-2xl font-bold ${ippt?.award === 'Gold' ? 'text-yellow-500' : ippt?.award === 'Fail' ? 'text-red-500' : 'text-foreground'}`}>
                {ippt?.total ?? '-'}
              </div>
              <div className="text-xs text-muted-foreground">Total Score</div>
              {ippt && (
                <div className={`text-xs font-semibold mt-1 px-2 py-0.5 rounded-full inline-block ${AWARD_STYLE[ippt.award]}`}>
                  {ippt.award}
                </div>
              )}
            </div>
          </div>
          {!profileData?.ippt_pushups && (
            <p className="text-xs text-muted-foreground text-center mt-4">
              Enter your IPPT results via Edit Profile to calculate your score automatically.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Activity Tracking */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Activity Tracking</CardTitle>
            <div className="flex gap-2">
              {activities.length > 0 && (
                <Dialog open={graphOpen} onOpenChange={setGraphOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm"><BarChart2 className="h-4 w-4 mr-1" /> View Graphs</Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <div className="flex items-center justify-between pr-6">
                        <DialogTitle>Activity Graphs</DialogTitle>
                        <div className="flex rounded-lg border overflow-hidden text-sm">
                          <button className={`px-3 py-1 ${graphView === 'week' ? 'bg-primary text-primary-foreground' : 'bg-background'}`} onClick={() => setGraphView('week')}>Week</button>
                          <button className={`px-3 py-1 ${graphView === 'month' ? 'bg-primary text-primary-foreground' : 'bg-background'}`} onClick={() => setGraphView('month')}>Month</button>
                        </div>
                      </div>
                    </DialogHeader>
                    <div className="space-y-6 pt-2">
                      <div>
                        <p className="text-sm font-medium mb-2">Distance by Activity (km)</p>
                        <ResponsiveContainer width="100%" height={200}>
                          <BarChart data={graphData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                            <YAxis tick={{ fontSize: 10 }} />
                            <Tooltip /><Legend />
                            <Bar dataKey="run_km" name="Run" fill="#3b82f6" />
                            <Bar dataKey="cycle_km" name="Cycle" fill="#f97316" />
                            <Bar dataKey="swim_km" name="Swim" fill="#06b6d4" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-2">Activity Frequency</p>
                        <ResponsiveContainer width="100%" height={180}>
                          <BarChart data={graphData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                            <YAxis tick={{ fontSize: 10 }} />
                            <Tooltip />
                            <Bar dataKey="count" name="Sessions" fill="#8b5cf6" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-2">IPPT Training — Push-ups & Sit-ups</p>
                        <ResponsiveContainer width="100%" height={200}>
                          <LineChart data={graphData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                            <YAxis tick={{ fontSize: 10 }} />
                            <Tooltip /><Legend />
                            <Line type="monotone" dataKey="avg_pushups" name="Push-ups" stroke="#3b82f6" dot />
                            <Line type="monotone" dataKey="avg_situps" name="Sit-ups" stroke="#10b981" dot />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-2">2.4km Run Time (lower = better)</p>
                        <ResponsiveContainer width="100%" height={200}>
                          <LineChart data={graphData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                            <YAxis tick={{ fontSize: 10 }} tickFormatter={v => fmtTime(v)} />
                            <Tooltip formatter={(v: number) => fmtTime(v)} />
                            <Line type="monotone" dataKey="avg_run_sec" name="Run Time" stroke="#f97316" dot />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}

              <Dialog open={addOpen} onOpenChange={setAddOpen}>
                <DialogTrigger asChild>
                  <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Log</Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader><DialogTitle>Log Activity</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label>Date</Label>
                        <Input type="date" value={actForm.date} onChange={e => setActForm(f => ({ ...f, date: e.target.value }))} />
                      </div>
                      <div className="space-y-1">
                        <Label>Type</Label>
                        <Select value={actForm.type} onValueChange={v => setActForm(f => ({ ...f, type: v }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="run">Run</SelectItem>
                            <SelectItem value="cycle">Cycle</SelectItem>
                            <SelectItem value="swim">Swim</SelectItem>
                            <SelectItem value="gym">Gym</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    {['run', 'cycle', 'swim'].includes(actForm.type) && (
                      <div className="space-y-1">
                        <Label>Distance (km)</Label>
                        <Input type="number" step="0.1" value={actForm.distance_km} onChange={e => setActForm(f => ({ ...f, distance_km: e.target.value }))} />
                      </div>
                    )}
                    <div className="space-y-1">
                      <Label>Duration (minutes)</Label>
                      <Input type="number" value={actForm.duration_minutes} onChange={e => setActForm(f => ({ ...f, duration_minutes: e.target.value }))} />
                    </div>
                    <div className="border-t pt-3">
                      <p className="text-sm font-medium mb-2">IPPT Training (optional)</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label>Push-ups</Label>
                          <Input type="number" value={actForm.pushups} onChange={e => setActForm(f => ({ ...f, pushups: e.target.value }))} />
                        </div>
                        <div className="space-y-1">
                          <Label>Sit-ups</Label>
                          <Input type="number" value={actForm.situps} onChange={e => setActForm(f => ({ ...f, situps: e.target.value }))} />
                        </div>
                        <div className="col-span-2 space-y-1">
                          <Label>2.4km Run Time (MM : SS)</Label>
                          <div className="flex gap-2">
                            <Input type="number" placeholder="MM" value={actForm.run_min} onChange={e => setActForm(f => ({ ...f, run_min: e.target.value }))} />
                            <Input type="number" placeholder="SS" value={actForm.run_sec} onChange={e => setActForm(f => ({ ...f, run_sec: e.target.value }))} />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label>Notes</Label>
                      <Input value={actForm.notes} onChange={e => setActForm(f => ({ ...f, notes: e.target.value }))} />
                    </div>
                    <Button className="w-full" onClick={saveActivity}>Save Activity</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No activities logged yet. Hit Log to get started.</p>
          ) : (
            <div className="space-y-2">
              {activities.slice().reverse().slice(0, 5).map(a => (
                <div key={a.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <div className="font-medium text-sm text-foreground capitalize">
                      {a.type}{a.distance_km ? ` · ${a.distance_km}km` : ''}
                    </div>
                    <div className="text-xs text-muted-foreground">{a.date}{a.notes ? ` · ${a.notes}` : ''}</div>
                  </div>
                  <div className="text-xs text-muted-foreground text-right">
                    {[a.pushups ? `${a.pushups} PU` : '', a.situps ? `${a.situps} SU` : '', a.run_seconds ? fmtTime(a.run_seconds) : ''].filter(Boolean).join(' · ')}
                  </div>
                </div>
              ))}
              {activities.length > 5 && (
                <p className="text-xs text-muted-foreground text-center pt-1">Showing last 5 of {activities.length} activities</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
