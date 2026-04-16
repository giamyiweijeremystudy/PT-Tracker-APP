import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dumbbell, Plus, ChevronDown, ChevronUp, RefreshCw,
  Clock, BarChart2, Zap, Flame, Heart, Pencil, Trash2, X, Save, Upload, FileJson,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced';

interface Exercise { text: string }
interface Session  { name: string; exercises: Exercise[] }
interface Module   { label: string; focus: string; sessions: Session[]; tips: string[] }

interface Program {
  id:         string;
  created_by: string;
  title:      string;
  subtitle:   string;
  category:   string;
  difficulty: Difficulty;
  duration:   string;
  frequency:  string;
  goal:       string;
  modules:    Module[];
  created_at: string;
  updated_at: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = ['IPPT','Running','Strength','Swimming','SFT','Cycling','Gym','Home','Other'];
const DIFFICULTIES: Difficulty[] = ['Beginner','Intermediate','Advanced'];

const DIFF_STYLE: Record<Difficulty, string> = {
  Beginner:     'bg-green-100 text-green-700 border-green-200',
  Intermediate: 'bg-blue-100 text-blue-700 border-blue-200',
  Advanced:     'bg-red-100 text-red-700 border-red-200',
};
const DIFF_ICON: Record<Difficulty, typeof Flame> = {
  Beginner: Heart, Intermediate: Zap, Advanced: Flame,
};

// ─── Empty form factory ───────────────────────────────────────────────────────

const emptyModule = (): Module => ({
  label: '', focus: '',
  sessions: [{ name: '', exercises: [{ text: '' }] }],
  tips: [''],
});

const emptyForm = () => ({
  title: '', subtitle: '', category: 'IPPT', difficulty: 'Beginner' as Difficulty,
  duration: '', frequency: '', goal: '',
  modules: [emptyModule()],
});

// ─── ModuleBlock (read-only) ──────────────────────────────────────────────────

function ModuleBlock({ mod }: { mod: Module }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border overflow-hidden">
      <button onClick={() => setOpen((o: boolean) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-muted/40 hover:bg-muted/70 transition-colors text-left">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-primary">{mod.label}</span>
            <span className="text-sm font-semibold">{mod.focus}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{mod.sessions.length} session{mod.sessions.length !== 1 ? 's' : ''}</p>
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
      </button>
      {open && (
        <div className="px-4 py-3 space-y-4 bg-card">
          {mod.sessions.map((sess, i) => (
            <div key={i}>
              {sess.name && <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">{sess.name}</p>}
              <ul className="space-y-1">
                {sess.exercises.map((ex, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm">
                    <span className="text-primary font-bold mt-0.5">·</span>
                    <span>{typeof ex === 'string' ? ex : ex.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {mod.tips?.filter(t => t).length > 0 && (
            <div className="rounded-lg bg-primary/5 border border-primary/20 px-3 py-2 space-y-1">
              <p className="text-xs font-semibold text-primary">Coach Tips</p>
              {mod.tips.filter(t => t).map((tip, i) => (
                <p key={i} className="text-xs text-muted-foreground">💡 {tip}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Program detail view ──────────────────────────────────────────────────────

function ProgramDetail({ prog, isAdmin, onBack, onEdit, onDelete }: {
  prog: Program; isAdmin: boolean;
  onBack: () => void; onEdit: () => void; onDelete: () => void;
}) {
  const DiffIcon = DIFF_ICON[prog.difficulty] ?? Zap;
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← Back to Programs
        </button>
        {isAdmin && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onEdit}><Pencil className="h-3.5 w-3.5 mr-1" /> Edit</Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-destructive hover:text-destructive"><Trash2 className="h-3.5 w-3.5 mr-1" /> Delete</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete program?</AlertDialogTitle>
                  <AlertDialogDescription>"{prog.title}" will be permanently removed for all users.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>

      <div className="rounded-2xl border bg-card overflow-hidden shadow-sm">
        <div className="h-2 w-full bg-primary" />
        <div className="p-5">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center shrink-0">
              <Dumbbell className="h-6 w-6 text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold">{prog.title}</h2>
              {prog.subtitle && <p className="text-sm text-muted-foreground mt-0.5">{prog.subtitle}</p>}
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'Level',     value: prog.difficulty },
              { label: 'Duration',  value: prog.duration },
              { label: 'Frequency', value: prog.frequency },
              { label: 'Category',  value: prog.category },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-lg bg-muted/50 px-3 py-2 text-center">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-sm font-semibold mt-0.5">{value}</p>
              </div>
            ))}
          </div>
          {prog.goal && (
            <div className="mt-3 rounded-lg bg-primary/5 border border-primary/20 px-3 py-2">
              <p className="text-xs text-muted-foreground"><span className="font-semibold text-primary">Goal:</span> {prog.goal}</p>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1">Modules — tap to expand</p>
        {prog.modules.map((mod, i) => <ModuleBlock key={i} mod={mod} />)}
      </div>
    </div>
  );
}

// ─── Program Form (create/edit) ───────────────────────────────────────────────

function ProgramForm({ initial, onSave, onCancel, saving }: {
  initial: ReturnType<typeof emptyForm>;
  onSave: (data: ReturnType<typeof emptyForm>) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState(initial);

  const setField = (k: keyof typeof form, v: any) => setForm(f => ({ ...f, [k]: v }));

  // Module helpers
  const addModule = () => setForm(f => ({ ...f, modules: [...f.modules, emptyModule()] }));
  const removeModule = (mi: number) => setForm(f => ({ ...f, modules: f.modules.filter((_, i) => i !== mi) }));
  const setModField = (mi: number, k: keyof Module, v: any) =>
    setForm(f => { const mods = [...f.modules]; (mods[mi] as any)[k] = v; return { ...f, modules: mods }; });

  // Session helpers
  const addSession = (mi: number) =>
    setForm(f => { const mods = [...f.modules]; mods[mi].sessions.push({ name: '', exercises: [{ text: '' }] }); return { ...f, modules: mods }; });
  const removeSession = (mi: number, si: number) =>
    setForm(f => { const mods = [...f.modules]; mods[mi].sessions = mods[mi].sessions.filter((_, i) => i !== si); return { ...f, modules: mods }; });
  const setSessField = (mi: number, si: number, k: keyof Session, v: any) =>
    setForm(f => { const mods = [...f.modules]; (mods[mi].sessions[si] as any)[k] = v; return { ...f, modules: mods }; });

  // Exercise helpers
  const addExercise = (mi: number, si: number) =>
    setForm(f => { const mods = [...f.modules]; mods[mi].sessions[si].exercises.push({ text: '' }); return { ...f, modules: mods }; });
  const removeExercise = (mi: number, si: number, ei: number) =>
    setForm(f => { const mods = [...f.modules]; mods[mi].sessions[si].exercises = mods[mi].sessions[si].exercises.filter((_, i) => i !== ei); return { ...f, modules: mods }; });
  const setExercise = (mi: number, si: number, ei: number, v: string) =>
    setForm(f => { const mods = [...f.modules]; mods[mi].sessions[si].exercises[ei] = { text: v }; return { ...f, modules: mods }; });

  // Tip helpers
  const addTip = (mi: number) =>
    setForm(f => { const mods = [...f.modules]; mods[mi].tips.push(''); return { ...f, modules: mods }; });
  const setTip = (mi: number, ti: number, v: string) =>
    setForm(f => { const mods = [...f.modules]; mods[mi].tips[ti] = v; return { ...f, modules: mods }; });
  const removeTip = (mi: number, ti: number) =>
    setForm(f => { const mods = [...f.modules]; mods[mi].tips = mods[mi].tips.filter((_, i) => i !== ti); return { ...f, modules: mods }; });

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">{initial.title ? 'Edit Program' : 'Create Program'}</h2>
        <button onClick={onCancel} className="p-1.5 rounded hover:bg-muted text-muted-foreground"><X className="h-4 w-4" /></button>
      </div>

      {/* Basic info */}
      <div className="rounded-xl border bg-card p-4 space-y-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Program Info</p>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Title *</Label>
            <Input placeholder="e.g. IPPT Silver Program" value={form.title} onChange={e => setField('title', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Subtitle</Label>
            <Input placeholder="Short description" value={form.subtitle} onChange={e => setField('subtitle', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Category *</Label>
              <Select value={form.category} onValueChange={v => setField('category', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Difficulty *</Label>
              <Select value={form.difficulty} onValueChange={v => setField('difficulty', v as Difficulty)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{DIFFICULTIES.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Duration *</Label>
              <Input placeholder="e.g. 8 weeks" value={form.duration} onChange={e => setField('duration', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Frequency *</Label>
              <Input placeholder="e.g. 4×/week" value={form.frequency} onChange={e => setField('frequency', e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Goal</Label>
            <Input placeholder="e.g. Achieve IPPT Silver (75+ pts)" value={form.goal} onChange={e => setField('goal', e.target.value)} />
          </div>
        </div>
      </div>

      {/* Modules */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Modules</p>
          <Button variant="outline" size="sm" onClick={addModule}><Plus className="h-3.5 w-3.5 mr-1" /> Add Module</Button>
        </div>

        {form.modules.map((mod, mi) => (
          <div key={mi} className="rounded-xl border bg-card overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 bg-muted/40 border-b">
              <span className="text-xs font-bold text-primary">Module {mi + 1}</span>
              <div className="flex-1 flex gap-2">
                <Input placeholder="Label (e.g. Weeks 1–2)" value={mod.label} onChange={e => setModField(mi, 'label', e.target.value)} className="h-7 text-xs" />
                <Input placeholder="Focus (e.g. Base Building)" value={mod.focus} onChange={e => setModField(mi, 'focus', e.target.value)} className="h-7 text-xs" />
              </div>
              {form.modules.length > 1 && (
                <button onClick={() => removeModule(mi)} className="text-muted-foreground hover:text-destructive p-1"><X className="h-3.5 w-3.5" /></button>
              )}
            </div>

            <div className="p-4 space-y-4">
              {/* Sessions */}
              {mod.sessions.map((sess, si) => (
                <div key={si} className="space-y-2 rounded-lg border bg-muted/20 p-3">
                  <div className="flex items-center gap-2">
                    <Input placeholder="Session name (e.g. Push Day)" value={sess.name} onChange={e => setSessField(mi, si, 'name', e.target.value)} className="h-7 text-xs flex-1" />
                    {mod.sessions.length > 1 && (
                      <button onClick={() => removeSession(mi, si)} className="text-muted-foreground hover:text-destructive p-1"><X className="h-3.5 w-3.5" /></button>
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Exercises <span className="opacity-60">(one per line)</span></p>
                    <Textarea
                      placeholder={"3×10 push-ups\n2km warm-up jog\nPlank 3×30s\n..."}
                      value={sess.exercises.map((ex: any) => typeof ex === 'string' ? ex : ex.text).join('\n')}
                      onChange={e => {
                        const lines = e.target.value.split('\n');
                        const mods = [...form.modules];
                        mods[mi].sessions[si].exercises = lines.map(l => ({ text: l }));
                        setForm(f => ({ ...f, modules: mods }));
                      }}
                      rows={5}
                      className="text-sm resize-y min-h-[100px]"
                    />
                  </div>
                </div>
              ))}
              <button onClick={() => addSession(mi)} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 border rounded px-2 py-1">
                <Plus className="h-3 w-3" /> Add session
              </button>

              {/* Tips */}
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground font-medium">Coach Tips (optional)</p>
                {mod.tips.map((tip, ti) => (
                  <div key={ti} className="flex items-center gap-1.5">
                    <span className="text-xs">💡</span>
                    <Input placeholder="Tip..." value={tip} onChange={e => setTip(mi, ti, e.target.value)} className="h-7 text-xs flex-1" />
                    <button onClick={() => removeTip(mi, ti)} className="text-muted-foreground hover:text-destructive p-0.5"><X className="h-3 w-3" /></button>
                  </div>
                ))}
                <button onClick={() => addTip(mi)} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                  <Plus className="h-3 w-3" /> Add tip
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 pt-2">
        <Button onClick={() => onSave(form)} disabled={saving} className="flex-1">
          <Save className="h-4 w-4 mr-2" />{saving ? 'Saving...' : 'Save Program'}
        </Button>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

// ─── Program Card ─────────────────────────────────────────────────────────────

function ProgramCard({ prog, onClick }: { prog: Program; onClick: () => void }) {
  const DiffIcon = DIFF_ICON[prog.difficulty] ?? Zap;
  return (
    <div onClick={onClick} className="group rounded-2xl border bg-card shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden">
      <div className="h-1.5 w-full bg-primary" />
      <div className="p-4 space-y-3">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shrink-0">
            <Dumbbell className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-sm leading-tight">{prog.title}</h3>
            {prog.subtitle && <p className="text-xs text-muted-foreground mt-0.5">{prog.subtitle}</p>}
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium ${DIFF_STYLE[prog.difficulty]}`}>
            <DiffIcon className="h-3 w-3" />{prog.difficulty}
          </span>
          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
            <Clock className="h-3 w-3" />{prog.duration}
          </span>
          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
            <BarChart2 className="h-3 w-3" />{prog.frequency}
          </span>
        </div>
        {prog.goal && (
          <p className="text-xs text-muted-foreground border-t pt-2">
            <span className="font-medium text-foreground">Goal:</span> {prog.goal}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TrainingProgrammes() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const isAdmin = (profile as any)?.is_admin === true;

  const [programs, setPrograms]       = useState<Program[]>([]);
  const [loading, setLoading]         = useState(true);
  const [selected, setSelected]       = useState<Program | null>(null);
  const [mode, setMode]               = useState<'list' | 'create' | 'edit'>('list');
  const [editForm, setEditForm]       = useState<ReturnType<typeof emptyForm> | null>(null);
  const [saving, setSaving]           = useState(false);
  const [showImport, setShowImport]   = useState(false);
  const [importText, setImportText]   = useState('');
  const [importError, setImportError] = useState('');
  const [showFormat, setShowFormat]   = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('All');

  const fetchPrograms = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('training_programs')
      .select('*')
      .order('created_at', { ascending: false });
    setLoading(false);
    if (error) { toast({ title: 'Error loading programs', description: error.message, variant: 'destructive' }); return; }
    setPrograms((data ?? []) as Program[]);
  }, []);

  useEffect(() => { fetchPrograms(); }, [fetchPrograms]);

  const categories = ['All', ...Array.from(new Set(programs.map(p => p.category))).sort()];
  const filtered = activeCategory === 'All' ? programs : programs.filter(p => p.category === activeCategory);

  const handleSave = async (form: ReturnType<typeof emptyForm>) => {
    if (!form.title.trim() || !form.duration.trim() || !form.frequency.trim()) {
      toast({ title: 'Fill in required fields (title, duration, frequency)', variant: 'destructive' }); return;
    }
    setSaving(true);
    const payload = {
      title: form.title.trim(), subtitle: form.subtitle.trim(),
      category: form.category, difficulty: form.difficulty,
      duration: form.duration.trim(), frequency: form.frequency.trim(),
      goal: form.goal.trim(),
      modules: form.modules,
    };
    let error;
    if (mode === 'create') {
      const { data: { session } } = await supabase.auth.getSession();
      ({ error } = await supabase.from('training_programs').insert({ ...payload, created_by: session!.user.id }));
    } else if (mode === 'edit' && selected) {
      ({ error } = await supabase.from('training_programs').update(payload).eq('id', selected.id));
    }
    setSaving(false);
    if (error) { toast({ title: 'Error saving', description: error.message, variant: 'destructive' }); return; }
    toast({ title: mode === 'create' ? 'Program created!' : 'Program updated!' });
    setMode('list'); setSelected(null); setEditForm(null);
    fetchPrograms();
  };

  const handleDelete = async (prog: Program) => {
    const { error } = await supabase.from('training_programs').delete().eq('id', prog.id);
    if (error) { toast({ title: 'Error deleting', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Program deleted' });
    setSelected(null); setMode('list');
    fetchPrograms();
  };

  const handleImport = async () => {
    setImportError('');
    let parsed: any;
    try {
      parsed = JSON.parse(importText.trim());
    } catch {
      setImportError('Invalid JSON. Please check the format and try again.');
      return;
    }

    // Accept either a single program object or an array
    const items: any[] = Array.isArray(parsed) ? parsed : [parsed];
    const errors: string[] = [];

    for (const item of items) {
      if (!item.title) { errors.push(`Item missing "title"`); continue; }
      const payload = {
        created_by: (await supabase.auth.getSession()).data.session!.user.id,
        title:      String(item.title),
        subtitle:   String(item.subtitle ?? ''),
        category:   String(item.category ?? 'Other'),
        difficulty: (['Beginner','Intermediate','Advanced'].includes(item.difficulty) ? item.difficulty : 'Beginner') as Difficulty,
        duration:   String(item.duration ?? ''),
        frequency:  String(item.frequency ?? ''),
        goal:       String(item.goal ?? ''),
        modules:    Array.isArray(item.modules) ? item.modules : [],
      };
      const { error } = await supabase.from('training_programs').insert(payload);
      if (error) errors.push(`"${item.title}": ${error.message}`);
    }

    if (errors.length > 0) {
      setImportError(errors.join('\n'));
    } else {
      toast({ title: `${items.length} program${items.length !== 1 ? 's' : ''} imported!` });
      setShowImport(false);
      setImportText('');
      fetchPrograms();
    }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setImportText(String(ev.target?.result ?? ''));
    reader.readAsText(file);
  };

    const startEdit = (prog: Program) => {
    setEditForm({
      title: prog.title, subtitle: prog.subtitle,
      category: prog.category, difficulty: prog.difficulty,
      duration: prog.duration, frequency: prog.frequency,
      goal: prog.goal,
      modules: prog.modules.length > 0 ? prog.modules : [emptyModule()],
    });
    setMode('edit');
  };

  // ── Render form ────────────────────────────────────────────────────────────
  if (mode === 'create' || mode === 'edit') {
    return (
      <div className="max-w-2xl mx-auto">
        <ProgramForm
          initial={mode === 'edit' && editForm ? editForm : emptyForm()}
          onSave={handleSave}
          onCancel={() => { setMode('list'); setEditForm(null); }}
          saving={saving}
        />
      </div>
    );
  }

  // ── Render detail ──────────────────────────────────────────────────────────
  if (selected) {
    return (
      <div className="max-w-2xl mx-auto pb-10">
        <ProgramDetail
          prog={selected}
          isAdmin={isAdmin}
          onBack={() => setSelected(null)}
          onEdit={() => { startEdit(selected); }}
          onDelete={() => handleDelete(selected)}
        />
      </div>
    );
  }

  // ── Render list ────────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Dumbbell className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Programs</h1>
            <p className="text-xs text-muted-foreground mt-0.5">{programs.length} program{programs.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchPrograms} disabled={loading}>
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          {isAdmin && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => { setShowImport(true); setImportText(''); setImportError(''); }}>
                <Upload className="h-3.5 w-3.5 mr-1" /> Import
              </Button>
              <Button size="sm" onClick={() => setMode('create')}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Create
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Category filter */}
      {categories.length > 2 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {categories.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold border transition-colors
                ${activeCategory === cat ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-muted-foreground border-border hover:bg-muted'}`}>
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="text-center py-16 text-muted-foreground">
          <RefreshCw className="h-8 w-8 mx-auto mb-3 opacity-30 animate-spin" />
          <p className="text-sm">Loading programs...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Dumbbell className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">{programs.length === 0 ? 'No programs yet' : 'No programs in this category'}</p>
          {isAdmin && programs.length === 0 && (
            <p className="text-xs mt-1 opacity-70">Click <strong>Create</strong> to add the first program.</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map(prog => (
            <ProgramCard key={prog.id} prog={prog} onClick={() => setSelected(prog)} />
          ))}
        </div>
      )}
      {/* Import Modal */}
      {showImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowImport(false)}>
          <div className="relative w-full max-w-md h-[520px] bg-background rounded-2xl shadow-xl overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b">
              <div className="flex items-center gap-2">
                <FileJson className="h-5 w-5 text-primary" />
                <h2 className="text-base font-semibold">Import Program</h2>
              </div>
              <button onClick={() => setShowImport(false)} className="p-1 rounded hover:bg-muted text-muted-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              <p className="text-sm text-muted-foreground">Paste JSON below or upload a <code className="text-xs bg-muted px-1 py-0.5 rounded">.json</code> file. Accepts a single program object or an array of programs.</p>

              {/* Format reference — opens full-screen view */}
              <button onClick={() => setShowFormat(true)}
                className="text-xs text-primary hover:underline flex items-center gap-1">
                <FileJson className="h-3.5 w-3.5" /> View expected JSON format
              </button>

              {/* File upload */}
              <div>
                <label className="flex items-center gap-2 text-sm cursor-pointer text-primary hover:underline">
                  <Upload className="h-4 w-4" />
                  Upload .json file
                  <input type="file" accept=".json,application/json" className="hidden" onChange={handleImportFile} />
                </label>
              </div>

              {/* Paste area */}
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground font-medium">Or paste JSON here:</p>
                <Textarea
                  placeholder='{ "title": "My Program", ... }'
                  value={importText}
                  onChange={e => { setImportText(e.target.value); setImportError(''); }}
                  rows={8}
                  className="text-xs font-mono resize-y"
                />
              </div>

              {importError && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2">
                  <p className="text-xs text-destructive font-medium whitespace-pre-wrap">{importError}</p>
                </div>
              )}

              <Button onClick={handleImport} disabled={!importText.trim()} className="w-full">
                <Upload className="h-4 w-4 mr-2" /> Import Program
              </Button>
            </div>
          </div>

          {/* Format view — full overlay */}
          {showFormat && (
            <div className="absolute inset-0 bg-background rounded-2xl overflow-y-auto z-10 flex flex-col">
              <div className="flex items-center gap-3 px-5 pt-5 pb-3 border-b sticky top-0 bg-background">
                <button onClick={() => setShowFormat(false)}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  ← Back
                </button>
                <h3 className="text-sm font-semibold">Expected JSON Format</h3>
              </div>
              <div className="p-5 space-y-4 text-xs">
                <p className="text-muted-foreground">Paste or upload a <code className="bg-muted px-1 py-0.5 rounded">.json</code> file matching this structure. You can import a single program object or an array <code className="bg-muted px-1 py-0.5 rounded">[ ]</code> of programs.</p>
                <pre className="bg-muted rounded-xl p-4 text-xs leading-relaxed overflow-x-auto whitespace-pre font-mono">{`{
  "title": "My Program",
  "subtitle": "Optional short description",
  "category": "Running",
  "difficulty": "Beginner",
  "duration": "8 weeks",
  "frequency": "4×/week",
  "goal": "Run 5km without stopping",
  "modules": [
    {
      "label": "Weeks 1–2",
      "focus": "Base Building",
      "sessions": [
        {
          "name": "Day A — Easy Run",
          "exercises": [
            { "text": "5 min brisk walk warm-up" },
            { "text": "8× (1 min run / 2 min walk)" },
            { "text": "5 min cool-down walk" }
          ]
        },
        {
          "name": "Day B — Strength",
          "exercises": [
            { "text": "3×15 push-ups" },
            { "text": "3×20 sit-ups" },
            { "text": "Plank 3×30s" }
          ]
        }
      ],
      "tips": [
        "Run at a conversational pace",
        "Sleep 7–8 hrs for recovery"
      ]
    },
    {
      "label": "Weeks 3–4",
      "focus": "Progressive Overload",
      "sessions": [
        {
          "name": "Continuous Run",
          "exercises": [
            { "text": "25 min easy continuous jog" }
          ]
        }
      ],
      "tips": []
    }
  ]
}`}</pre>

                <div className="space-y-2">
                  <p className="font-semibold text-foreground">Field reference</p>
                  {[
                    ['title',      'string',  'Required. Program name.'],
                    ['subtitle',   'string',  'Optional. Short tagline.'],
                    ['category',   'string',  'e.g. IPPT, Running, Strength, Swimming, SFT, Home, Gym, Other'],
                    ['difficulty', 'string',  'Must be: Beginner | Intermediate | Advanced'],
                    ['duration',   'string',  'e.g. "8 weeks", "4 sessions"'],
                    ['frequency',  'string',  'e.g. "4×/week", "Daily"'],
                    ['goal',       'string',  'Optional. One-line target outcome.'],
                    ['modules',    'array',   'List of training blocks (weeks, phases, days).'],
                    ['label',      'string',  'Module heading, e.g. "Weeks 1–2" or "Push Day"'],
                    ['focus',      'string',  'Module theme, e.g. "Base Building"'],
                    ['sessions',   'array',   'Training sessions within the module.'],
                    ['name',       'string',  'Session name, e.g. "Day A – Easy Run"'],
                    ['exercises',  'array',   'List of { "text": "..." } objects — one per instruction line.'],
                    ['tips',       'array',   'Optional coach tips as plain strings.'],
                  ].map(([field, type, desc]) => (
                    <div key={field} className="flex gap-2 border-b pb-1.5 last:border-0">
                      <code className="text-primary font-mono w-24 shrink-0">{field}</code>
                      <span className="text-muted-foreground w-16 shrink-0">{type}</span>
                      <span className="text-foreground">{desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
