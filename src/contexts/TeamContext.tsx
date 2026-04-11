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
  setTeam: (t: Team | null) => void;
  setMembers: (m: TeamMember[]) => void;
  setFeed: (f: TeamActivity[]) => void;
  setMyRole: (r: 'admin' | 'member' | null) => void;
  refreshFeed: () => Promise<void>;
  createTeam: (name: string, description: string) => Promise<string | null>;
  joinTeam: (inviteCode: string) => Promise<string | null>;
  leaveTeam: () => Promise<void>;
  deleteTeam: () => Promise<void>;
  removeMember: (userId: string) => Promise<void>;
  updateTeam: (name: string, description: string) => Promise<void>;
};

const TeamContext = createContext<TeamContextValue | null>(null);

export function TeamProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const [team, setTeam]       = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [feed, setFeed]       = useState<TeamActivity[]>([]);
  const [myRole, setMyRole]   = useState<'admin' | 'member' | null>(null);
  const [loading, setLoading] = useState(true);
  const loadedRef             = useRef(false);

  const refreshFeed = useCallback(async () => {
    if (members.length === 0) return;
    const memberIds = members.map(m => m.user_id);
    const { data } = await supabase
      .from('activities')
      .select('id, user_id, date, type, title, custom_type, duration_minutes, distance_km, description, image_url, location, created_at')
      .in('user_id', memberIds)
      .order('created_at', { ascending: false })
      .limit(50);
    if (data) {
      setFeed(data.map(a => ({
        ...a,
        profile: members.find(m => m.user_id === a.user_id)?.profile,
      })) as TeamActivity[]);
    }
  }, [members]);

  useEffect(() => {
    if (!user || loadedRef.current) return;
    loadOnce();
  }, [user]);

  const loadOnce = async () => {
    setLoading(true);
    const { data: memberRow } = await supabase
      .from('team_members')
      .select('*, team:teams(*)')
      .eq('user_id', user!.id)
      .maybeSingle();

    if (!memberRow) {
      setTeam(null); setMyRole(null); setMembers([]); setFeed([]);
      setLoading(false); loadedRef.current = true; return;
    }

    const teamData = memberRow.team as unknown as Team;
    const role = memberRow.role as 'admin' | 'member';
    setTeam(teamData);
    setMyRole(role);

    const { data: membersData } = await supabase
      .from('team_members')
      .select('*, profile:profiles(full_name, rank, age, ippt_pushups, ippt_situps, ippt_run_seconds)')
      .eq('team_id', teamData.id)
      .order('role', { ascending: true })
      .order('joined_at', { ascending: true });

    const membersList = (membersData ?? []) as unknown as TeamMember[];
    setMembers(membersList);

    if (membersList.length > 0) {
      const memberIds = membersList.map(m => m.user_id);
      const { data: activities } = await supabase
        .from('activities')
        .select('id, user_id, date, type, title, custom_type, duration_minutes, distance_km, description, image_url, location, created_at')
        .in('user_id', memberIds)
        .order('created_at', { ascending: false })
        .limit(50);
      if (activities) {
        setFeed(activities.map(a => ({
          ...a,
          profile: membersList.find(m => m.user_id === a.user_id)?.profile,
        })) as TeamActivity[]);
      }
    }

    setLoading(false);
    loadedRef.current = true;
  };

  const createTeam = async (name: string, description: string): Promise<string | null> => {
    const inviteCode = Math.random().toString(36).substring(2, 10);
    const { data: newTeam, error } = await supabase
      .from('teams')
      .insert({ name, description, invite_code: inviteCode, created_by: user!.id })
      .select()
      .single();
    if (error) return error.message;
    await supabase.from('team_members').insert({ team_id: newTeam.id, user_id: user!.id, role: 'admin' });
    loadedRef.current = false;
    await loadOnce();
    return null;
  };

  const joinTeam = async (inviteCode: string): Promise<string | null> => {
    const { data: foundTeam, error } = await supabase
      .from('teams')
      .select('*')
      .eq('invite_code', inviteCode.trim())
      .maybeSingle();
    if (error) return error.message;
    if (!foundTeam) return 'Invalid invite code';
    const { error: joinError } = await supabase
      .from('team_members')
      .insert({ team_id: foundTeam.id, user_id: user!.id, role: 'member' });
    if (joinError) return joinError.message;
    loadedRef.current = false;
    await loadOnce();
    return null;
  };

  const leaveTeam = async () => {
    if (!team) return;
    await supabase.from('team_members').delete().eq('team_id', team.id).eq('user_id', user!.id);
    setTeam(null); setMyRole(null); setMembers([]); setFeed([]);
    loadedRef.current = true;
  };

  const deleteTeam = async () => {
    if (!team) return;
    await supabase.from('team_members').delete().eq('team_id', team.id);
    await supabase.from('teams').delete().eq('id', team.id);
    setTeam(null); setMyRole(null); setMembers([]); setFeed([]);
    loadedRef.current = true;
  };

  const removeMember = async (userId: string) => {
    if (!team) return;
    await supabase.from('team_members').delete().eq('team_id', team.id).eq('user_id', userId);
    setMembers(prev => prev.filter(m => m.user_id !== userId));
  };

  const updateTeam = async (name: string, description: string) => {
    if (!team) return;
    await supabase.from('teams').update({ name, description }).eq('id', team.id);
    setTeam({ ...team, name, description });
  };

  return (
    <TeamContext.Provider value={{
      team, members, feed, myRole, loading,
      setTeam, setMembers, setFeed, setMyRole, refreshFeed,
      createTeam, joinTeam, leaveTeam, deleteTeam, removeMember, updateTeam,
    }}>
      {children}
    </TeamContext.Provider>
  );
}

export function useTeam() {
  const ctx = useContext(TeamContext);
  if (!ctx) throw new Error('useTeam must be used within TeamProvider');
  return ctx;
}
