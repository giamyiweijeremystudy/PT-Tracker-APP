import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Activity, Plus, Trash2, Pencil, MapPin, Image, X, Check, Loader2 } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type ActivityType =
  | 'running' | 'jogging' | 'walking'
  | 'swimming' | 'cycling'
  | 'ippt_training' | 'gym' | 'strength_training' | 'calisthenics'
  | 'others';

const ACTIVITY_TYPES: { value: ActivityType; label: string; emoji: string }[] = [
  { value: 'running',           label: 'Running',           emoji: '🏃' },
  { value: 'swimming',          label: 'Swimming',          emoji: '🏊' },
  { value: 'ippt_training',     label: 'IPPT Training',     emoji: '🪖' },
  { value: 'gym',               label: 'Gym',               emoji: '🏋️' },
  { value: 'cycling',           label: 'Cycling',           emoji: '🚴' },
  { value: 'strength_training', label: 'Strength Training', emoji: '💪' },
  { value: 'calisthenics',      label: 'Calisthenics',      emoji: '🤸' },
  { value: 'walking',           label: 'Walking',           emoji: '🚶' },
  { value: 'jogging',           label: 'Jogging',           emoji: '👟' },
  { value: 'others',            label: 'Others',            emoji: '➕' },
];

const DISTANCE_TYPES: ActivityType[] = ['running', 'jogging', 'walking', 'swimming', 'cycling'];
const IPPT_TYPES:     ActivityType[] = ['ippt_training'];
const GYM_TYPES:      ActivityType[] = ['gym', 'strength_training', 'calisthenics'];
const SWIM_TYPES:     ActivityType[] = ['swimming'];

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
  image_url: string | null;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
};

const fmtTime = (sec: number | null) => {
  if (!sec) return '—';
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
};

function typeLabel(a: SavedActivity) {
  if (a.type === 'others' && a.custom_type) return a.custom_type;
  return ACTIVITY_TYPES.find(t => t.value === a.type)?.label ?? a.type;
}
function typeEmoji(a: SavedActivity) {
  if (a.type === 'others') return '➕';
  return ACTIVITY_TYPES.find(t => t.value === a.type)?.emoji ?? '🏃';
}

function activityStats(a: SavedActivity): { label: string; value: string }[] {
  const stats: { label: string; value: string }[] = [];
  if (a.duration_minutes) stats.push({ label: 'Duration', value: `${a.duration_minutes} min` });
  if (a.distance_km)      stats.push({ label: 'Distance', value: `${a.distance_km} km` });
  if (a.pace_per_km)      stats.push({ label: 'Pace',     value: `${fmtTime(a.pace_per_km)}/km` });
  if (a.laps)             stats.push({ label: 'Laps',     value: `${a.laps}` });
  if (a.pool_length_m)    stats.push({ label: 'Pool',     value: `${a.pool_length_m}m` });
  if (a.pushups)          stats.push({ label: 'Push-ups', value: `${a.pushups}` });
  if (a.situps)           stats.push({ label: 'Sit-ups',  value: `${a.situps}` });
  if (a.run_seconds)      stats.push({ label: 'Run',      value: fmtTime(a.run_seconds) });
  if (a.sets)             stats.push({ label: 'Sets',     value: `${a.sets}` });
  if (a.reps)             stats.push({ label: 'Reps',     value: `${a.reps}` });
  if (a.weight_kg)        stats.push({ label: 'Weight',   value: `${a.weight_kg} kg` });
  return stats;
}

// ─── Form state ───────────────────────────────────────────────────────────────

const defaultForm = () => ({
  date: new Date().toISOString().split('T')[0],
  type: 'running' as ActivityType,
  title: '',
  custom_type: '',
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
  location: '',
  latitude: '',
  longitude: '',
});

type FormState = ReturnType<typeof defaultForm>;

// ─── Component ────────────────────────────────────────────────────────────────

