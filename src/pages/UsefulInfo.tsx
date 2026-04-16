import { useState, useEffect, useCallback, useRef } from ‘react’;
import { useAuth } from ‘@/hooks/useAuth’;
import { supabase } from ‘@/integrations/supabase/client’;
import { useTeam } from ‘@/contexts/TeamContext’;
import { Card, CardContent, CardHeader, CardTitle } from ‘@/components/ui/card’;
import { Button } from ‘@/components/ui/button’;
import { Input } from ‘@/components/ui/input’;
import { Label } from ‘@/components/ui/label’;
import { Textarea } from ‘@/components/ui/textarea’;
import { Checkbox } from ‘@/components/ui/checkbox’;
import { useToast } from ‘@/hooks/use-toast’;
import {
AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from ‘@/components/ui/alert-dialog’;
import { Info, Plus, Pencil, Trash2, X, Save, Upload, ChevronDown, ChevronUp, Image, ExternalLink, Lock } from ‘lucide-react’;

interface InfoModule {
id: string;
created_by: string;
title: string;
content: string;
image_urls: string[];
position: number;
is_spartan_only: boolean;
created_at: string;
updated_at: string;
}

function Linkify({ text }: { text: string }) {
const URL_RE = /(https?://[^\s]+)/g;
const parts = text.split(URL_RE);
return (
<>
{parts.map((part, i) =>
URL_RE.test(part) ? (
<a
key={i}
href={part}
target="_blank"
rel="noopener noreferrer"
className="text-primary underline underline-offset-2 hover:opacity-80 inline-flex items-center gap-0.5 break-all"
>
{part}
<ExternalLink className="h-3 w-3 shrink-0 ml-0.5" />
</a>
) : (
<span key={i} className="whitespace-pre-wrap">{part}</span>
)
)}
</>
);
}

const emptyForm = () => ({ title: ‘’, content: ‘’, isSpartanOnly: false });

export default function UsefulInfo() {
const { user, profile } = useAuth();
const { toast } = useToast();
const { myTeamRole } = useTeam();

const isAdmin = (profile as any)?.is_admin === true;
const isSpartan =
isAdmin ||
(Array.isArray(myTeamRole) &&
(myTeamRole.includes(‘spartan’) ||
myTeamRole.includes(‘admin’) ||
myTeamRole.includes(‘pt_ic’)));

const [modules, setModules] = useState<InfoModule[]>([]);
const [loading, setLoading] = useState(true);
const [expanded, setExpanded] = useState<string | null>(null);
const [showForm, setShowForm] = useState(false);
const [editingId, setEditingId] = useState<string | null>(null);
const [form, setForm] = useState(emptyForm());
const [saving, setSaving] = useState(false);
const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
const [formImages, setFormImages] = useState<string[]>([]);
const fileInputRef = useRef<HTMLInputElement>(null);

const fetchModules = useCallback(async () => {
setLoading(true);
const { data } = await supabase
.from(‘info_modules’)
.select(’*’)
.order(‘position’, { ascending: true });
if (data) {
const visible = (data as InfoModule[]).filter(
(m) => !m.is_spartan_only || isSpartan
);
setModules(visible);
}
setLoading(false);
}, [isSpartan]);

useEffect(() => {
fetchModules();
}, [fetchModules]);

const openCreate = () => {
setEditingId(null);
setForm(emptyForm());
setFormImages([]);
setShowForm(true);
};

const openEdit = (m: InfoModule) => {
setEditingId(m.id);
setForm({ title: m.title, content: m.content, isSpartanOnly: m.is_spartan_only ?? false });
setFormImages(m.image_urls ?? []);
setShowForm(true);
setExpanded(null);
};

const closeForm = () => {
setShowForm(false);
setEditingId(null);
setForm(emptyForm());
setFormImages([]);
};

const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
const files = Array.from(e.target.files ?? []);
if (!files.length || !user) return;
for (const file of files) {
if (!file.type.startsWith(‘image/’)) {
toast({ title: ‘Only image files are supported’, variant: ‘destructive’ });
continue;
}
setUploadingIdx(formImages.length);
const ext = file.name.split(’.’).pop();
const path = ‘info_modules/’ + user.id + ‘/’ + Date.now() + ‘_’ + Math.random().toString(36).slice(2) + ‘.’ + ext;
const { error } = await supabase.storage.from(‘uploads’).upload(path, file, { upsert: false });
if (error) {
toast({ title: ‘Upload failed’, description: error.message, variant: ‘destructive’ });
setUploadingIdx(null);
continue;
}
const { data: { publicUrl } } = supabase.storage.from(‘uploads’).getPublicUrl(path);
setFormImages((prev) => […prev, publicUrl]);
setUploadingIdx(null);
}
if (fileInputRef.current) fileInputRef.current.value = ‘’;
};

const removeImage = (idx: number) => {
setFormImages((prev) => prev.filter((_, i) => i !== idx));
};

const handleSave = async () => {
if (!form.title.trim()) {
toast({ title: ‘Title is required’, variant: ‘destructive’ });
return;
}
if (!user) return;
setSaving(true);
if (editingId) {
const { error } = await supabase
.from(‘info_modules’)
.update({
title: form.title.trim(),
content: form.content.trim(),
image_urls: formImages,
is_spartan_only: form.isSpartanOnly,
updated_at: new Date().toISOString(),
})
.eq(‘id’, editingId);
if (error) {
toast({ title: ‘Error saving’, description: error.message, variant: ‘destructive’ });
} else {
toast({ title: ‘Module updated!’ });
closeForm();
fetchModules();
}
} else {
const { error } = await supabase.from(‘info_modules’).insert({
created_by: user.id,
title: form.title.trim(),
content: form.content.trim(),
image_urls: formImages,
is_spartan_only: form.isSpartanOnly,
position: modules.length,
});
if (error) {
toast({ title: ‘Error saving’, description: error.message, variant: ‘destructive’ });
} else {
toast({ title: ‘Module created!’ });
closeForm();
fetchModules();
}
}
setSaving(false);
};

const handleDelete = async (id: string) => {
const { error } = await supabase.from(‘info_modules’).delete().eq(‘id’, id);
if (error) {
toast({ title: ‘Error deleting’, description: error.message, variant: ‘destructive’ });
} else {
toast({ title: ‘Module deleted’ });
fetchModules();
}
};

return (
<div className="max-w-2xl mx-auto space-y-4 pb-10">

```
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-3">
      <Info className="h-7 w-7 text-primary" />
      <h1 className="text-2xl font-bold text-foreground">Useful Information</h1>
    </div>
    {isAdmin && !showForm && (
      <Button size="sm" onClick={openCreate}>
        <Plus className="h-4 w-4 mr-1" /> Add Module
      </Button>
    )}
  </div>

  {showForm && isAdmin && (
    <Card className="border-primary/40">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-base">{editingId ? 'Edit Module' : 'New Module'}</CardTitle>
        <button onClick={closeForm} className="p-1 rounded hover:bg-muted">
          <X className="h-4 w-4" />
        </button>
      </CardHeader>
      <CardContent className="space-y-4">

        <div className="space-y-1.5">
          <Label>Title</Label>
          <Input
            placeholder="e.g. SAF Fitness Test Standards"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          />
        </div>

        <div className="space-y-1.5">
          <Label>Content</Label>
          <Textarea
            placeholder="Write anything here — tips, links, standards, notes..."
            value={form.content}
            onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
            rows={10}
            className="font-mono text-sm resize-y"
          />
          <p className="text-xs text-muted-foreground">
            URLs starting with http:// or https:// will become clickable links.
          </p>
        </div>

        <div className="space-y-2">
          <Label>Images <span className="text-muted-foreground text-xs">(optional)</span></Label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleImageUpload}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingIdx !== null}
          >
            <Upload className="h-4 w-4 mr-2" />
            {uploadingIdx !== null ? 'Uploading...' : 'Upload Images'}
          </Button>
          {formImages.length > 0 && (
            <div className="grid grid-cols-2 gap-2 mt-2">
              {formImages.map((url, i) => (
                <div key={i} className="relative group rounded-lg overflow-hidden border">
                  <img src={url} alt="" className="w-full h-32 object-cover" />
                  <button
                    onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/10 px-3 py-2.5">
          <Checkbox
            id="spartan-only"
            checked={form.isSpartanOnly}
            onCheckedChange={(v) => setForm((f) => ({ ...f, isSpartanOnly: !!v }))}
            className="mt-0.5"
          />
          <div>
            <label
              htmlFor="spartan-only"
              className="text-sm font-medium text-red-700 dark:text-red-400 cursor-pointer flex items-center gap-1.5"
            >
              <Lock className="h-3.5 w-3.5" /> Spartan Only
            </label>
            <p className="text-xs text-red-600/70 dark:text-red-400/60 mt-0.5">
              Only members with the Spartan role can see this module
            </p>
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <Button onClick={handleSave} disabled={saving} className="flex-1">
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Create Module'}
          </Button>
          <Button variant="outline" onClick={closeForm}>Cancel</Button>
        </div>
      </CardContent>
    </Card>
  )}

  {loading ? (
    <div className="text-center py-16 text-muted-foreground text-sm">Loading...</div>
  ) : modules.length === 0 ? (
    <div className="text-center py-16 text-muted-foreground">
      <Info className="h-10 w-10 mx-auto mb-3 opacity-30" />
      <p className="text-sm font-medium">No modules yet</p>
      {isAdmin && <p className="text-xs mt-1 opacity-70">Click Add Module to create one</p>}
    </div>
  ) : (
    <div className="space-y-3">
      {modules.map((m) => {
        const isOpen = expanded === m.id;
        return (
          <div key={m.id} className="rounded-xl border bg-card overflow-hidden shadow-sm">
            <button
              className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-muted/40 transition-colors"
              onClick={() => setExpanded(isOpen ? null : m.id)}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Info className="h-4 w-4 text-primary shrink-0" />
                <span className="font-semibold text-sm truncate">{m.title}</span>
                {m.is_spartan_only && (
                  <span className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200 shrink-0">
                    <Lock className="h-2.5 w-2.5" /> Spartan
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-2">
                {isAdmin && (
                  <>
                    <button
                      onClick={(e) => { e.stopPropagation(); openEdit(m); }}
                      className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button
                          onClick={(e) => e.stopPropagation()}
                          className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete module?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently remove this module.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(m.id)}
                            className="bg-destructive text-destructive-foreground"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </>
                )}
                {isOpen
                  ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  : <ChevronDown className="h-4 w-4 text-muted-foreground" />
                }
              </div>
            </button>

            {isOpen && (
              <div className="px-4 pb-4 space-y-4 border-t pt-3">
                {m.content && (
                  <p className="text-sm leading-relaxed text-foreground">
                    <Linkify text={m.content} />
                  </p>
                )}
                {m.image_urls?.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Image className="h-3.5 w-3.5" />
                      <span>{m.image_urls.length} image{m.image_urls.length !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {m.image_urls.map((url, i) => (
                        <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                          <img
                            src={url}
                            alt=""
                            className="w-full rounded-lg border object-contain max-h-80 bg-muted hover:opacity-95 transition-opacity"
                          />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  )}
</div>
```

);
}
