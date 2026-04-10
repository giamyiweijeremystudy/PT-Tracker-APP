import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Activity, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

// ─── Activity type definitions ────────────────────────────────────────────────

type ActivityType =
  | 'running' | 'jogging' | 'walking'
  | 'swimming' | 'cycling'
  | 'ippt_training' | 'gym' | 'strength_training' | 'calisthenics'
  | 'others';

const ACTIVITY_TYPES: { value: ActivityType; label: string; emoji: string }[] = [
  { value: 'running',          label: 'Running',          emoji: '🏃' },
  { value: 'swimming',         label: 'Swimming',         emoji: '🏊' },
  { value: 'ippt_training',    label: 'IPPT Training',    emoji: '🪖' },
  { value: 'gym',              label: 'Gym',              emoji: '🏋️' },
  { value: 'cycling',          label: 'Cycling',          emoji: '🚴' },
  { value: 'strength_training',label: 'Strength Training',emoji: '💪' },
  { value: 'calisthenics',     label: 'Calisthenics',     emoji: '🤸' },
  { value: 'walking',          label: 'Walking',          emoji: '🚶' },
  { value: 'jogging',          label: 'Jogging',          emoji: '👟' },
  { value: 'others',           label: 'Others',           emoji: '➕' },
];

// Which types use distance
const DISTANCE_TYPES: ActivityType[] = ['running', 'jogging', 'walking', 'swimming', 'cycling'];
// Which types use IPPT fields
const IPPT_TYPES: ActivityType[] = ['ippt_training'];
// Which types use sets/reps/weight
const GYM_TYPES: ActivityType[] = ['gym', 'strength_training', 'calisthenics'];
// Which types use pool length + laps
const SWIM_TYPES: ActivityType[] = ['swimming'];

type SavedActivity = {
  id: string;
  user_id: string;
  date: string;
  type: string;
  title: string | null;
  custom_type: string | null;
  duration_minutes: number | null;
  distance_km: number | null;
  pace_per_km: number | null;
  laps: number | null;
  pool_length_m: number | null;
  pushups: number | null;
  situps: number | null;
  run_seconds: number | null;
  sets: number | null;
  reps: number | null;
  weight_kg: number | null;
  description: string | null;
  created_at: string;
};

const fmtTime = (sec: number | null) => {
  if (!sec) return '—';
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
};

function typeLabel(a: SavedActivity): string {
  if (a.type === 'others' && a.custom_type) return a.custom_type;
  return ACTIVITY_TYPES.find(t => t.value === a.type)?.label ?? a.type;
}

function typeEmoji(a: SavedActivity): string {
  if (a.type === 'others') return '➕';
  return ACTIVITY_TYPES.find(t => t.value === a.type)?.emoji ?? '🏃';
}

function activitySummary(a: SavedActivity): string {
  const parts: string[] = [];
  if (a.duration_minutes) parts.push(`${a.duration_minutes} min`);
  if (a.distance_km) parts.push(`${a.distance_km} km`);
  if (a.pace_per_km) parts.push(`${fmtTime(a.pace_per_km)}/km`);
  if (a.laps && a.pool_length_m) parts.push(`${a.laps} laps × ${a.pool_length_m}m`);
  if (a.pushups) parts.push(`${a.pushups} PU`);
  if (a.situps) parts.push(`${a.situps} SU`);
  if (a.run_seconds) parts.push(fmtTime(a.run_seconds));
  if (a.sets && a.reps) parts.push(`${a.sets}×${a.reps}${a.weight_kg ? ` @ ${a.weight_kg}kg` : ''}`);
  return parts.join(' · ') || '—';
}

// ─── Default form state ───────────────────────────────────────────────────────

const defaultForm = () => ({
  date: new Date().toISOString().split('T')[0],
  type: 'running' as ActivityType,
  custom_type: '',
  title: '',
  duration_minutes: '',
  distance_km: '',
  laps: '',
  pool_length_m: '',
  pushups: '',
  situps: '',
  run_min: '',
  run_sec: '',
  sets: '',
  reps: '',
  weight_kg: '',
  description: '',
});

// ─── Component ────────────────────────────────────────────────────────────────

