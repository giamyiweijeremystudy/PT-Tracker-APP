import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ShieldCheck, Pencil, Trash2, X, Check, Search, Loader2, Users } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface UserRow {
  id: string;
  email: string;
  created_at: string;
  full_name: string;
  rank: string;

  is_admin: boolean;
}

interface EditState {
  full_name: string;
  rank: string;

  is_admin: boolean;
}

const RANKS = ['ME1T', 'ME2', 'ME3', 'ME4', 'ME4T', 'ME5', 'ME6', 'ME7', 'Other'];

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function AdminPanel() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const isAppAdmin = (profile as any)?.is_admin === true;

  // Redirect non-admins immediately
  useEffect(() => {
    if (profile !== null && !isAppAdmin) navigate('/', { replace: true });
  }, [profile, isAppAdmin, navigate]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    // Fetch all profiles
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, full_name, rank, is_admin, created_at')
      .order('created_at', { ascending: true });

    if (error) {
      toast({ title: 'Error loading users', description: error.message, variant: 'destructive' });
      setLoading(false);
      return;
    }

    // Fetch emails via admin API
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers();

    const emailMap: Record<string, string> = {};
    if (!authError && authData?.users) {
      authData.users.forEach(u => { emailMap[u.id] = u.email ?? ''; });
    }

    const rows: UserRow[] = (profiles ?? []).map(p => ({
      id: p.id,
      email: emailMap[p.id] ?? '—',
      created_at: p.created_at,
      full_name: p.full_name ?? '',
      rank: p.rank ?? '',
      is_admin: p.is_admin ?? false,
    }));

    setUsers(rows);
    setLoading(false);
  }, [toast]);

  useEffect(() => { if (isAppAdmin) fetchUsers(); }, [isAppAdmin, fetchUsers]);

  const startEdit = (u: UserRow) => {
    setEditingId(u.id);
    setEditState({ full_name: u.full_name, rank: u.rank, is_admin: u.is_admin });
  };

  const cancelEdit = () => { setEditingId(null); setEditState(null); };

  const saveEdit = async () => {
    if (!editingId || !editState) return;
    setSaving(true);
    const { error } = await supabase.from('profiles').update({
      full_name: editState.full_name,
      rank: editState.rank,
      is_admin: editState.is_admin,
    }).eq('id', editingId);
    setSaving(false);
    if (error) {
      toast({ title: 'Error saving', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'User updated' });
      setEditingId(null);
      setEditState(null);
      fetchUsers();
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await supabase.auth.admin.deleteUser(deleteTarget.id);
    setDeleting(false);
    if (error) {
      toast({ title: 'Error deleting user', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: `${deleteTarget.full_name || 'User'} deleted` });
      setDeleteTarget(null);
      fetchUsers();
    }
  };

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    return (
      u.full_name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.rank.toLowerCase().includes(q)
    );
  });

  if (!isAppAdmin) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-violet-600 flex items-center justify-center shrink-0">
          <ShieldCheck className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Admin Panel</h1>
          <p className="text-xs text-muted-foreground">Manage all app users</p>
        </div>
        <div className="ml-auto">
          <Badge variant="outline" className="text-violet-600 border-violet-300 bg-violet-50 dark:bg-violet-950/30 text-xs">
            <Users className="h-3 w-3 mr-1" />
            {users.length} users
          </Badge>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, email or rank…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* User list */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          Loading users…
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground text-sm">No users found.</div>
      ) : (
        <div className="space-y-2">
          {filtered.map(u => (
            <div
              key={u.id}
              className={`rounded-xl border bg-card shadow-sm transition-colors ${editingId === u.id ? 'border-violet-400 ring-1 ring-violet-200 dark:ring-violet-800' : ''}`}
            >
              {editingId === u.id && editState ? (
                /* ── Edit mode ── */
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Editing — {u.email}</p>
                    <button onClick={cancelEdit} className="p-1 rounded hover:bg-muted text-muted-foreground">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Full Name</Label>
                      <Input
                        value={editState.full_name}
                        onChange={e => setEditState(s => s ? { ...s, full_name: e.target.value } : s)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Rank</Label>
                      <select
                        value={editState.rank}
                        onChange={e => setEditState(s => s ? { ...s, rank: e.target.value } : s)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                      >
                        {RANKS.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                    <div className="flex items-center gap-2 pt-5">
                      <input
                        type="checkbox"
                        id={`admin-${u.id}`}
                        checked={editState.is_admin}
                        onChange={e => setEditState(s => s ? { ...s, is_admin: e.target.checked } : s)}
                        className="h-4 w-4 rounded border-border"
                      />
                      <Label htmlFor={`admin-${u.id}`} className="text-xs cursor-pointer">App Admin</Label>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" onClick={saveEdit} disabled={saving} className="bg-violet-600 hover:bg-violet-700 text-white">
                      {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Check className="h-3.5 w-3.5 mr-1" />}
                      Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={cancelEdit}>Cancel</Button>
                  </div>
                </div>
              ) : (
                /* ── View mode ── */
                <div className="flex items-center gap-3 px-4 py-3">
                  {/* Avatar */}
                  <div className="h-9 w-9 rounded-full bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center shrink-0 text-violet-700 dark:text-violet-300 text-sm font-bold">
                    {(u.full_name || u.email).charAt(0).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-foreground truncate">
                        {u.rank && u.rank !== 'Other' ? `${u.rank} ` : ''}{u.full_name || '—'}
                      </span>
                      {u.is_admin && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300 border border-violet-300 dark:border-violet-700 shrink-0">
                          Admin
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                    <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                      Joined {fmtDate(u.created_at)}
                      
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => startEdit(u)}
                      className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      title="Edit user"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(u)}
                      className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-muted-foreground hover:text-red-600 transition-colors"
                      title="Delete user"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={open => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete user account?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{deleteTarget?.full_name || deleteTarget?.email}</strong>'s account and all their data. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Delete Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