const ActivityForm = ({
  formData, setField, imgPreview, setImgPreview, imgFile, onImageChange,
  locatingState, setLocatingState, onSave, onCancel, savingState, isEdit
}: {
  formData: FormState;
  setField: (key: keyof FormState, value: string) => void;
  imgPreview: string | null;
  setImgPreview: (v: string | null) => void;
  imgFile: File | null;
  onImageChange: (file: File | undefined) => void;
  locatingState: boolean;
  setLocatingState: (v: boolean) => void;
  onSave: () => void;
  onCancel: () => void;
  savingState: boolean;
  isEdit?: boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;
}) => {
  const t = formData.type;
  return (
    <div className="space-y-4">
      {/* Date + Type */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Date</Label>
          <Input type="date" value={formData.date} onChange={e => setField('date', e.target.value)} />
        </div>
      </div>

      {/* Activity type grid */}
      <div className="space-y-2">
        <Label>Activity Type</Label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {ACTIVITY_TYPES.map(at => (
            <button key={at.value} onClick={() => setField('type', at.value)}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${formData.type === at.value ? 'border-primary bg-primary/10 text-primary font-medium' : 'border-border bg-background text-muted-foreground hover:bg-muted'}`}>
              <span>{at.emoji}</span><span>{at.label}</span>
            </button>
          ))}
        </div>
      </div>

      {t === 'others' && (
        <div className="space-y-2">
          <Label>Custom Activity Name</Label>
          <Input placeholder="e.g. Rock Climbing, Yoga..." value={formData.custom_type} onChange={e => setField('custom_type', e.target.value)} />
        </div>
      )}

      {/* Title */}
      <div className="space-y-2">
        <Label>Title</Label>
        <Input placeholder="e.g. Morning Run, Leg Day..." value={formData.title} onChange={e => setField('title', e.target.value)} />
      </div>

      {/* Duration */}
      <div className="space-y-2">
        <Label>Duration (minutes)</Label>
        <Input type="number" placeholder="e.g. 45" value={formData.duration_minutes} onChange={e => setField('duration_minutes', e.target.value)} className="max-w-[160px]" />
      </div>

      {/* Distance */}
      {DISTANCE_TYPES.includes(t) && t !== 'swimming' && (
        <div className="space-y-2">
          <Label>Distance (km)</Label>
          <Input type="number" step="0.1" placeholder="e.g. 5.0" value={formData.distance_km} onChange={e => setField('distance_km', e.target.value)} className="max-w-[160px]" />
          {formData.distance_km && formData.duration_minutes && (
            <p className="text-xs text-muted-foreground">Pace: {fmtTime(Math.round((parseInt(formData.duration_minutes) * 60) / parseFloat(formData.distance_km)))}/km</p>
          )}
        </div>
      )}

      {/* Swimming */}
      {SWIM_TYPES.includes(t) && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2"><Label>Distance (km)</Label><Input type="number" step="0.01" placeholder="1.0" value={formData.distance_km} onChange={e => setField('distance_km', e.target.value)} /></div>
          <div className="space-y-2"><Label>Laps</Label><Input type="number" placeholder="40" value={formData.laps} onChange={e => setField('laps', e.target.value)} /></div>
          <div className="space-y-2"><Label>Pool Length (m)</Label><Input type="number" placeholder="25 or 50" value={formData.pool_length_m} onChange={e => setField('pool_length_m', e.target.value)} /></div>
        </div>
      )}

      {/* IPPT */}
      {IPPT_TYPES.includes(t) && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">IPPT Stations</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Push-ups</Label><Input type="number" placeholder="reps" value={formData.pushups} onChange={e => setField('pushups', e.target.value)} /></div>
            <div className="space-y-2"><Label>Sit-ups</Label><Input type="number" placeholder="reps" value={formData.situps} onChange={e => setField('situps', e.target.value)} /></div>
            <div className="col-span-2 space-y-2">
              <Label>2.4km Run (MM : SS)</Label>
              <div className="flex items-center gap-2">
                <Input type="number" placeholder="MM" value={formData.run_min} onChange={e => setField('run_min', e.target.value)} className="w-20" />
                <span className="text-muted-foreground">:</span>
                <Input type="number" placeholder="SS" value={formData.run_sec} onChange={e => setField('run_sec', e.target.value)} className="w-20" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Gym */}
      {GYM_TYPES.includes(t) && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">Session Details</p>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2"><Label>Sets</Label><Input type="number" placeholder="3" value={formData.sets} onChange={e => setField('sets', e.target.value)} /></div>
            <div className="space-y-2"><Label>Reps</Label><Input type="number" placeholder="10" value={formData.reps} onChange={e => setField('reps', e.target.value)} /></div>
            <div className="space-y-2"><Label>Weight (kg)</Label><Input type="number" step="0.5" placeholder="60" value={formData.weight_kg} onChange={e => setField('weight_kg', e.target.value)} /></div>
          </div>
        </div>
      )}

      {/* Location */}
      <div className="space-y-2">
        <Label>Location</Label>
        <div className="flex gap-2">
          <Input placeholder="e.g. Bishan Park" value={formData.location} onChange={e => setField('location', e.target.value)} />
          <Button type="button" variant="outline" size="icon" disabled={locatingState}
            onClick={() => getLocation(setLocatingState, setField)}
            title="Use current location">
            {locatingState ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label>Description / Notes</Label>
        <Textarea placeholder="How did it go?" value={formData.description} onChange={e => setField('description', e.target.value)} rows={3} />
      </div>

      {/* Image upload */}
      <div className="space-y-2">
        <Label>Photo</Label>
        {imgPreview ? (
          <div className="relative w-full rounded-xl overflow-hidden">
            <img src={imgPreview} alt="preview" className="w-full max-h-64 object-cover" />
            <button onClick={() => { setImgPreview(null); }}
              className="absolute top-2 right-2 bg-black/60 rounded-full p-1 text-white hover:bg-black/80">
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button onClick={() => (isEdit ? editFileRef : fileRef).current?.click()}
            className="w-full rounded-xl border-2 border-dashed border-border p-6 text-center text-muted-foreground hover:bg-muted/40 transition-colors">
            <Image className="h-6 w-6 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Tap to add a photo</p>
          </button>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <Button onClick={onSave} disabled={savingState} className="flex-1">
          {savingState ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{isEdit ? 'Saving...' : 'Posting...'}</> : <><Check className="h-4 w-4 mr-2" />{isEdit ? 'Save Changes' : 'Post Activity'}</>}
        </Button>
        <Button onClick={onCancel} variant="outline" className="flex-1">
          <X className="h-4 w-4 mr-2" />Cancel
        </Button>
      </div>
    </div>
  );
};

export default function Activities() {
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const [activities, setActivities] = useState<SavedActivity[]>([]);
  const [form, setForm] = useState<FormState>(defaultForm());
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<FormState>(defaultForm());
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const [editLocating, setEditLocating] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const editFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (user) fetchActivities(); }, [user]);

  const fetchActivities = async () => {
    const { data } = await supabase
      .from('activities').select('*').eq('user_id', user!.id)
      .order('date', { ascending: false }).order('created_at', { ascending: false });
    if (data) setActivities(data as SavedActivity[]);
  };

  const f = (key: keyof FormState, value: string) => setForm(p => ({ ...p, [key]: value }));
  const ef = (key: keyof FormState, value: string) => setEditForm(p => ({ ...p, [key]: value }));

  // Upload image to Supabase storage
  const uploadImage = async (file: File, userId: string): Promise<string | null> => {
    const ext = file.name.split('.').pop();
    const path = `${userId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('activity-images').upload(path, file);
    if (error) return null;
    const { data } = supabase.storage.from('activity-images').getPublicUrl(path);
    return data.publicUrl;
  };

  const getLocation = (setLocatingFn: (v: boolean) => void, setFormFn: (key: keyof FormState, value: string) => void) => {
    if (!navigator.geolocation) { toast({ title: 'Geolocation not supported', variant: 'destructive' }); return; }
    setLocatingFn(true);
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const { latitude, longitude } = pos.coords;
        setFormFn('latitude', String(latitude));
        setFormFn('longitude', String(longitude));
        // Reverse geocode using free API
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
          const data = await res.json();
          const loc = data.address?.suburb || data.address?.city_district || data.address?.city || data.display_name?.split(',')[0] || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
          setFormFn('location', loc);
        } catch {
          setFormFn('location', `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        }
        setLocatingFn(false);
      },
      () => { toast({ title: 'Could not get location', variant: 'destructive' }); setLocatingFn(false); }
    );
  };

  const buildInsertPayload = (formData: FormState, imageUrl: string | null, userId: string) => {
    const run_seconds = (formData.run_min || formData.run_sec)
      ? parseInt(formData.run_min || '0') * 60 + parseInt(formData.run_sec || '0') : null;
    const distance_km = formData.distance_km ? parseFloat(formData.distance_km) : null;
    const duration_minutes = formData.duration_minutes ? parseInt(formData.duration_minutes) : null;
    const pace_per_km = distance_km && duration_minutes && DISTANCE_TYPES.includes(formData.type) && formData.type !== 'cycling' && formData.type !== 'swimming'
      ? Math.round((duration_minutes * 60) / distance_km) : null;
    return {
      user_id: userId,
      date: formData.date,
      type: formData.type,
      title: formData.title || null,
      custom_type: formData.type === 'others' ? formData.custom_type || null : null,
      duration_minutes,
      distance_km,
      pace_per_km,
      laps: formData.laps ? parseInt(formData.laps) : null,
      pool_length_m: formData.pool_length_m ? parseInt(formData.pool_length_m) : null,
      pushups: formData.pushups ? parseInt(formData.pushups) : null,
      situps: formData.situps ? parseInt(formData.situps) : null,
      run_seconds,
      sets: formData.sets ? parseInt(formData.sets) : null,
      reps: formData.reps ? parseInt(formData.reps) : null,
      weight_kg: formData.weight_kg ? parseFloat(formData.weight_kg) : null,
      description: formData.description || null,
      image_url: imageUrl,
      location: formData.location || null,
      latitude: formData.latitude ? parseFloat(formData.latitude) : null,
      longitude: formData.longitude ? parseFloat(formData.longitude) : null,
    };
  };

  const save = async () => {
    setSaving(true);
    let imageUrl: string | null = null;
    if (imageFile) imageUrl = await uploadImage(imageFile, user!.id);
    const payload = buildInsertPayload(form, imageUrl, user!.id);
    const { error } = await supabase.from('activities').insert(payload);
    setSaving(false);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); }
    else {
      toast({ title: 'Activity posted!' });
      setForm(defaultForm()); setImageFile(null); setImagePreview(null); setShowForm(false);
      fetchActivities();
    }
  };

  const startEdit = (a: SavedActivity) => {
    const runMin = a.run_seconds ? String(Math.floor(a.run_seconds / 60)) : '';
    const runSec = a.run_seconds ? String(a.run_seconds % 60) : '';
    setEditForm({
      date: a.date,
      type: (a.type as ActivityType) || 'running',
      title: a.title || '',
      custom_type: a.custom_type || '',
      duration_minutes: a.duration_minutes ? String(a.duration_minutes) : '',
      distance_km: a.distance_km ? String(a.distance_km) : '',
      laps: a.laps ? String(a.laps) : '',
      pool_length_m: a.pool_length_m ? String(a.pool_length_m) : '',
      pushups: a.pushups ? String(a.pushups) : '',
      situps: a.situps ? String(a.situps) : '',
      run_min: runMin, run_sec: runSec,
      sets: a.sets ? String(a.sets) : '',
      reps: a.reps ? String(a.reps) : '',
      weight_kg: a.weight_kg ? String(a.weight_kg) : '',
      description: a.description || '',
      location: a.location || '',
      latitude: a.latitude ? String(a.latitude) : '',
      longitude: a.longitude ? String(a.longitude) : '',
    });
    setEditImagePreview(a.image_url || null);
    setEditImageFile(null);
    setEditingId(a.id);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    setEditSaving(true);
    let imageUrl = editImagePreview; // keep existing if no new file
    if (editImageFile) imageUrl = await uploadImage(editImageFile, user!.id);
    const payload = buildInsertPayload(editForm, imageUrl, user!.id);
    const { error } = await supabase.from('activities').update(payload).eq('id', editingId);
    setEditSaving(false);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); }
    else { toast({ title: 'Activity updated!' }); setEditingId(null); fetchActivities(); }
  };

  const deleteActivity = async (id: string, imageUrl: string | null) => {
    setDeleting(id);
    if (imageUrl) {
      const path = imageUrl.split('/activity-images/')[1];
      if (path) await supabase.storage.from('activity-images').remove([path]);
    }
    const { error } = await supabase.from('activities').delete().eq('id', id);
    setDeleting(null);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); }
    else { toast({ title: 'Deleted' }); fetchActivities(); }
  };

  const handleImageChange = (file: File | undefined, preview: boolean) => {
    if (!file) return;
    if (preview) {
      setEditImageFile(file);
      setEditImagePreview(URL.createObjectURL(file));
    } else {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const initials = profile?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';


  return (
    <div className="max-w-xl mx-auto space-y-4 pb-10">

      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-3">
          <Activity className="h-7 w-7 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Activities</h1>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)} size="sm">
            <Plus className="h-4 w-4 mr-1" /> Log Activity
          </Button>
        )}
      </div>

      {/* New activity form */}
      {showForm && (
        <div className="rounded-2xl border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold shrink-0">{initials}</div>
            <div>
              <p className="text-sm font-semibold text-foreground">{profile?.full_name || 'You'}</p>
              <p className="text-xs text-muted-foreground">Logging a new activity</p>
            </div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden"
            onChange={e => handleImageChange(e.target.files?.[0], false)} />
          <ActivityForm
            formData={form} setField={f}
            imgPreview={imagePreview} setImgPreview={setImagePreview}
            imgFile={imageFile} onImageChange={file => handleImageChange(file, false)}
            locatingState={locating} setLocatingState={setLocating}
            onSave={save} onCancel={() => { setShowForm(false); setForm(defaultForm()); setImagePreview(null); setImageFile(null); }}
            savingState={saving} fileInputRef={fileRef}
          />
        </div>
      )}

      {/* Activity feed */}
      {activities.length === 0 && !showForm ? (
        <div className="text-center py-16 text-muted-foreground">
          <Activity className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No activities yet</p>
          <p className="text-sm mt-1">Hit "Log Activity" to post your first one</p>
        </div>
      ) : (
        activities.map(a => (
          <div key={a.id} className="rounded-2xl border bg-card shadow-sm overflow-hidden">

            {/* Editing mode */}
            {editingId === a.id ? (
              <div className="p-4">
                <p className="text-sm font-semibold mb-4 text-foreground">Editing activity</p>
                <input ref={editFileRef} type="file" accept="image/*" className="hidden"
                  onChange={e => handleImageChange(e.target.files?.[0], true)} />
                <ActivityForm
                  formData={editForm} setField={ef}
                  imgPreview={editImagePreview} setImgPreview={setEditImagePreview}
                  imgFile={editImageFile} onImageChange={file => handleImageChange(file, true)}
                  locatingState={editLocating} setLocatingState={setEditLocating}
                  onSave={saveEdit} onCancel={() => setEditingId(null)}
                  savingState={editSaving} isEdit fileInputRef={editFileRef}
                />
              </div>
            ) : (
              <>
                {/* Post header */}
                <div className="flex items-center justify-between px-4 pt-4 pb-2">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold shrink-0">{initials}</div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-semibold text-foreground">{profile?.full_name || 'You'}</p>
                        <span className="text-base">{typeEmoji(a)}</span>
                        <span className="text-xs font-medium text-primary">{typeLabel(a)}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <span>{new Date(a.date).toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        {a.location && <><span>·</span><MapPin className="h-3 w-3" /><span>{a.location}</span></>}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => startEdit(a)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" disabled={deleting === a.id} onClick={() => deleteActivity(a.id, a.image_url)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Title */}
                {a.title && <p className="px-4 pb-1 text-sm font-semibold text-foreground">{a.title}</p>}

                {/* Description */}
                {a.description && <p className="px-4 pb-2 text-sm text-foreground leading-relaxed">{a.description}</p>}

                {/* Image */}
                {a.image_url && (
                  <div className="w-full">
                    <img src={a.image_url} alt="activity" className="w-full max-h-80 object-cover" />
                  </div>
                )}

                {/* Stats bar */}
                {activityStats(a).length > 0 && (
                  <div className="flex flex-wrap gap-x-4 gap-y-1 px-4 py-3 border-t">
                    {activityStats(a).map(s => (
                      <div key={s.label} className="text-center">
                        <div className="text-xs text-muted-foreground">{s.label}</div>
                        <div className="text-sm font-semibold text-foreground">{s.value}</div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        ))
      )}
    </div>
  );
}
