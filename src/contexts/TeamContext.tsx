import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export type Team = {
  id: string;
  name: string;
  description: string;
  invite_code: string;
  created_by: string;
};

export type TeamMember = {
  id: string;
  team_id: string;
  user_id: string;
  role: 'admin' | 'member';
  joined_at: string;
  profile?: {
    full_name: string;
    rank: string;
    age: number | null;
    ippt_pushups: number | null;
    ippt_situps: number | null;
    ippt_run_seconds: number | null;
  };
};

export type TeamActivity = {
  id: string;
  user_id: string;
  date: string;
  type: string;
  title: string | null;
  custom_type: string | null;
  duration_minutes: number | null;
  distance_km: number | null;
  description: string | null;
  image_url: string | null;
  location: string | null;
  created_at: string;
  profile?: { full_name: string; rank: string };
};

type TeamContextValue = {
  team: Team | null;
  members: TeamMember[];
  feed: TeamActivity[];
  myRole: 'admin' | 'member' | null;
  loading: boolean;
  createTeam: (name: string, description: string) => Promise<string | null>;
  joinTeam: (code: string) => Promise<string | null>;
  leaveTeam: () => Promise<void>;
  deleteTeam: () => Promise<void>;
  removeMember: (userId: string) => Promise<void>;
  updateTeam: (name: string, description: string) => Promise<void>;
  refreshFeed: () => Promise<void>;
};

const TeamContext = createContext<TeamContextValue | null>(null);

// ─── localStorage helpers ─────────────────────────────────────────────────────

type CachedState = {
  team: Team | null;
  myRole: 'admin' | 'member' | null;
  members: TeamMember[];
};

