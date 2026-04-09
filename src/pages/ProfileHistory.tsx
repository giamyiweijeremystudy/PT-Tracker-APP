import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { User, Trophy, Timer, Dumbbell, Plus, Pencil } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

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

const formatTime = (seconds: number | null) => {
  if (!seconds) return '-';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const RANKS = ['ME1T'];

export default function Profile() {
  const { profile, roles, user } = useAuth();
  const { toast } = useToast();
  const initials = profile?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';

  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
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
    const run_seconds = activityForm.run_seconds_min || activityForm.run_seconds_sec
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
      fetchActivities();
      setAddOpen(false);
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

  // Build graph data grouped by week or month
  const graphData = (() => {
    const groups: Record<string, { label: string; run_km: number; cycle_km: number; swim_km: number; count: number; pushups: number[]; situps: number[]; run_seconds: number[] }> = {};

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

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <User className="h-7 w-7 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Profile</h1>
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
                    <Label>IPPT Score</Label>
                    <Input type="number" value={editForm.ippt_score || ''} onChange={e => setEditForm(f => ({ ...f, ippt_score: parseInt(e.target.value) }))} />
                  </div>
                  <div className="space-y-1">
                    <Label>Push-ups</Label>
                    <Input type="number" value={editForm.ippt_pushups || ''} onChange={e => setEditForm(f => ({ ...f, ippt_pushups: parseInt(e.target.value) }))} />
                  </div>
                  <div className="space-y-1">
                    <Label>Sit-ups</Label>
                    <Input type="number" value={editForm.ippt_situps || ''} onChange={e => setEditForm(f => ({ ...f, ippt_situps: parseInt(e.target.value) }))} />
                  </div>
                  <div className="space-y-1">
                    <Label>Run (MM:SS)</Label>
                    <div className="flex gap-1">
                      <Input type="number" placeholder="MM" value={editForm.ippt_run_seconds ? Math.floor(editForm.ippt_run_seconds / 60) : ''} onChange={e => setEditForm(f => ({ ...f, ippt_run_seconds: parseInt(e.target.value) * 60 + ((f.ippt_run_seconds || 0) % 60) }))} />
                      <Input type="number" placeholder="SS" value={editForm.ippt_run_seconds ? editForm.ippt_run_seconds % 60 : ''} onChange={e => setEditForm(f => ({ ...f, ippt_run_seconds: Math.floor((f.ippt_run_seconds || 0) / 60) * 60 + parseInt(e.target.value) }))} />
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
            <h2 className="text-xl font-bold text-foreground">
              {profileData?.rank && profileData.rank !== 'Other' ? `${profileData.rank} ` : ''}{profileData?.full_name || 'User'}
            </h2>
            <p className="text-sm text-muted-foreground">{profileData?.department} Department</p>
            {(profileData?.age || profileData?.height_cm) && (
              <p className="text-sm text-muted-foreground">
                {profileData.age ? `Age: ${profileData.age}` : ''}{profileData.age && profileData.height_cm ? ' · ' : ''}{profileData.height_cm ? `Height: ${profileData.height_cm}cm` : ''}
              </p>
            )}
            <div className="flex gap-2 mt-2">
              {roles.map(r => <Badge key={r} variant="secondary">{r}</Badge>)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Official IPPT stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Trophy className="h-5 w-5 text-yellow-500" /> Official IPPT Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">{profileData?.ippt_score ?? '-'}</div>
              <div className="text-xs text-muted-foreground">Score</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">{profileData?.ippt_pushups ?? '-'}</div>
              <div className="text-xs text-muted-foreground">Push-ups</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">{profileData?.ippt_situps ?? '-'}</div>
              <div className="text-xs text-muted-foreground">Sit-ups</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">{formatTime(profileData?.ippt_run_seconds ?? null)}</div>
              <div className="text-xs text-muted-foreground">2.4km Run</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity graphs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Activity Tracking</CardTitle>
            <div className="flex items-center gap-2">
              <div className="flex rounded-lg border overflow-hidden text-sm">
                <button className={`px-3 py-1 ${graphView === 'week' ? 'bg-primary text-primary-foreground' : 'bg-background'}`} onClick={() => setGraphView('week')}>Week</button>
                <button className={`px-3 py-1 ${graphView === 'month' ? 'bg-primary text-primary-foreground' : 'bg-background'}`} onClick={() => setGraphView('month')}>Month</button>
              </div>
              <Dialog open={addOpen} onOpenChange={setAddOpen}>
                <DialogTrigger asChild>
                  <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Log Activity</Button>
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
        <CardContent className="space-y-6">
          {graphData.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No activities logged yet. Hit the + button to get started.</p>
          ) : (
            <>
              <div>
                <p className="text-sm font-medium mb-2">Distance by Activity (km)</p>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={graphData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
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
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={graphData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" name="Activities" fill="#8b5cf6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">IPPT Training Progress</p>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={graphData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="avg_pushups" name="Push-ups" stroke="#3b82f6" dot />
                    <Line type="monotone" dataKey="avg_situps" name="Sit-ups" stroke="#10b981" dot />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">2.4km Run Time (seconds, lower is better)</p>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={graphData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: number) => formatTime(v)} />
                    <Line type="monotone" dataKey="avg_run_sec" name="Run Time" stroke="#f97316" dot />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
