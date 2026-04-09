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
// Age Cat 1 = <22, Age Cat 2 = 22-24
// Sit-up scores (reps → points) for age cat 1 and 2
const SITUP_TABLE: Record<number, [number, number]> = {
  60:[25,25],59:[24,25],58:[24,24],57:[24,24],56:[23,24],55:[23,23],
  54:[23,23],53:[23,23],52:[22,23],51:[22,22],50:[22,22],49:[22,22],
  48:[21,22],47:[21,21],46:[21,21],45:[21,21],44:[21,21],43:[20,21],
  42:[20,20],41:[20,20],40:[20,20],39:[19,20],38:[19,19],37:[19,19],
  36:[18,18],35:[17,18],34:[16,17],33:[15,16],32:[14,15],31:[14,14],
  30:[13,14],29:[13,13],28:[12,13],27:[11,12],26:[10,12],25:[9,10],
  24:[8,9],23:[7,8],22:[7,7],21:[6,7],20:[6,6],19:[5,6],18:[4,5],
  17:[3,4],16:[2,4],15:[1,2],14:[0,1],
};

// Push-up scores (reps → points) for age cat 1 and 2
const PUSHUP_TABLE: Record<number, [number, number]> = {
  60:[25,25],59:[25,25],58:[24,24],57:[24,24],56:[23,24],55:[23,23],
  54:[23,23],53:[23,23],52:[23,23],51:[22,22],50:[22,22],49:[22,22],
  48:[21,22],47:[21,21],46:[21,21],45:[21,21],44:[20,21],43:[20,20],
  42:[20,20],41:[20,20],40:[20,20],39:[19,20],38:[19,19],37:[18,19],
  36:[18,18],35:[18,18],34:[17,18],33:[17,17],32:[17,17],31:[16,17],
  30:[16,16],29:[16,16],28:[15,16],27:[15,15],26:[15,15],25:[14,15],
  24:[13,14],23:[13,13],22:[11,12],21:[10,12],20:[9,10],19:[8,9],
  18:[6,8],17:[4,6],16:[2,4],15:[1,2],14:[0,1],
};

// Run scores (seconds → points) for age cat 1 and 2
const RUN_TABLE: [number, number, number][] = [
  // [seconds, cat1_pts, cat2_pts]
  [510,50,50],[520,49,50],[530,48,49],[540,46,48],[550,44,46],
  [560,42,43],[570,41,42],[580,40,41],[590,39,40],[600,39,40],
  [610,38,39],[620,37,38],[630,36,37],[640,36,36],[650,35,36],
  [660,35,35],[670,34,35],[680,33,34],[690,32,33],[700,32,33],
  [710,31,32],[720,30,31],[730,29,30],[740,29,30],[750,29,29],
  [760,27,28],[770,26,27],[780,25,26],[790,24,25],[800,23,24],
  [810,22,23],[820,21,22],[830,19,20],[840,18,19],[850,18,19],
  [860,17,18],[870,16,17],[880,14,16],[890,12,14],[900,11,12],
  [910,10,11],[920,8,9],[930,6,8],[940,4,6],[950,2,4],[960,1,2],
];

function getAgeCategory(age: number | null): 1 | 2 {
  if (!age || age < 22) return 1;
  if (age <= 24) return 2;
  return 2; // default to cat 2 for older — extend table if needed
}

function getSitupPoints(reps: number, ageCat: 1 | 2): number {
  const entry = SITUP_TABLE[reps];
  if (!entry) return reps > 60 ? 25 : 0;
  return entry[ageCat - 1];
}

function getPushupPoints(reps: number, ageCat: 1 | 2): number {
  const entry = PUSHUP_TABLE[reps];
  if (!entry) return reps > 60 ? 25 : 0;
  return entry[ageCat - 1];
}

function getRunPoints(seconds: number, ageCat: 1 | 2): number {
  // Find the bracket — run table is sorted ascending by time
  for (let i = RUN_TABLE.length - 1; i >= 0; i--) {
    if (seconds <= RUN_TABLE[i][0]) {
      return RUN_TABLE[i][ageCat === 1 ? 1 : 2];
    }
  }
  return 0;
}

function calcIpptScore(pushups: number, situps: number, runSec: number, age: number | null) {
  const cat = getAgeCategory(age);
  const pu = getPushupPoints(pushups, cat);
  const su = getSitupPoints(situps, cat);
  const run = getRunPoints(runSec, cat);
  const total = pu + su + run;
  // Must have min 1 pt per station
  if (pu < 1 || su < 1 || run < 1) return { total, award: 'Fail' as const, pu, su, run };
  if (total >= 85) return { total, award: 'Gold' as const, pu, su, run };
  if (total >= 75) return { total, award: 'Silver' as const, pu, su, run };
  if (total >= 61) return { total, award: 'Pass' as const, pu, su, run };
  return { total, award: 'Fail' as const, pu, su, run };
}

