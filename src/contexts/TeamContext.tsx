import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
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

function cacheKey(userId: string) { return `team_state_${userId}`; }

function saveCache(userId: string, team: Team | null, myRole: 'admin' | 'member' | null, members: TeamMember[]) {
  try {
    localStorage.setItem(cacheKey(userId), JSON.stringify({ team, myRole, members }));
  } catch {}
}

function loadCache(userId: string): { team: Team | null; myRole: 'admin' | 'member' | null; members: TeamMember[] } | null {
  try {
    const raw = localStorage.getItem(cacheKey(userId));
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

function clearCache(userId: string) {
  try { localStorage.removeItem(cacheKey(userId)); } catch {}
}

export function TeamProvider({ children }: { children: ReactNode }) {
  const { user, profile } = useAuth();

  const [team, setTeamState]       = useState<Team | null>(null);
  const [members, setMembersState] = useState<TeamMember[]>([]);
  const [feed, setFeed]            = useState<TeamActivity[]>([]);
  const [myRole, setMyRoleState]   = useState<'admin' | 'member' | null>(null);
  const [loading, setLoading]      = useState(true);

  // Wrap setters to also update cache
  const setTeam = (t: Team | null) => {
    setTeamState(t);
    if (user) saveCache(user.id, t, myRole, members);
  };
  const setMembers = (m: TeamMember[]) => {
    setMembersState(m);
    if (user) saveCache(user.id, team, myRole, m);
  };
  const setMyRole = (r: 'admin' | 'member' | null) => {
    setMyRoleState(r);
    if (user) saveCache(user.id, team, r, members);
  };

  useEffect(() => {
    if (!user) { setLoading(false); return; }

    // Load from cache immediately — no flicker, no waiting
    const cached = loadCache(user.id);
    if (cached) {
      setTeamState(cached.team);
      setMyRoleState(cached.myRole);
      setMembersState(cached.members);
      setLoading(false);
      // Still refresh from Supabase in background to stay in sync
      loadFromSupabase(user.id, true);
      return;
    }

    // No cache — load fresh
    loadFromSupabase(user.id, false);
  }, [user?.id]);

  const loadFeed = async (membersList: TeamMember[]) => {
    if (membersList.length === 0) { setFeed([]); return; }
    const memberIds = membersList.map(m => m.user_id);
    const { data } = await supabase
      .from('activities')
      .select('id, user_id, date, type, title, custom_type, duration_minutes, distance_km, description, image_url, location, created_at')
      .in('user_id', memberIds)
      .order('created_at', { ascending: false })
      .limit(50);
    if (data) {
      setFeed(data.map(a => ({
        ...a,
        profile: membersList.find(m => m.user_id === a.user_id)?.profile,
      })) as TeamActivity[]);
    }
  };

  const loadFromSupabase = async (userId: string, silent: boolean) => {
    if (!silent) setLoading(true);

    const { data: memberRow } = await supabase
      .from('team_members')
      .select('*, team:teams(*)')
      .eq('user_id', userId)
      .maybeSingle();

    if (!memberRow) {
      setTeamState(null); setMyRoleState(null); setMembersState([]); setFeed([]);
      clearCache(userId);
      setLoading(false);
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

    setTeamState(teamData);
    setMyRoleState(role);
    setMembersState(membersList);
    saveCache(userId, teamData, role, membersList);

    await loadFeed(membersList);
    setLoading(false);
  };

  const refreshFeed = useCallback(async () => {
    await loadFeed(members);
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
    const newMembers = [myMember];
    setTeamState(newTeam as Team);
    setMyRoleState('admin');
    setMembersState(newMembers);
    setFeed([]);
    saveCache(user.id, newTeam as Team, 'admin', newMembers);
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
    setTeamState(foundTeam as Team);
    setMyRoleState('member');
    setMembersState(membersList);
    saveCache(user.id, foundTeam as Team, 'member', membersList);
    await loadFeed(membersList);
    return null;
  };

  const leaveTeam = async () => {
    if (!user) return;
    await supabase.from('team_members').delete().eq('user_id', user.id);
    clearCache(user.id);
    setTeamState(null); setMembersState([]); setFeed([]); setMyRoleState(null);
  };

  const deleteTeam = async () => {
    if (!team || !user) return;
    await supabase.from('teams').delete().eq('id', team.id);
    clearCache(user.id);
    setTeamState(null); setMembersState([]); setFeed([]); setMyRoleState(null);
  };

  const removeMember = async (userId: string) => {
    if (!team || !user) return;
    await supabase.from('team_members').delete().eq('user_id', userId).eq('team_id', team.id);
    const updated = members.filter(m => m.user_id !== userId);
    setMembersState(updated);
    saveCache(user.id, team, myRole, updated);
    await loadFeed(updated);
  };

  const updateTeam = async (name: string, description: string) => {
    if (!team || !user) return;
    await supabase.from('teams').update({ name: name.trim(), description: description.trim() }).eq('id', team.id);
    const updated = { ...team, name: name.trim(), description: description.trim() };
    setTeamState(updated);
    saveCache(user.id, updated, myRole, members);
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
