import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { TrendingUp, Plus, ArrowLeft, Trash2, ChevronRight } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

type ExerciseKey =
  | 'running' | 'jogging' | 'walking' | 'swimming' | 'cycling'
  | 'ippt_training' | 'gym' | 'strength_training' | 'calisthenics' | 'others';

interface ExerciseDef {
  label: string;
  emoji: string;
  metrics: MetricDef[];
}

interface MetricDef {
  key: string;
  label: string;
  unit: string;
  type: 'number' | 'time';
  step?: number;
  placeholder?: string;
}

interface ProgressEntry {
  id: string;
  user_id: string;
  exercise_key: string;
  logged_at: string;
  metrics: Record<string, number>;
  notes: string;
  created_at: string;
}

// ── Exercise definitions with their trackable metrics ─────────────────────────

const EXERCISES: Record<ExerciseKey, ExerciseDef> = {
  running: {
    label: 'Running', emoji: '🏃',
    metrics: [
      { key: 'distance_km', label: 'Distance', unit: 'km', type: 'number', step: 0.1, placeholder: 'e.g. 2.4' },
      { key: 'duration_min', label: 'Duration', unit: 'min', type: 'number', step: 1, placeholder: 'e.g. 12' },
      { key: 'avg_pace', label: 'Avg Pace', unit: 'min/km', type: 'number', step: 0.1, placeholder: 'e.g. 5.5' },
    ],
  },
  jogging: {
    label: 'Jogging', emoji: '👟',
    metrics: [
      { key: 'distance_km', label: 'Distance', unit: 'km', type: 'number', step: 0.1, placeholder: 'e.g. 3.0' },
      { key: 'duration_min', label: 'Duration', unit: 'min', type: 'number', step: 1, placeholder: 'e.g. 20' },
    ],
  },
  walking: {
    label: 'Walking', emoji: '🚶',
    metrics: [
      { key: 'distance_km', label: 'Distance', unit: 'km', type: 'number', step: 0.1, placeholder: 'e.g. 5.0' },
      { key: 'duration_min', label: 'Duration', unit: 'min', type: 'number', step: 1, placeholder: 'e.g. 45' },
      { key: 'steps', label: 'Steps', unit: 'steps', type: 'number', step: 100, placeholder: 'e.g. 8000' },
    ],
  },
  swimming: {
    label: 'Swimming', emoji: '🏊',
    metrics: [
      { key: 'distance_m', label: 'Distance', unit: 'm', type: 'number', step: 50, placeholder: 'e.g. 1000' },
      { key: 'duration_min', label: 'Duration', unit: 'min', type: 'number', step: 1, placeholder: 'e.g. 30' },
      { key: 'laps', label: 'Laps', unit: 'laps', type: 'number', step: 1, placeholder: 'e.g. 20' },
    ],
  },
  cycling: {
    label: 'Cycling', emoji: '🚴',
    metrics: [
      { key: 'distance_km', label: 'Distance', unit: 'km', type: 'number', step: 0.5, placeholder: 'e.g. 20' },
      { key: 'duration_min', label: 'Duration', unit: 'min', type: 'number', step: 1, placeholder: 'e.g. 60' },
      { key: 'avg_speed_kmh', label: 'Avg Speed', unit: 'km/h', type: 'number', step: 0.5, placeholder: 'e.g. 25' },
    ],
  },
  ippt_training: {
    label: 'IPPT Training', emoji: '🪖',
    metrics: [
      { key: 'pushups', label: 'Push-ups', unit: 'reps', type: 'number', step: 1, placeholder: 'e.g. 30' },
      { key: 'situps', label: 'Sit-ups', unit: 'reps', type: 'number', step: 1, placeholder: 'e.g. 30' },
      { key: 'run_2_4km_min', label: '2.4km Run', unit: 'min', type: 'number', step: 0.1, placeholder: 'e.g. 11.5' },
    ],
  },
  gym: {
    label: 'Gym', emoji: '🏋️',
    metrics: [
      { key: 'duration_min', label: 'Duration', unit: 'min', type: 'number', step: 5, placeholder: 'e.g. 60' },
      { key: 'sets', label: 'Total Sets', unit: 'sets', type: 'number', step: 1, placeholder: 'e.g. 15' },
      { key: 'max_weight_kg', label: 'Max Weight', unit: 'kg', type: 'number', step: 2.5, placeholder: 'e.g. 80' },
    ],
  },
  strength_training: {
    label: 'Strength Training', emoji: '💪',
    metrics: [
      { key: 'sets', label: 'Sets', unit: 'sets', type: 'number', step: 1, placeholder: 'e.g. 12' },
      { key: 'reps', label: 'Reps (per set)', unit: 'reps', type: 'number', step: 1, placeholder: 'e.g. 10' },
      { key: 'max_weight_kg', label: 'Max Weight', unit: 'kg', type: 'number', step: 2.5, placeholder: 'e.g. 60' },
    ],
  },
  calisthenics: {
    label: 'Calisthenics', emoji: '🤸',
    metrics: [
      { key: 'pushups', label: 'Push-ups', unit: 'reps', type: 'number', step: 1, placeholder: 'e.g. 25' },
      { key: 'pullups', label: 'Pull-ups', unit: 'reps', type: 'number', step: 1, placeholder: 'e.g. 10' },
      { key: 'dips', label: 'Dips', unit: 'reps', type: 'number', step: 1, placeholder: 'e.g. 15' },
      { key: 'duration_min', label: 'Duration', unit: 'min', type: 'number', step: 1, placeholder: 'e.g. 30' },
    ],
  },
  others: {
    label: 'Others', emoji: '➕',
    metrics: [
      { key: 'duration_min', label: 'Duration', unit: 'min', type: 'number', step: 1, placeholder: 'e.g. 30' },
      { key: 'reps', label: 'Reps', unit: 'reps', type: 'number', step: 1, placeholder: 'e.g. 20' },
      { key: 'sets', label: 'Sets', unit: 'sets', type: 'number', step: 1, placeholder: 'e.g. 3' },
    ],
  },
};

