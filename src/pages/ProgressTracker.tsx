import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { TrendingUp, Plus, ArrowLeft, Trash2, X } from 'lucide-react';

// ── Exercise presets ──────────────────────────────────────────────────────────

const PRESETS = [
  { value: 'running',           label: 'Running',           emoji: '🏃', defaultMetrics: ['Distance (km)', 'Time (min)', 'Pace (min/km)'] },
  { value: 'swimming',          label: 'Swimming',          emoji: '🏊', defaultMetrics: ['Laps', 'Distance (m)', 'Time (min)'] },
  { value: 'ippt_training',     label: 'IPPT Training',     emoji: '🪖', defaultMetrics: ['Push-ups', 'Sit-ups', 'Run Time (sec)'] },
  { value: 'gym',               label: 'Gym',               emoji: '🏋️', defaultMetrics: ['Sets', 'Reps', 'Weight (kg)'] },
  { value: 'cycling',           label: 'Cycling',           emoji: '🚴', defaultMetrics: ['Distance (km)', 'Time (min)'] },
  { value: 'strength_training', label: 'Strength Training', emoji: '💪', defaultMetrics: ['Sets', 'Reps', 'Weight (kg)'] },
  { value: 'calisthenics',      label: 'Calisthenics',      emoji: '🤸', defaultMetrics: ['Reps', 'Sets', 'Duration (min)'] },
  { value: 'walking',           label: 'Walking',           emoji: '🚶', defaultMetrics: ['Distance (km)', 'Duration (min)'] },
  { value: 'jogging',           label: 'Jogging',           emoji: '👟', defaultMetrics: ['Distance (km)', 'Time (min)'] },
];

// ── Types ─────────────────────────────────────────────────────────────────────

interface TrackerModule {
  id: string;
  user_id: string;
  exercise_key: string;
  exercise_label: string;
  emoji: string;
  metric_labels: string[];
  created_at: string;
}

interface ProgressEntry {
  id: string;
  module_id: string;
  user_id: string;
  logged_at: string;
  metric_values: number[];
  notes: string;
  created_at: string;
}

// ── Date formatter ────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return String(d).padStart(2, '0') + '/' + String(m).padStart(2, '0') + '/' + y;
}

function todayStr() {
  const now = new Date();
  return now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
}

// ── Add Exercise Modal ────────────────────────────────────────────────────────

function AddExerciseModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (mod: Omit<TrackerModule, 'id' | 'user_id' | 'created_at'>) => Promise<void>;
}) {
  const [selected, setSelected] = useState<string>('');
  const [customLabel, setCustomLabel] = useState('');
  const [customEmoji, setCustomEmoji] = useState('');
  const [metricInputs, setMetricInputs] = useState<string[]>(['', '']);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const isCustom = selected === '__custom__';
  const preset = PRESETS.find((p) => p.value === selected);

  const handleSelectPreset = (value: string) => {
    setSelected(value);
    setCustomLabel('');
    setCustomEmoji('');
    if (value !== '__custom__') {
      const p = PRESETS.find(p => p.value === value);
      if (p) setMetricInputs([...p.defaultMetrics, ''].slice(0, p.defaultMetrics.length + 1));
    } else {
      setMetricInputs(['', '']);
    }
  };

  const handleCreate = async () => {
    const label = isCustom ? customLabel.trim() : preset?.label ?? '';
    if (!label) { toast({ title: 'Enter an exercise name', variant: 'destructive' }); return; }
    const metrics = metricInputs.map((m) => m.trim()).filter(Boolean);
    if (metrics.length === 0) { toast({ title: 'Add at least one metric (e.g. Reps)', variant: 'destructive' }); return; }
    setSaving(true);
    await onCreate({
      exercise_key: isCustom ? 'custom_' + Date.now() : selected,
      exercise_label: label,
      emoji: isCustom ? (customEmoji || '🏅') : (preset?.emoji ?? '🏅'),
      metric_labels: metrics,
    });
    setSaving(false);
  };

  const addMetric = () => setMetricInputs((p) => [...p, '']);
  const removeMetric = (i: number) => setMetricInputs((p) => p.filter((_, j) => j !== i));
  const updateMetric = (i: number, v: string) => setMetricInputs((p) => p.map((m, j) => j === i ? v : m));

  return (
    <div className="fixed inset-0 z-[70]" style={{ pointerEvents: 'none' }}>
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60"
        style={{ pointerEvents: 'auto' }}
        onClick={onClose}
      />
      {/* Floating sheet — margin on all sides, fully rounded */}
      <div
        className="absolute inset-x-0 mx-auto w-full max-w-lg bg-background rounded-2xl shadow-2xl flex flex-col"
        style={{
          pointerEvents: 'auto',
          maxHeight: 'calc(100dvh - 64px - env(safe-area-inset-top, 0px) - 36px)',
          bottom: 'calc(64px + env(safe-area-inset-bottom, 0px) + 16px)',
          left: '16px',
          right: '16px',
          width: 'auto',
        }}
      >
        <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b shrink-0">
          <h2 className="text-base font-bold">Add Exercise</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-3 space-y-4 min-h-0">

          {/* Preset grid */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground uppercase tracking-wide">Select type</Label>
            <div className="grid grid-cols-2 gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => handleSelectPreset(p.value)}
                  className={
                    'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors text-left ' +
                    (selected === p.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-background hover:bg-muted')
                  }
                >
                  <span>{p.emoji}</span>
                  <span className="truncate">{p.label}</span>
                </button>
              ))}
              <button
                onClick={() => handleSelectPreset('__custom__')}
                className={
                  'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors text-left ' +
                  (selected === '__custom__'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-background hover:bg-muted')
                }
              >
                <span>✏️</span>
                <span>Custom</span>
              </button>
            </div>
          </div>

          {/* Custom name + emoji */}
          {isCustom && (
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Emoji</Label>
                <Input placeholder="🏅" value={customEmoji} onChange={(e) => setCustomEmoji(e.target.value)} maxLength={2} />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs">Exercise name</Label>
                <Input placeholder="e.g. Deadlift" value={customLabel} onChange={(e) => setCustomLabel(e.target.value)} />
              </div>
            </div>
          )}

          {/* Metrics */}
          {selected && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">Metrics to track</Label>
                {!isCustom && (
                  <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">pre-filled</span>
                )}
              </div>
              {metricInputs.map((m, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    placeholder={`Metric ${i + 1} — e.g. Reps`}
                    value={m}
                    onChange={(e) => updateMetric(i, e.target.value)}
                  />
                  {metricInputs.length > 1 && (
                    <button onClick={() => removeMetric(i)} className="p-2 rounded hover:bg-muted text-muted-foreground shrink-0">
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
              {metricInputs.length < 6 && (
                <button onClick={addMetric} className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium py-1">
                  <Plus className="h-3.5 w-3.5" /> Add metric
                </button>
              )}
            </div>
          )}
        </div>

        {/* Sticky footer */}
        <div className="px-4 pt-3 pb-4 border-t shrink-0 bg-background">
          <Button onClick={handleCreate} disabled={saving || !selected} className="w-full">
            {saving ? 'Creating...' : 'Create Exercise'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Exercise detail view ──────────────────────────────────────────────────────

function ExerciseDetail({
  mod,
  onBack,
  onDelete,
}: {
  mod: TrackerModule;
  onBack: () => void;
  onDelete: () => void;
}) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [entries, setEntries] = useState<ProgressEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formValues, setFormValues] = useState<string[]>(mod.metric_labels.map(() => ''));
  const [formDate, setFormDate] = useState(todayStr);
  const [formNotes, setFormNotes] = useState('');

  const fetchEntries = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('progress_entries')
      .select('*')
      .eq('module_id', mod.id)
      .eq('user_id', user.id)
      .order('logged_at', { ascending: true });
    if (data) setEntries(data as ProgressEntry[]);
    setLoading(false);
  }, [user, mod.id]);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  const handleSubmit = async () => {
    if (!user) return;
    const vals = formValues.map((v) => parseFloat(v));
    if (vals.every(isNaN)) {
      toast({ title: 'Enter at least one value', variant: 'destructive' }); return;
    }
    setSaving(true);
    const { error } = await supabase.from('progress_entries').insert({
      module_id: mod.id,
      user_id: user.id,
      logged_at: formDate,
      metric_values: vals.map((v) => (isNaN(v) ? null : v)),
      notes: formNotes.trim(),
    });
    setSaving(false);
    if (error) {
      toast({ title: 'Error saving', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Progress logged!' });
      setFormValues(mod.metric_labels.map(() => ''));
      setFormNotes('');
      fetchEntries();
    }
  };

  const handleDeleteEntry = async (id: string) => {
    const { error } = await supabase.from('progress_entries').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error deleting', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Entry deleted' });
      fetchEntries();
    }
  };

  // Chart data - one series per metric
  const chartData = entries.map((e) => {
    const point: Record<string, any> = { date: fmtDate(e.logged_at) };
    mod.metric_labels.forEach((label, i) => {
      if (e.metric_values[i] !== null && e.metric_values[i] !== undefined) {
        point[label] = e.metric_values[i];
      }
    });
    return point;
  });

  const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#3b82f6', '#a855f7'];

  return (
    <div className="space-y-5 pb-10">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <span className="text-xl">{mod.emoji}</span>
          <h1 className="text-xl font-bold">{mod.exercise_label}</h1>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-destructive transition-colors">
              <Trash2 className="h-4 w-4" />
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete exercise?</AlertDialogTitle>
              <AlertDialogDescription>
                This will remove the module and all its logged entries permanently.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Log form */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Log Entry</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Date</Label>
            <Input
              type="date"
              value={formDate}
              onChange={(e) => setFormDate(e.target.value)}
              className="max-w-[180px]"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {mod.metric_labels.map((label, i) => (
              <div key={i} className="space-y-1.5">
                <Label>{label}</Label>
                <Input
                  type="number"
                  step="any"
                  placeholder="0"
                  value={formValues[i]}
                  onChange={(e) => {
                    const next = [...formValues];
                    next[i] = e.target.value;
                    setFormValues(next);
                  }}
                />
              </div>
            ))}
          </div>
          <div className="space-y-1.5">
            <Label>Notes <span className="text-xs text-muted-foreground">(optional)</span></Label>
            <Input
              placeholder="Any remarks..."
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
            />
          </div>
          <Button onClick={handleSubmit} disabled={saving} className="w-full">
            {saving ? 'Saving...' : 'Submit'}
          </Button>
        </CardContent>
      </Card>

      {/* Stats table */}
      {!loading && entries.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-4 font-semibold text-muted-foreground whitespace-nowrap">Date</th>
                    {mod.metric_labels.map((label) => (
                      <th key={label} className="text-left py-2 pr-4 font-semibold text-muted-foreground whitespace-nowrap">
                        {label}
                      </th>
                    ))}
                    <th className="text-left py-2 pr-4 font-semibold text-muted-foreground">Notes</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {[...entries].reverse().map((e) => (
                    <tr key={e.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="py-2 pr-4 font-medium whitespace-nowrap">{fmtDate(e.logged_at)}</td>
                      {mod.metric_labels.map((_, i) => (
                        <td key={i} className="py-2 pr-4 tabular-nums">
                          {e.metric_values[i] !== null && e.metric_values[i] !== undefined
                            ? e.metric_values[i]
                            : '-'}
                        </td>
                      ))}
                      <td className="py-2 pr-4 text-muted-foreground max-w-[100px] truncate">
                        {e.notes || '-'}
                      </td>
                      <td className="py-2">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <button className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-destructive transition-colors">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete entry?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This log entry will be permanently removed.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteEntry(e.id)}
                                className="bg-destructive text-destructive-foreground"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progress chart - 2+ entries only */}
      {!loading && entries.length >= 2 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" /> Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {mod.metric_labels.map((label, idx) => {
              const hasData = chartData.some((d) => d[label] !== undefined);
              if (!hasData) return null;
              return (
                <div key={label}>
                  <p className="text-xs font-semibold text-muted-foreground mb-2">{label}</p>
                  <ResponsiveContainer width="100%" height={160}>
                    <LineChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{
                          fontSize: 12,
                          borderRadius: 8,
                          border: '1px solid hsl(var(--border))',
                          background: 'hsl(var(--card))',
                        }}
                        formatter={(v: any) => [v, label]}
                      />
                      <Line
                        type="monotone"
                        dataKey={label}
                        stroke={COLORS[idx % COLORS.length]}
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        activeDot={{ r: 5 }}
                        connectNulls
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {!loading && entries.length === 0 && (
        <div className="text-center py-10 text-muted-foreground">
          <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No entries yet - log your first session above</p>
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ProgressTracker() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [modules, setModules] = useState<TrackerModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<TrackerModule | null>(null);

  const fetchModules = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('tracker_modules')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });
    if (data) setModules(data as TrackerModule[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchModules(); }, [fetchModules]);

  const handleCreate = async (mod: Omit<TrackerModule, 'id' | 'user_id' | 'created_at'>) => {
    if (!user) return;
    const { error } = await supabase.from('tracker_modules').insert({ ...mod, user_id: user.id });
    if (error) {
      toast({ title: 'Error creating', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: mod.exercise_label + ' added!' });
      setShowModal(false);
      fetchModules();
    }
  };

  const handleDeleteModule = async (mod: TrackerModule) => {
    await supabase.from('progress_entries').delete().eq('module_id', mod.id);
    const { error } = await supabase.from('tracker_modules').delete().eq('id', mod.id);
    if (error) {
      toast({ title: 'Error deleting', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Exercise removed' });
      setSelected(null);
      fetchModules();
    }
  };

  // ── Detail view ─────────────────────────────────────────────────────────────
  if (selected) {
    return (
      <div className="max-w-2xl mx-auto">
        <ExerciseDetail
          mod={selected}
          onBack={() => setSelected(null)}
          onDelete={() => handleDeleteModule(selected)}
        />
      </div>
    );
  }

  // ── Module menu ─────────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-10">

      <div className="flex items-center gap-3">
        <TrendingUp className="h-7 w-7 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Progress Tracker</h1>
      </div>

      {!loading && modules.length === 0 ? (
        // Empty state
        <div className="flex flex-col items-center justify-center py-24 gap-6">
          <div className="text-center text-muted-foreground">
            <TrendingUp className="h-14 w-14 mx-auto mb-4 opacity-20" />
            <p className="text-base font-medium">No exercises yet</p>
            <p className="text-sm mt-1 opacity-70">Add an exercise to start tracking your progress</p>
          </div>
          <Button size="lg" className="px-8 text-base h-12" onClick={() => setShowModal(true)}>
            <Plus className="h-5 w-5 mr-2" /> Add Exercise
          </Button>
        </div>
      ) : (
        // Module grid
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            {modules.map((m) => (
              <button
                key={m.id}
                onClick={() => setSelected(m)}
                className="flex items-center justify-between rounded-xl border bg-card px-4 py-4 text-left hover:bg-muted/40 transition-colors shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{m.emoji}</span>
                  <div>
                    <p className="font-semibold text-sm">{m.exercise_label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {m.metric_labels.join(' · ')}
                    </p>
                  </div>
                </div>
                <TrendingUp className="h-4 w-4 text-muted-foreground shrink-0" />
              </button>
            ))}
          </div>

          <Button variant="outline" className="w-full" onClick={() => setShowModal(true)}>
            <Plus className="h-4 w-4 mr-2" /> Add Exercise
          </Button>
        </div>
      )}

      {showModal && (
        <AddExerciseModal
          onClose={() => setShowModal(false)}
          onCreate={handleCreate}
        />
      )}
    </div>
  );
}
