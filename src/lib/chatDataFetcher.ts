// ─── Chat Data Fetcher ────────────────────────────────────────────────────────
// Queries Supabase and returns plain-text summaries for the chat UI.

import { supabase } from '@/integrations/supabase/client';

function localDateStr(date: Date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}

function fmtTime(sec: number | null): string {
  if (!sec) return '—';
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
}

function calcIpptAward(pu: number, su: number, runSec: number, age: number): { total: number; award: string } {
  // Simplified scoring — good enough for chat summaries
  const idx = age < 22 ? 0 : age <= 24 ? 1 : age <= 27 ? 2 : age <= 30 ? 3 : age <= 33 ? 4 :
              age <= 36 ? 5 : age <= 39 ? 6 : age <= 42 ? 7 : age <= 45 ? 8 : age <= 48 ? 9 :
              age <= 51 ? 10 : age <= 54 ? 11 : age <= 57 ? 12 : 13;
  // Approximate points using saved total from ippt_results table if available
  const total = 0; // Will be overridden by DB value
  const award = total >= 85 ? 'Gold' : total >= 75 ? 'Silver' : total >= 51 ? 'Pass' : 'Fail';
  return { total, award };
}

export async function fetchChatData(query: string, userId: string): Promise<string> {
  try {
    switch (query) {

      case 'ippt_latest': {
        const { data } = await supabase
          .from('ippt_results')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        if (!data) return "No IPPT results saved yet. Try the IPPT Calculator to record your score.";
        return `Your latest IPPT result:\n• Score: ${data.total} pts — ${data.award}\n• Push-ups: ${data.pushups} (${data.pu_pts} pts)\n• Sit-ups: ${data.situps} (${data.su_pts} pts)\n• 2.4km Run: ${fmtTime(data.run_seconds)} (${data.run_pts} pts)\n• Age group: ${data.age}`;
      }

      case 'bmi_latest': {
        const { data } = await supabase
          .from('bmi_results')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        if (!data) return "No BMI results saved yet. Try the BMI Calculator to record yours.";
        return `Your latest BMI:\n• BMI: ${Number(data.bmi).toFixed(1)} — ${data.category}\n• Height: ${data.height_cm} cm\n• Weight: ${data.weight_kg} kg`;
      }

      case 'profile_summary': {
        const [profileRes, ipptRes, bmiRes, actRes] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', userId).single(),
          supabase.from('ippt_results').select('total,award').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).single(),
          supabase.from('bmi_results').select('bmi,category').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).single(),
          supabase.from('activities').select('id', { count: 'exact' }).eq('user_id', userId),
        ]);
        const p = profileRes.data;
        if (!p) return "Could not load profile.";
        const lines = [`Profile: ${p.rank ? p.rank + ' ' : ''}${p.full_name}`];
        if (p.age) lines.push(`• Age: ${p.age}`);
        if (ipptRes.data) lines.push(`• IPPT: ${ipptRes.data.total} pts (${ipptRes.data.award})`);
        if (bmiRes.data) lines.push(`• BMI: ${Number(bmiRes.data.bmi).toFixed(1)} (${bmiRes.data.category})`);
        lines.push(`• Activities logged: ${actRes.count ?? 0}`);
        return lines.join('\n');
      }

      case 'activity_summary': {
        const { data, count } = await supabase
          .from('activities')
          .select('type, date', { count: 'exact' })
          .eq('user_id', userId)
          .order('date', { ascending: false })
          .limit(5);
        if (!data || data.length === 0) return "No activities logged yet. Head to Activities to log your first workout!";
        const typeCounts: Record<string, number> = {};
        data.forEach((a: any) => { typeCounts[a.type] = (typeCounts[a.type] || 0) + 1; });
        const recent = data.slice(0, 3).map((a: any) =>
          `  • ${a.type.replace(/_/g, ' ')} on ${new Date(a.date).toLocaleDateString('en-SG', { day: 'numeric', month: 'short' })}`
        ).join('\n');
        return `You have ${count} activit${count === 1 ? 'y' : 'ies'} logged.\n\nRecent:\n${recent}`;
      }

      case 'team_summary': {
        const { data: membership } = await supabase
          .from('team_members')
          .select('team_id, teams(name)')
          .eq('user_id', userId)
          .limit(1)
          .single();
        if (!membership) return "You're not in a team yet. Join one from the Teams page.";
        const teamId = membership.team_id;
        const [membersRes, feedRes] = await Promise.all([
          supabase.from('team_members').select('user_id', { count: 'exact' }).eq('team_id', teamId),
          supabase.from('team_activities').select('user_id', { count: 'exact' }).eq('team_id', teamId),
        ]);
        const teamName = (membership as any).teams?.name ?? 'Your team';
        return `${teamName}:\n• Members: ${membersRes.count ?? 0}\n• Total activities shared: ${feedRes.count ?? 0}`;
      }

      case 'my_rank': {
        const { data: membership } = await supabase
          .from('team_members')
          .select('team_id')
          .eq('user_id', userId)
          .limit(1)
          .single();
        if (!membership) return "You're not in a team. Join one to see rankings.";
        const teamId = membership.team_id;

        const { data: members } = await supabase
          .from('team_members')
          .select('user_id, profile:profiles(full_name, ippt_score)')
          .eq('team_id', teamId);

        if (!members || members.length === 0) return "No team members found.";

        const scored = (members as any[])
          .filter(m => m.profile?.ippt_score != null)
          .sort((a, b) => b.profile.ippt_score - a.profile.ippt_score);

        const myRank = scored.findIndex((m: any) => m.user_id === userId) + 1;
        const myEntry = scored.find((m: any) => m.user_id === userId);

        if (!myEntry) return `You have ${scored.length} ranked members in your team but no IPPT score saved yet.\nSave your IPPT result in the Calculator to appear on the leaderboard.`;
        return `Your IPPT leaderboard rank: #${myRank} of ${scored.length}\nScore: ${myEntry.profile.ippt_score} pts`;
      }

      case 'at_risk_members': {
        const { data: membership } = await supabase
          .from('team_members')
          .select('team_id, team_role')
          .eq('user_id', userId)
          .limit(1)
          .single();
        if (!membership) return "You're not in a team.";
        const roles: string[] = Array.isArray(membership.team_role) ? membership.team_role : [membership.team_role];
        if (!roles.includes('admin') && !roles.includes('pt_ic')) {
          return "This query is only available to Team Admins and PT ICs.";
        }
        const teamId = membership.team_id;
        const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const { data: members } = await supabase
          .from('team_members')
          .select('user_id, profile:profiles(full_name, rank)')
          .eq('team_id', teamId);
        const { data: recentActivity } = await supabase
          .from('team_activities')
          .select('user_id')
          .eq('team_id', teamId)
          .gte('created_at', thirtyDaysAgo.toISOString());

        const activeIds = new Set((recentActivity ?? []).map((a: any) => a.user_id));
        const inactive = (members ?? []).filter((m: any) => !activeIds.has(m.user_id));

        if (inactive.length === 0) return "All team members have been active in the last 30 days. 💪";
        const names = inactive.map((m: any) =>
          `  • ${m.profile?.rank && m.profile.rank !== 'Other' ? m.profile.rank + ' ' : ''}${m.profile?.full_name ?? 'Member'}`
        ).join('\n');
        return `${inactive.length} member${inactive.length !== 1 ? 's' : ''} inactive in the last 30 days:\n${names}`;
      }

      case 'upcoming_events': {
        const todayStr = localDateStr();
        const endStr = localDateStr(new Date(Date.now() + 14 * 86400000));
        const { data } = await supabase
          .from('personal_events')
          .select('title, event_date, event_type, source')
          .eq('user_id', userId)
          .gte('event_date', todayStr)
          .lte('event_date', endStr)
          .order('event_date', { ascending: true })
          .limit(5);
        if (!data || data.length === 0) return "No events in the next 14 days.";
        const lines = data.map((e: any) =>
          `  • ${new Date(e.event_date).toLocaleDateString('en-SG', { weekday: 'short', day: 'numeric', month: 'short' })} — ${e.title} (${e.event_type})`
        );
        return `Upcoming events (next 14 days):\n${lines.join('\n')}`;
      }

      case 'my_submissions': {
        const { data } = await supabase
          .from('team_submissions')
          .select('submission_date, session_type, attendance_status')
          .eq('user_id', userId)
          .order('submission_date', { ascending: false })
          .limit(5);
        if (!data || data.length === 0) return "No attendance submissions yet.";
        const emoji: Record<string, string> = { Participating: '✅', 'Light Duty': '⚠️', MC: '🏥', 'On Leave': '🏖️' };
        const lines = data.map((s: any) =>
          `  • ${new Date(s.submission_date).toLocaleDateString('en-SG', { day: 'numeric', month: 'short' })} — ${s.session_type} ${emoji[s.attendance_status] ?? ''} ${s.attendance_status}`
        );
        return `Your recent attendance:\n${lines.join('\n')}`;
      }

      default:
        return "Couldn't retrieve that data right now.";
    }
  } catch (e) {
    return "Something went wrong fetching that data. Please try again.";
  }
}