// ── Date formatter ────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return String(d).padStart(2, '0') + '/' + String(m).padStart(2, '0') + '/' + y;
}

// ── Module menu ───────────────────────────────────────────────────────────────

function ModuleMenu({ onSelect }: { onSelect: (key: ExerciseKey) => void }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <TrendingUp className="h-7 w-7 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Progress Tracker</h1>
      </div>
      <p className="text-sm text-muted-foreground">Select an exercise to view or log your progress.</p>
      <div className="grid grid-cols-1 gap-2">
        {(Object.keys(EXERCISES) as ExerciseKey[]).map((key) => {
          const ex = EXERCISES[key];
          return (
            <button
              key={key}
              onClick={() => onSelect(key)}
              className="flex items-center justify-between rounded-xl border bg-card px-4 py-3.5 text-left hover:bg-muted/40 transition-colors shadow-sm"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{ex.emoji}</span>
                <span className="font-semibold text-sm">{ex.label}</span>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Exercise detail view ──────────────────────────────────────────────────────

function ExerciseDetail({
  exerciseKey,
  onBack,
}: {
  exerciseKey: ExerciseKey;
  onBack: () => void;
}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const ex = EXERCISES[exerciseKey];

  const [entries, setEntries] = useState<ProgressEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [formDate, setFormDate] = useState(() => {
    const now = new Date();
    return now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
  });
  const [formNotes, setFormNotes] = useState('');

  const fetchEntries = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('progress_entries')
      .select('*')
      .eq('user_id', user.id)
      .eq('exercise_key', exerciseKey)
      .order('logged_at', { ascending: true });
    if (data) setEntries(data as ProgressEntry[]);
    setLoading(false);
  }, [user, exerciseKey]);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  const handleSubmit = async () => {
    if (!user) return;
    const metrics: Record<string, number> = {};
    let hasAny = false;
    for (const m of ex.metrics) {
      const v = parseFloat(formValues[m.key] ?? '');
      if (!isNaN(v)) { metrics[m.key] = v; hasAny = true; }
    }
    if (!hasAny) {
      toast({ title: 'Enter at least one value', variant: 'destructive' }); return;
    }
    setSaving(true);
    const { error } = await supabase.from('progress_entries').insert({
      user_id: user.id,
      exercise_key: exerciseKey,
      logged_at: formDate,
      metrics,
      notes: formNotes.trim(),
    });
    setSaving(false);
    if (error) {
      toast({ title: 'Error saving', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Progress logged!' });
      setFormValues({});
      setFormNotes('');
      fetchEntries();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('progress_entries').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error deleting', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Entry deleted' });
      fetchEntries();
    }
  };

  // Build chart data - one series per metric
  const chartData = entries.map((e) => {
    const point: Record<string, any> = { date: fmtDate(e.logged_at) };
    for (const m of ex.metrics) {
      if (e.metrics[m.key] !== undefined) point[m.key] = e.metrics[m.key];
    }
    return point;
  });

  const CHART_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#3b82f6'];

  return (
    <div className="space-y-5 pb-10">

      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <span className="text-xl">{ex.emoji}</span>
        <h1 className="text-xl font-bold text-foreground">{ex.label}</h1>
      </div>

      {/* Log form */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Plus className="h-4 w-4" /> Log Progress
          </CardTitle>
          <CardDescription>Record your latest {ex.label.toLowerCase()} numbers</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Date</Label>
            <Input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} className="max-w-[180px]" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {ex.metrics.map((m) => (
              <div key={m.key} className="space-y-1.5">
                <Label>{m.label} <span className="text-muted-foreground text-xs">({m.unit})</span></Label>
                <Input
                  type="number"
                  step={m.step}
                  placeholder={m.placeholder}
                  value={formValues[m.key] ?? ''}
                  onChange={(e) => setFormValues((prev) => ({ ...prev, [m.key]: e.target.value }))}
                />
              </div>
            ))}
          </div>
          <div className="space-y-1.5">
            <Label>Notes <span className="text-muted-foreground text-xs">(optional)</span></Label>
            <Input
              placeholder="Any remarks..."
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
            />
          </div>
          <Button onClick={handleSubmit} disabled={saving} className="w-full">
            {saving ? 'Saving...' : 'Log Entry'}
          </Button>
        </CardContent>
      </Card>

      {/* History table */}
      {!loading && entries.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-3 font-semibold text-muted-foreground">Date</th>
                    {ex.metrics.map((m) => (
                      <th key={m.key} className="text-left py-2 pr-3 font-semibold text-muted-foreground whitespace-nowrap">
                        {m.label} ({m.unit})
                      </th>
                    ))}
                    <th className="text-left py-2 pr-3 font-semibold text-muted-foreground">Notes</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {[...entries].reverse().map((e) => (
                    <tr key={e.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="py-2 pr-3 font-medium whitespace-nowrap">{fmtDate(e.logged_at)}</td>
                      {ex.metrics.map((m) => (
                        <td key={m.key} className="py-2 pr-3 tabular-nums">
                          {e.metrics[m.key] !== undefined ? e.metrics[m.key] : '-'}
                        </td>
                      ))}
                      <td className="py-2 pr-3 text-muted-foreground max-w-[120px] truncate">{e.notes || '-'}</td>
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
                                This will permanently remove this log entry.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(e.id)}
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

      {/* Progress chart - only shown with 2+ entries */}
      {!loading && entries.length >= 2 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" /> Progress Chart
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {ex.metrics.map((m, idx) => {
                const hasData = chartData.some((d) => d[m.key] !== undefined);
                if (!hasData) return null;
                return (
                  <div key={m.key}>
                    <p className="text-xs font-semibold text-muted-foreground mb-2">
                      {m.label} ({m.unit})
                    </p>
                    <ResponsiveContainer width="100%" height={160}>
                      <LineChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 10 }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 10 }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip
                          contentStyle={{
                            fontSize: 12,
                            borderRadius: 8,
                            border: '1px solid hsl(var(--border))',
                            background: 'hsl(var(--card))',
                          }}
                          formatter={(v: any) => [v + ' ' + m.unit, m.label]}
                        />
                        <Line
                          type="monotone"
                          dataKey={m.key}
                          stroke={CHART_COLORS[idx % CHART_COLORS.length]}
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
            </div>
          </CardContent>
        </Card>
      )}

      {!loading && entries.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <TrendingUp className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">No entries yet</p>
          <p className="text-xs mt-1 opacity-70">Log your first {ex.label.toLowerCase()} session above</p>
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ProgressTracker() {
  const [selected, setSelected] = useState<ExerciseKey | null>(null);

  if (selected) {
    return (
      <div className="max-w-2xl mx-auto">
        <ExerciseDetail exerciseKey={selected} onBack={() => setSelected(null)} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <ModuleMenu onSelect={setSelected} />
    </div>
  );
}
