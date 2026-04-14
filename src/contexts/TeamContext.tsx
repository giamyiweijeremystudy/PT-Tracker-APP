import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
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

export function TeamProvider({ children }: { children: ReactNode }) {
  const [team, setTeam]       = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [feed, setFeed]       = useState<TeamActivity[]>([]);
  const [myRole, setMyRole]   = useState<'admin' | 'member' | null>(null);
  const [loading, setLoading] = useState(true);

  // ── Feed fetch ───────────────────────────────────────────────────────────────
  // Queries team_activities (mirror table) joined with activities for full data.

  const fetchFeed = useCallback(async (teamId: string, membersList: TeamMember[]) => {
    const { data } = await supabase
      .from('team_activities')
      .select(`
        activity_id,
        user_id,
        activities (
          id, user_id, date, type, title, custom_type,
          duration_minutes, distance_km, description,
          image_url, location, created_at
        )
      `)
      .eq('team_id', teamId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (data) {
      const flat = data
        .map((row: any) => {
          const a = row.activities;
          if (!a) return null;
          return {
            ...a,
            profile: membersList.find(m => m.user_id === row.user_id)?.profile,
          } as TeamActivity;
        })
        .filter(Boolean) as TeamActivity[];
      setFeed(flat);
    }
  }, []);

  // ── Core fetch ───────────────────────────────────────────────────────────────

  const fetchTeamData = useCallback(async (userId: string): Promise<void> => {
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('team_id')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;

      if (!profile?.team_id) {
        setTeam(null); setMyRole(null); setMembers([]); setFeed([]);
        return;
      }

      const teamId = profile.team_id;

      const [teamRes, memberRowRes] = await Promise.all([
        supabase.from('teams').select('*').eq('id', teamId).single(),
        supabase.from('team_members').select('role').eq('user_id', userId).eq('team_id', teamId).single(),
      ]);

      if (teamRes.error) throw teamRes.error;
      if (!teamRes.data) { setTeam(null); setMyRole(null); setMembers([]); setFeed([]); return; }

      const teamData = teamRes.data as Team;
      const role = (memberRowRes.data?.role ?? 'member') as 'admin' | 'member';

      // Fetch members and profiles in two separate queries to avoid RLS join issues
      const { data: membersRaw } = await supabase
        .from('team_members')
        .select('id, team_id, user_id, role, joined_at')
        .eq('team_id', teamId)
        .order('role', { ascending: true })
        .order('joined_at', { ascending: true });

      const memberUserIds = (membersRaw ?? []).map((m: any) => m.user_id);
      const { data: profilesRaw } = memberUserIds.length > 0
        ? await supabase
            .from('profiles')
            .select('id, full_name, rank, age, ippt_pushups, ippt_situps, ippt_run_seconds')
            .in('id', memberUserIds)
        : { data: [] };

      const profileMap = Object.fromEntries((profilesRaw ?? []).map((p: any) => [p.id, p]));
      const membersList: TeamMember[] = (membersRaw ?? []).map((m: any) => ({
        ...m,
        profile: profileMap[m.user_id] ?? undefined,
      }));

      setTeam(teamData);
      setMyRole(role);
      setMembers(membersList);

      await fetchFeed(teamId, membersList);
    } catch (err) {
      console.error('[TeamContext] fetchTeamData error:', err);
    }
  }, [fetchFeed]);

  // ── Feed polling ─────────────────────────────────────────────────────────────
  // Polls every 30s and on tab visibility (when user returns after posting
  // a personal activity — it mirrors automatically via DB trigger).

  useEffect(() => {
    if (!team || members.length === 0) return;

    const poll = () => fetchFeed(team.id, members);

    const interval = setInterval(poll, 30_000);

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') poll();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [team, members, fetchFeed]);

  // ── Auth ─────────────────────────────────────────────────────────────────────

  useEffect(() => {
    let ignore = false;

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (ignore) return;
      try {
        if (session?.user) await fetchTeamData(session.user.id);
      } finally {
        if (!ignore) setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, _session) => {
        if (ignore) return;
        if (event === 'SIGNED_OUT') {
          setTeam(null); setMyRole(null); setMembers([]); setFeed([]);
          setLoading(false);
        }
      }
    );

    return () => { ignore = true; subscription.unsubscribe(); };
  }, [fetchTeamData]);

  // ── Actions ──────────────────────────────────────────────────────────────────

  const refreshFeed = useCallback(async () => {
    if (!team || members.length === 0) return;
    await fetchFeed(team.id, members);
  }, [team, members, fetchFeed]);

  const createTeam = async (name: string, description: string): Promise<string | null> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return 'Not logged in';
    const userId = session.user.id;

    const { data: newTeam, error } = await supabase
      .from('teams')
      .insert({ name: name.trim(), description: description.trim(), created_by: userId })
      .select().single();
    if (error || !newTeam) return error?.message ?? 'Failed to create team';

    const { error: joinError } = await supabase
      .from('team_members')
      .insert({ team_id: newTeam.id, user_id: userId, role: 'admin' });
    if (joinError) return joinError.message;

    await supabase.from('profiles').update({ team_id: newTeam.id }).eq('id', userId);

    await fetchTeamData(userId);
    return null;
  };

  const joinTeam = async (code: string): Promise<string | null> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return 'Not logged in';
    const userId = session.user.id;

    const { data: foundTeam, error } = await supabase
      .from('teams').select('*').eq('invite_code', code.trim().toLowerCase()).single();
    if (error || !foundTeam) return 'Invalid invite code';

    const { error: joinError } = await supabase
      .from('team_members').insert({ team_id: foundTeam.id, user_id: userId, role: 'member' });
    if (joinError) return joinError.message.includes('unique') ? 'You are already in a team' : joinError.message;

    await supabase.from('profiles').update({ team_id: foundTeam.id }).eq('id', userId);

    await fetchTeamData(userId);
    return null;
  };

  const leaveTeam = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    await supabase.from('team_members').delete().eq('user_id', session.user.id);
    await supabase.from('profiles').update({ team_id: null }).eq('id', session.user.id);
    setTeam(null); setMyRole(null); setMembers([]); setFeed([]);
  };

  const deleteTeam = async () => {
    if (!team) return;
    // Clear team_id from all members before deleting
    const memberIds = members.map(m => m.user_id);
    if (memberIds.length > 0) {
      await supabase.from('profiles').update({ team_id: null }).in('id', memberIds);
    }
    await supabase.from('teams').delete().eq('id', team.id);
    setTeam(null); setMyRole(null); setMembers([]); setFeed([]);
  };

  const removeMember = async (userId: string) => {
    if (!team) return;
    await supabase.from('team_members').delete().eq('user_id', userId).eq('team_id', team.id);
    const updated = members.filter(m => m.user_id !== userId);
    setMembers(updated);
    if (updated.length > 0) await fetchFeed(team.id, updated);
    else setFeed([]);
  };

  const updateTeam = async (name: string, description: string) => {
    if (!team) return;
    await supabase.from('teams').update({ name: name.trim(), description: description.trim() }).eq('id', team.id);
    setTeam({ ...team, name: name.trim(), description: description.trim() });
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
