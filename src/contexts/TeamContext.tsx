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

// ─── Provider ─────────────────────────────────────────────────────────────────

export function TeamProvider({ children }: { children: ReactNode }) {
  const [team, setTeam]       = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [feed, setFeed]       = useState<TeamActivity[]>([]);
  const [myRole, setMyRole]   = useState<'admin' | 'member' | null>(null);
  const [loading, setLoading] = useState(true);

  // ── Core fetch ──────────────────────────────────────────────────────────────

  const fetchTeamData = useCallback(async (userId: string) => {
    const { data: memberRow } = await supabase
      .from('team_members')
      .select('*, team:teams(*)')
      .eq('user_id', userId)
      .maybeSingle();

    if (!memberRow) {
      setTeam(null);
      setMyRole(null);
      setMembers([]);
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

    setTeam(teamData);
    setMyRole(role);
    setMembers(membersList);

    if (membersList.length > 0) {
      const ids = membersList.map(m => m.user_id);
      const { data: activityData } = await supabase
        .from('activities')
        .select('id, user_id, date, type, title, custom_type, duration_minutes, distance_km, description, image_url, location, created_at')
        .in('user_id', ids)
        .order('created_at', { ascending: false })
        .limit(50);
      if (activityData) {
        setFeed(activityData.map(a => ({
          ...a,
          profile: membersList.find(m => m.user_id === a.user_id)?.profile,
        })) as TeamActivity[]);
      }
    }
  }, []);

  // ── Auth listener — single source of truth ──────────────────────────────────
  // Listen to onAuthStateChange directly (not via useAuth) so the session is
  // guaranteed to be active on the Supabase client before we query.

  useEffect(() => {
    let ignore = false;

    // Handle initial page load / refresh
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (ignore) return;
      if (session?.user) {
        await fetchTeamData(session.user.id);
      }
      setLoading(false);
    });

    // Handle login / logout / token refresh events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (ignore) return;

        if (event === 'SIGNED_IN') {
          if (session?.user) {
            setLoading(true);
            await fetchTeamData(session.user.id);
            setLoading(false);
          }
        }

        if (event === 'SIGNED_OUT') {
          setTeam(null);
          setMyRole(null);
          setMembers([]);
          setFeed([]);
          setLoading(false);
        }
      }
    );

    return () => {
      ignore = true;
      subscription.unsubscribe();
    };
  }, [fetchTeamData]);

  // ── Actions ─────────────────────────────────────────────────────────────────

  const refreshFeed = useCallback(async () => {
    if (members.length === 0) return;
    const ids = members.map(m => m.user_id);
    const { data } = await supabase
      .from('activities')
      .select('id, user_id, date, type, title, custom_type, duration_minutes, distance_km, description, image_url, location, created_at')
      .in('user_id', ids)
      .order('created_at', { ascending: false })
      .limit(50);
    if (data) {
      setFeed(data.map(a => ({
        ...a,
        profile: members.find(m => m.user_id === a.user_id)?.profile,
      })) as TeamActivity[]);
    }
  }, [members]);

  const createTeam = async (name: string, description: string): Promise<string | null> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return 'Not logged in';
    const user = session.user;

    const { data: newTeam, error } = await supabase
      .from('teams')
      .insert({ name: name.trim(), description: description.trim(), created_by: user.id })
      .select().single();
    if (error || !newTeam) return error?.message ?? 'Failed to create team';

    const { error: joinError } = await supabase
      .from('team_members')
      .insert({ team_id: newTeam.id, user_id: user.id, role: 'admin' });
    if (joinError) return joinError.message;

    await fetchTeamData(user.id);
    return null;
  };

  const joinTeam = async (code: string): Promise<string | null> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return 'Not logged in';
    const user = session.user;

    const { data: foundTeam, error } = await supabase
      .from('teams').select('*').eq('invite_code', code.trim().toLowerCase()).single();
    if (error || !foundTeam) return 'Invalid invite code';

    const { error: joinError } = await supabase
      .from('team_members').insert({ team_id: foundTeam.id, user_id: user.id, role: 'member' });
    if (joinError) return joinError.message.includes('unique') ? 'You are already in a team' : joinError.message;

    await fetchTeamData(user.id);
    return null;
  };

  const leaveTeam = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    await supabase.from('team_members').delete().eq('user_id', session.user.id);
    setTeam(null); setMyRole(null); setMembers([]); setFeed([]);
  };

  const deleteTeam = async () => {
    if (!team) return;
    await supabase.from('teams').delete().eq('id', team.id);
    setTeam(null); setMyRole(null); setMembers([]); setFeed([]);
  };

  const removeMember = async (userId: string) => {
    if (!team) return;
    await supabase.from('team_members').delete().eq('user_id', userId).eq('team_id', team.id);
    const updated = members.filter(m => m.user_id !== userId);
    setMembers(updated);
    if (updated.length > 0) await refreshFeed();
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