const AWARD_STYLES: Record<string, string> = {
  Gold: 'bg-yellow-400 text-yellow-900',
  Silver: 'bg-slate-300 text-slate-800',
  Pass: 'bg-green-100 text-green-800',
  Fail: 'bg-red-100 text-red-800',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatTime = (seconds: number | null) => {
  if (!seconds) return '-';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
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
  const [activityForm, setActivityForm] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'run',
    distance_km: '',
    duration_minutes: '',
    pushups: '',
    situps: '',
    run_seconds_min: '',
    run_seconds_sec: '',
    notes: '',
  });

  useEffect(() => {
    if (!user) return;
    fetchProfile();
    fetchActivities();
  }, [user]);

  const fetchProfile = async () => {
    const { data } = await supabase.from('profiles').select('*').eq('id', user!.id).single();
    if (data) {
      setProfileData(data as unknown as ProfileData);
      setEditForm(data as unknown as ProfileData);
    }
  };

  const fetchActivities = async () => {
    const { data } = await supabase
      .from('activities')
      .select('*')
      .eq('user_id', user!.id)
      .order('date', { ascending: true });
    if (data) setActivities(data as Activity[]);
  };

  const saveProfile = async () => {
    const { error } = await supabase.from('profiles').update(editForm).eq('id', user!.id);
    if (error) {
      toast({ title: 'Error saving profile', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Profile updated!' });
      fetchProfile();
      setEditOpen(false);
    }
  };

  const saveActivity = async () => {
    const run_seconds =
      activityForm.run_seconds_min || activityForm.run_seconds_sec
        ? parseInt(activityForm.run_seconds_min || '0') * 60 + parseInt(activityForm.run_seconds_sec || '0')
        : null;

    const { error } = await supabase.from('activities').insert({
      user_id: user!.id,
      date: activityForm.date,
      type: activityForm.type,
      distance_km: activityForm.distance_km ? parseFloat(activityForm.distance_km) : null,
      duration_minutes: activityForm.duration_minutes ? parseInt(activityForm.duration_minutes) : null,
      pushups: activityForm.pushups ? parseInt(activityForm.pushups) : null,
      situps: activityForm.situps ? parseInt(activityForm.situps) : null,
      run_seconds,
      notes: activityForm.notes,
    });

    if (error) {
      toast({ title: 'Error saving activity', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Activity logged!' });
      await fetchActivities();
      setAddOpen(false);
      // If first activity, open graph view
      if (activities.length === 0) setGraphOpen(true);
      setActivityForm({
        date: new Date().toISOString().split('T')[0],
        type: 'run',
        distance_km: '',
        duration_minutes: '',
        pushups: '',
        situps: '',
        run_seconds_min: '',
        run_seconds_sec: '',
        notes: '',
      });
    }
  };

  // ── Graph data ────────────────────────────────────────────────────────────

  const graphData = (() => {
    const groups: Record<string, {
      label: string; run_km: number; cycle_km: number; swim_km: number;
      count: number; pushups: number[]; situps: number[]; run_seconds: number[];
    }> = {};

    activities.forEach(a => {
      const d = new Date(a.date);
      let key: string;
      if (graphView === 'week') {
        const weekStart = new Date(d);
        weekStart.setDate(d.getDate() - d.getDay());
        key = weekStart.toISOString().split('T')[0];
      } else {
        key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      }
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

  // ── Derived IPPT award ────────────────────────────────────────────────────

  const ipptResult = profileData?.ippt_pushups && profileData?.ippt_situps && profileData?.ippt_run_seconds
    ? calcIpptScore(profileData.ippt_pushups, profileData.ippt_situps, profileData.ippt_run_seconds, profileData.age)
    : null;

  const initials = profileData?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';

  // ── Render ────────────────────────────────────────────────────────────────

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
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={editForm.rank || ''}
                    onChange={e => setEditForm(f => ({ ...f, rank: e.target.value }))}
                  >
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
                    <Label>2.4km Run Time (MM:SS)</Label>
                    <div className="flex gap-2">
                      <Input
                        type="number" placeholder="MM"
                        value={editForm.ippt_run_seconds ? Math.floor(editForm.ippt_run_seconds / 60) : ''}
                        onChange={e => setEditForm(f => ({ ...f, ippt_run_seconds: parseInt(e.target.value) * 60 + ((f.ippt_run_seconds || 0) % 60) }))}
                      />
                      <Input
                        type="number" placeholder="SS"
                        value={editForm.ippt_run_seconds ? editForm.ippt_run_seconds % 60 : ''}
                        onChange={e => setEditForm(f => ({ ...f, ippt_run_seconds: Math.floor((f.ippt_run_seconds || 0) / 60) * 60 + parseInt(e.target.value) }))}
                      />
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
              {ipptResult && ipptResult.award !== 'Fail' && ipptResult.award !== 'Pass' && (
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${AWARD_STYLES[ipptResult.award]}`}>
                  IPPT {ipptResult.award}
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

      {/* Official IPPT stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" /> Official IPPT Results
            {ipptResult && (
              <span className={`ml-auto text-xs font-bold px-3 py-1 rounded-full ${AWARD_STYLES[ipptResult.award]}`}>
                {ipptResult.award} · {ipptResult.total} pts
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center rounded-lg border p-3">
              <div className="text-2xl font-bold text-foreground">{profileData?.ippt_pushups ?? '-'}</div>
              <div className="text-xs text-muted-foreground">Push-ups</div>
              {ipptResult && <div className="text-xs text-primary mt-1">{ipptResult.pu} pts</div>}
            </div>
            <div className="text-center rounded-lg border p-3">
              <div className="text-2xl font-bold text-foreground">{profileData?.ippt_situps ?? '-'}</div>
              <div className="text-xs text-muted-foreground">Sit-ups</div>
              {ipptResult && <div className="text-xs text-primary mt-1">{ipptResult.su} pts</div>}
            </div>
            <div className="text-center rounded-lg border p-3">
              <div className="text-2xl font-bold text-foreground">{formatTime(profileData?.ippt_run_seconds ?? null)}</div>
              <div className="text-xs text-muted-foreground">2.4km Run</div>
              {ipptResult && <div className="text-xs text-primary mt-1">{ipptResult.run} pts</div>}
            </div>
            <div className="text-center rounded-lg border p-3">
              <div className={`text-2xl font-bold ${ipptResult ? (ipptResult.award === 'Fail' ? 'text-red-500' : ipptResult.award === 'Gold' ? 'text-yellow-500' : 'text-foreground') : 'text-foreground'}`}>
                {ipptResult ? ipptResult.total : '-'}
              </div>
              <div className="text-xs text-muted-foreground">Total Score</div>
              {ipptResult && <div className={`text-xs font-semibold mt-1 ${AWARD_STYLES[ipptResult.award].split(' ')[1]}`}>{ipptResult.award}</div>}
            </div>
          </div>
          {!profileData?.ippt_pushups && (
            <p className="text-xs text-muted-foreground text-center mt-4">Enter your IPPT results via Edit Profile to see your score calculated automatically.</p>
          )}
        </CardContent>
      </Card>

      {/* Activity Tracking */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Activity Tracking</CardTitle>
            <div className="flex gap-2">
              {/* Graph button — only show if activities exist */}
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
                            <Tooltip />
                            <Legend />
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
                            <Tooltip />
                            <Legend />
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
                            <YAxis tick={{ fontSize: 10 }} tickFormatter={v => formatTime(v)} />
                            <Tooltip formatter={(v: number) => formatTime(v)} />
                            <Line type="monotone" dataKey="avg_run_sec" name="Run Time" stroke="#f97316" dot />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}

              {/* Log activity */}
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
                        <Input type="date" value={activityForm.date} onChange={e => setActivityForm(f => ({ ...f, date: e.target.value }))} />
                      </div>
                      <div className="space-y-1">
                        <Label>Type</Label>
                        <Select value={activityForm.type} onValueChange={v => setActivityForm(f => ({ ...f, type: v }))}>
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
                    {['run', 'cycle', 'swim'].includes(activityForm.type) && (
                      <div className="space-y-1">
                        <Label>Distance (km)</Label>
                        <Input type="number" step="0.1" value={activityForm.distance_km} onChange={e => setActivityForm(f => ({ ...f, distance_km: e.target.value }))} />
                      </div>
                    )}
                    <div className="space-y-1">
                      <Label>Duration (minutes)</Label>
                      <Input type="number" value={activityForm.duration_minutes} onChange={e => setActivityForm(f => ({ ...f, duration_minutes: e.target.value }))} />
                    </div>
                    <div className="border-t pt-3">
                      <p className="text-sm font-medium mb-2">IPPT Training (optional)</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label>Push-ups</Label>
                          <Input type="number" value={activityForm.pushups} onChange={e => setActivityForm(f => ({ ...f, pushups: e.target.value }))} />
                        </div>
                        <div className="space-y-1">
                          <Label>Sit-ups</Label>
                          <Input type="number" value={activityForm.situps} onChange={e => setActivityForm(f => ({ ...f, situps: e.target.value }))} />
                        </div>
                        <div className="col-span-2 space-y-1">
                          <Label>2.4km Run Time (MM:SS)</Label>
                          <div className="flex gap-2">
                            <Input type="number" placeholder="MM" value={activityForm.run_seconds_min} onChange={e => setActivityForm(f => ({ ...f, run_seconds_min: e.target.value }))} />
                            <Input type="number" placeholder="SS" value={activityForm.run_seconds_sec} onChange={e => setActivityForm(f => ({ ...f, run_seconds_sec: e.target.value }))} />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label>Notes</Label>
                      <Input value={activityForm.notes} onChange={e => setActivityForm(f => ({ ...f, notes: e.target.value }))} />
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
                    <div className="font-medium text-sm text-foreground capitalize">{a.type}{a.distance_km ? ` · ${a.distance_km}km` : ''}</div>
                    <div className="text-xs text-muted-foreground">{a.date}{a.notes ? ` · ${a.notes}` : ''}</div>
                  </div>
                  <div className="text-xs text-muted-foreground text-right">
                    {a.pushups ? `${a.pushups} PU` : ''}
                    {a.situps ? ` · ${a.situps} SU` : ''}
                    {a.run_seconds ? ` · ${formatTime(a.run_seconds)}` : ''}
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