export default function Activities() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [activities, setActivities] = useState<SavedActivity[]>([]);
  const [form, setForm] = useState(defaultForm());
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => { if (user) fetchActivities(); }, [user]);

  const fetchActivities = async () => {
    const { data } = await supabase
      .from('activities')
      .select('*')
      .eq('user_id', user!.id)
      .order('date', { ascending: false });
    if (data) setActivities(data as SavedActivity[]);
  };

  const f = (key: string, value: string) => setForm(p => ({ ...p, [key]: value }));

  const save = async () => {
    const run_seconds = (form.run_min || form.run_sec)
      ? parseInt(form.run_min || '0') * 60 + parseInt(form.run_sec || '0')
      : null;
    const distance_km = form.distance_km ? parseFloat(form.distance_km) : null;
    const duration_minutes = form.duration_minutes ? parseInt(form.duration_minutes) : null;
    // Auto-calc pace for running/jogging/walking/cycling
    const pace_per_km = distance_km && duration_minutes && DISTANCE_TYPES.includes(form.type) && form.type !== 'cycling'
      ? Math.round((duration_minutes * 60) / distance_km)
      : null;

    setSaving(true);
    const { error } = await supabase.from('activities').insert({
      user_id:          user!.id,
      date:             form.date,
      type:             form.type,
      custom_type:      form.type === 'others' ? form.custom_type || null : null,
      duration_minutes,
      distance_km,
      pace_per_km,
      laps:             form.laps ? parseInt(form.laps) : null,
      pool_length_m:    form.pool_length_m ? parseInt(form.pool_length_m) : null,
      pushups:          form.pushups ? parseInt(form.pushups) : null,
      situps:           form.situps ? parseInt(form.situps) : null,
      run_seconds,
      sets:             form.sets ? parseInt(form.sets) : null,
      reps:             form.reps ? parseInt(form.reps) : null,
      weight_kg:        form.weight_kg ? parseFloat(form.weight_kg) : null,
      title: form.title || null,
      description: form.description || null,
    });
    setSaving(false);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); }
    else {
      toast({ title: 'Activity logged!' });
      setForm(defaultForm());
      setShowForm(false);
      fetchActivities();
    }
  };

  const deleteActivity = async (id: string) => {
    setDeleting(id);
    const { error } = await supabase.from('activities').delete().eq('id', id);
    setDeleting(null);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); }
    else { toast({ title: 'Deleted' }); fetchActivities(); }
  };

  const t = form.type;

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Activity className="h-7 w-7 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Activities</h1>
        </div>
        <Button onClick={() => setShowForm(v => !v)} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          {showForm ? 'Cancel' : 'Log Activity'}
        </Button>
      </div>

      {/* Upload form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Log New Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">

            {/* Date */}
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={form.date} onChange={e => f('date', e.target.value)} className="max-w-[180px]" />
            </div>

            {/* Activity type selector */}
            <div className="space-y-2">
              <Label>Activity Type</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {ACTIVITY_TYPES.map(at => (
                  <button
                    key={at.value}
                    onClick={() => f('type', at.value)}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                      form.type === at.value
                        ? 'border-primary bg-primary/10 text-primary font-medium'
                        : 'border-border bg-background text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    <span>{at.emoji}</span>
                    <span>{at.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom type input for "others" */}
            {t === 'others' && (
              <div className="space-y-2">
                <Label>Custom Activity Name</Label>
                <Input placeholder="e.g. Rock Climbing, Yoga..." value={form.custom_type} onChange={e => f('custom_type', e.target.value)} />
              </div>
            )}
            {/* Title */}
            <div className="space-y-2">
              <Label>Title</Label>
              <Input placeholder="e.g. Morning Run, Leg Day..." value={form.title} onChange={e => f('title', e.target.value)} />
            </div>
            {/* Duration — all types */}
            <div className="space-y-2">
              <Label>Duration (minutes)</Label>
              <Input type="number" placeholder="e.g. 45" value={form.duration_minutes} onChange={e => f('duration_minutes', e.target.value)} className="max-w-[160px]" />
            </div>

            {/* Distance — running, jogging, walking, cycling */}
            {DISTANCE_TYPES.includes(t) && t !== 'swimming' && (
              <div className="space-y-2">
                <Label>Distance (km)</Label>
                <Input type="number" step="0.1" placeholder="e.g. 5.0" value={form.distance_km} onChange={e => f('distance_km', e.target.value)} className="max-w-[160px]" />
                {form.distance_km && form.duration_minutes && (
                  <p className="text-xs text-muted-foreground">
                    Pace: {fmtTime(Math.round((parseInt(form.duration_minutes) * 60) / parseFloat(form.distance_km)))}/km
                  </p>
                )}
              </div>
            )}

            {/* Swimming fields */}
            {SWIM_TYPES.includes(t) && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Distance (km)</Label>
                  <Input type="number" step="0.01" placeholder="e.g. 1.0" value={form.distance_km} onChange={e => f('distance_km', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Laps</Label>
                  <Input type="number" placeholder="e.g. 40" value={form.laps} onChange={e => f('laps', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Pool Length (m)</Label>
                  <Input type="number" placeholder="25 or 50" value={form.pool_length_m} onChange={e => f('pool_length_m', e.target.value)} />
                </div>
              </div>
            )}

            {/* IPPT Training fields */}
            {IPPT_TYPES.includes(t) && (
              <div className="space-y-3">
                <p className="text-sm font-medium text-muted-foreground">IPPT Stations (optional)</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Push-ups</Label>
                    <Input type="number" placeholder="reps" value={form.pushups} onChange={e => f('pushups', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Sit-ups</Label>
                    <Input type="number" placeholder="reps" value={form.situps} onChange={e => f('situps', e.target.value)} />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label>2.4km Run Time (MM : SS)</Label>
                    <div className="flex items-center gap-2">
                      <Input type="number" placeholder="MM" value={form.run_min} onChange={e => f('run_min', e.target.value)} className="w-20" />
                      <span className="text-muted-foreground">:</span>
                      <Input type="number" placeholder="SS" value={form.run_sec} onChange={e => f('run_sec', e.target.value)} className="w-20" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Gym / Strength / Calisthenics fields */}
            {GYM_TYPES.includes(t) && (
              <div className="space-y-3">
                <p className="text-sm font-medium text-muted-foreground">Session Details (optional)</p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label>Sets</Label>
                    <Input type="number" placeholder="e.g. 3" value={form.sets} onChange={e => f('sets', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Reps</Label>
                    <Input type="number" placeholder="e.g. 10" value={form.reps} onChange={e => f('reps', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Weight (kg)</Label>
                    <Input type="number" step="0.5" placeholder="e.g. 60" value={form.weight_kg} onChange={e => f('weight_kg', e.target.value)} />
                  </div>
                </div>
              </div>
            )}

            {/* Description — all types */}
            <div className="space-y-2">
              <Label>Description / Notes</Label>
              <Textarea
                placeholder="Add any notes about this session..."
                value={form.description}
                onChange={e => f('description', e.target.value)}
                rows={3}
              />
            </div>

            <Button onClick={save} disabled={saving} className="w-full">
              {saving ? 'Saving...' : 'Save Activity'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Activity list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Activity Log
            {activities.length > 0 && <span className="ml-2 text-sm font-normal text-muted-foreground">({activities.length})</span>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No activities logged yet. Hit "Log Activity" to get started.</p>
          ) : (
            <div className="space-y-2">
              {activities.map(a => (
                <div key={a.id} className="rounded-lg border overflow-hidden">
                  {/* Row */}
                  <div
                    className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/40 transition-colors"
                    onClick={() => setExpanded(expanded === a.id ? null : a.id)}
                  >
                    <span className="text-xl shrink-0">{typeEmoji(a)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">{a.title || typeLabel(a)}</span>
                        <span className="text-xs text-muted-foreground">{a.date}</span>
                      </div>
                      <div className="text-xs text-muted-foreground truncate">{activitySummary(a)}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="ghost" size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        disabled={deleting === a.id}
                        onClick={e => { e.stopPropagation(); deleteActivity(a.id); }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                      {expanded === a.id
                        ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {expanded === a.id && (
                    <div className="border-t bg-muted/20 px-4 py-3 space-y-2 text-sm">
                      <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                        {a.duration_minutes && <div><span className="text-muted-foreground">Duration: </span>{a.duration_minutes} min</div>}
                        {a.distance_km && <div><span className="text-muted-foreground">Distance: </span>{a.distance_km} km</div>}
                        {a.pace_per_km && <div><span className="text-muted-foreground">Pace: </span>{fmtTime(a.pace_per_km)}/km</div>}
                        {a.laps && <div><span className="text-muted-foreground">Laps: </span>{a.laps}</div>}
                        {a.pool_length_m && <div><span className="text-muted-foreground">Pool: </span>{a.pool_length_m}m</div>}
                        {a.pushups && <div><span className="text-muted-foreground">Push-ups: </span>{a.pushups}</div>}
                        {a.situps && <div><span className="text-muted-foreground">Sit-ups: </span>{a.situps}</div>}
                        {a.run_seconds && <div><span className="text-muted-foreground">Run: </span>{fmtTime(a.run_seconds)}</div>}
                        {a.sets && <div><span className="text-muted-foreground">Sets: </span>{a.sets}</div>}
                        {a.reps && <div><span className="text-muted-foreground">Reps: </span>{a.reps}</div>}
                        {a.weight_kg && <div><span className="text-muted-foreground">Weight: </span>{a.weight_kg} kg</div>}
                      </div>
                      {a.description && (
                        <div className="pt-1 border-t">
                          <span className="text-muted-foreground">Notes: </span>
                          <span className="text-foreground">{a.description}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