function getCache(userId: string): CachedState | null {
  try {
    const raw = localStorage.getItem(`pt_team_${userId}`);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function setCache(userId: string, state: CachedState) {
  try { localStorage.setItem(`pt_team_${userId}`, JSON.stringify(state)); } catch {}
}

function clearCache(userId: string) {
  try { localStorage.removeItem(`pt_team_${userId}`); } catch {}
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function TeamProvider({ children }: { children: ReactNode }) {
  const { user, profile } = useAuth();

  const [team, _setTeam]       = useState<Team | null>(null);
  const [members, _setMembers] = useState<TeamMember[]>([]);
  const [feed, setFeed]        = useState<TeamActivity[]>([]);
  const [myRole, _setMyRole]   = useState<'admin' | 'member' | null>(null);
  const [loading, setLoading]  = useState(true);
  const initializedForUser = useRef<string | null>(null);

  // Helpers that keep cache in sync
  const persist = (t: Team | null, r: 'admin'|'member'|null, m: TeamMember[]) => {
    _setTeam(t); _setMyRole(r); _setMembers(m);
    if (user) setCache(user.id, { team: t, myRole: r, members: m });
  };

  useEffect(() => {
    if (!user) return;
    // Prevent running twice for the same user (auth fires onAuthStateChange + getSession)
    if (initializedForUser.current === user.id) return;
    initializedForUser.current = user.id;

    // 1. Apply cache immediately so UI never shows join screen on refresh
    const cached = getCache(user.id);
    if (cached) {
      _setTeam(cached.team);
      _setMyRole(cached.myRole);
      _setMembers(cached.members);
      setLoading(false);
      // Refresh in background — don't block UI
      syncFromSupabase(user.id, cached.members);
      return;
    }

    // 2. No cache — load fresh (first login ever)
    loadFresh(user.id);
  }, [user?.id]);

  const fetchFeed = async (membersList: TeamMember[]) => {
    if (membersList.length === 0) { setFeed([]); return; }
    const ids = membersList.map(m => m.user_id);
    const { data } = await supabase
      .from('activities')
      .select('id, user_id, date, type, title, custom_type, duration_minutes, distance_km, description, image_url, location, created_at')
      .in('user_id', ids)
      .order('created_at', { ascending: false })
      .limit(50);
    if (data) {
      setFeed(data.map(a => ({
        ...a,
        profile: membersList.find(m => m.user_id === a.user_id)?.profile,
      })) as TeamActivity[]);
    }
  };

  // Called silently in background when cache exists
  const syncFromSupabase = async (userId: string, currentMembers: TeamMember[]) => {
    const { data: memberRow, error } = await supabase
    .from('team_members')
    .select('*, team:teams(*)')
    .eq('user_id', userId)
    .maybeSingle();

console.log('[TeamContext] sync result:', { memberRow, error, userId });

console.log('[TeamContext] sync result:', { memberRow, error, userId });

    if (!memberRow) {
      // User was removed from team externally
      persist(null, null, []);
      clearCache(userId);
      setFeed([]);
      return;
    }

    const teamData = memberRow.team as unknown as Team;
    const role = memberRow.role as 'admin' | 'member';

    const { data: membersData } = await supabase
      .from('team_members')
      .select('*, profile:profiles(full_name, rank, age, ippt_pushups, ippt_situps, ippt_run_seconds)')
      .eq('team_id', teamData.id)
      .order('role', { ascending: true })
      .order('joined_at', { ascending: true });

    const membersList = (membersData ?? []) as unknown as TeamMember[];
    persist(teamData, role, membersList);
    await fetchFeed(membersList);
  };

  // Called when no cache exists
  const loadFresh = async (userId: string) => {
    setLoading(true);
    await syncFromSupabase(userId, []);
    setLoading(false);
  };

  const refreshFeed = useCallback(async () => {
    await fetchFeed(members);
  }, [members]);

  const createTeam = async (name: string, description: string): Promise<string | null> => {
    if (!user) return 'Not logged in';
    const { data: newTeam, error } = await supabase
      .from('teams')
      .insert({ name: name.trim(), description: description.trim(), created_by: user.id })
      .select().single();
    if (error || !newTeam) return error?.message ?? 'Failed to create team';
    const { error: joinError } = await supabase
      .from('team_members')
      .insert({ team_id: newTeam.id, user_id: user.id, role: 'admin' });
    if (joinError) return joinError.message;
    const myMember: TeamMember = {
      id: '', team_id: newTeam.id, user_id: user.id, role: 'admin',
      joined_at: new Date().toISOString(),
      profile: {
        full_name: (profile as any)?.full_name ?? '',
        rank: (profile as any)?.rank ?? '',
        age: (profile as any)?.age ?? null,
        ippt_pushups: (profile as any)?.ippt_pushups ?? null,
        ippt_situps: (profile as any)?.ippt_situps ?? null,
        ippt_run_seconds: (profile as any)?.ippt_run_seconds ?? null,
      },
    };
    persist(newTeam as Team, 'admin', [myMember]);
    setFeed([]);
    return null;
  };

  const joinTeam = async (code: string): Promise<string | null> => {
    if (!user) return 'Not logged in';
    const { data: foundTeam, error } = await supabase
      .from('teams').select('*').eq('invite_code', code.trim().toLowerCase()).single();
    if (error || !foundTeam) return 'Invalid invite code';
    const { error: joinError } = await supabase
      .from('team_members').insert({ team_id: foundTeam.id, user_id: user.id, role: 'member' });
    if (joinError) return joinError.message.includes('unique') ? 'You are already in a team' : joinError.message;
    const { data: membersData } = await supabase
      .from('team_members')
      .select('*, profile:profiles(full_name, rank, age, ippt_pushups, ippt_situps, ippt_run_seconds)')
      .eq('team_id', foundTeam.id);
    const membersList = (membersData ?? []) as unknown as TeamMember[];
    persist(foundTeam as Team, 'member', membersList);
    await fetchFeed(membersList);
    return null;
  };

  const leaveTeam = async () => {
    if (!user) return;
    await supabase.from('team_members').delete().eq('user_id', user.id);
    persist(null, null, []);
    clearCache(user.id);
    setFeed([]);
  };

  const deleteTeam = async () => {
    if (!team || !user) return;
    await supabase.from('teams').delete().eq('id', team.id);
    persist(null, null, []);
    clearCache(user.id);
    setFeed([]);
  };

  const removeMember = async (userId: string) => {
    if (!team) return;
    await supabase.from('team_members').delete().eq('user_id', userId).eq('team_id', team.id);
    const updated = members.filter(m => m.user_id !== userId);
    persist(team, myRole, updated);
    await fetchFeed(updated);
  };

  const updateTeam = async (name: string, description: string) => {
    if (!team) return;
    await supabase.from('teams').update({ name: name.trim(), description: description.trim() }).eq('id', team.id);
    persist({ ...team, name: name.trim(), description: description.trim() }, myRole, members);
  };

  return (
    <TeamContext.Provider value={{ team, members, feed, myRole, loading, createTeam, joinTeam, leaveTeam, deleteTeam, removeMember, updateTeam, refreshFeed }}>
      {children}
    </TeamContext.Provider>
  );
}

export function useTeam() {
  const ctx = useContext(TeamContext);
  if (!ctx) throw new Error('useTeam must be used within TeamProvider');
  return ctx;
}
