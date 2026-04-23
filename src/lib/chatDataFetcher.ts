// ─── Chat Data Fetcher ────────────────────────────────────────────────────────
// Queries Supabase and returns plain-text summaries for the chat UI.

import { supabase } from '@/integrations/supabase/client';
import { detectTopics } from '@/lib/chatIntents';

// ─── Topic → fetchChatData key mapping ───────────────────────────────────────

const TOPIC_TO_QUERY: Record<string, string[]> = {
  ippt:        ['ippt_latest'],
  bmi:         ['bmi_latest'],
  activities:  ['activity_summary'],
  profile:     ['profile_summary'],
  team:        ['team_summary'],
  members:     ['team_summary'],
  leaderboard: ['my_rank'],
  at_risk:     [], // removed — only show user's own data to AI
  schedule:    ['upcoming_events'],
  submissions: ['my_submissions'],
  calories:    [],   // calculator only — no stored data
  programs:    [],   // static content — no stored data
  chat:        [],   // meta
};

export async function dynamicSearch(input: string, userId: string): Promise<string> {
  const topics = detectTopics(input);

  // Collect unique query keys across all detected topics
  const queryKeys = [...new Set(topics.flatMap(t => TOPIC_TO_QUERY[t] ?? []))];

  if (queryKeys.length === 0) {
    return "I can help with your IPPT scores, BMI, activities, team, schedule, attendance, and more. Try asking something specific!";
  }

  const results = await Promise.all(queryKeys.map(key => fetchChatData(key, userId)));

  // Filter out default fallback messages if multiple results exist
  const meaningful = results.filter(r =>
    !r.startsWith("Couldn't retrieve") && !r.startsWith("Something went wrong")
  );

  return (meaningful.length > 0 ? meaningful : results).join('\n\n─────\n\n');
}

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
          `  • ${a.type.replace(/_/g, ' ')} on ${(() => { const [y,m,d] = a.date.slice(0,10).split('-').map(Number); return `${String(d).padStart(2,'0')}/${String(m).padStart(2,'0')}`; })()}`
        ).join('\n');
        return `You have ${count} activit${count === 1 ? 'y' : 'ies'} logged.\n\nRecent:\n${recent}`;
      }

      case 'team_summary': {
        const { data: membership } = await supabase
          .from('team_members')
          .select('team_id, team_role, teams(name)')
          .eq('user_id', userId)
          .limit(1)
          .single();
        if (!membership) return "You're not in a team yet. Join one from the Teams page.";
        const teamName = (membership as any).teams?.name ?? 'Your team';
        const roles = Array.isArray(membership.team_role) ? membership.team_role.join(', ') : (membership.team_role ?? 'Member');
        // Only return what the user themselves can see — their own membership info
        return `Team: ${teamName}\nYour role: ${roles}`;
      }

      case 'my_rank': {
        // Only fetch the user's own IPPT result — don't pull other members' data
        const { data: myIppt } = await supabase
          .from('ippt_results')
          .select('total, award')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        if (!myIppt) return "No IPPT score saved yet. Use the IPPT Calculator to record your score.";
        return `Your IPPT score: ${myIppt.total} pts (${myIppt.award})\nUse the Leaderboard in the Teams page to compare with teammates.`;
      }

      case 'at_risk_members': {
        return "For team activity data, check the Teams page directly.";
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
          `  • ${(() => { const [y,m,d] = e.event_date.slice(0,10).split('-').map(Number); const wd=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][new Date(y,m-1,d).getDay()]; return `${wd} ${String(d).padStart(2,'0')}/${String(m).padStart(2,'0')}`; })()} — ${e.title} (${e.event_type})`
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
          `  • ${(() => { const [y,m,d] = s.submission_date.slice(0,10).split('-').map(Number); return `${String(d).padStart(2,'0')}/${String(m).padStart(2,'0')}`; })()} — ${s.session_type} ${emoji[s.attendance_status] ?? ''} ${s.attendance_status}`
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
// ─── Full App Context for AI ───────────────────────────────────────────────────
// Fetches a comprehensive snapshot of all user data to inject into the AI system prompt.
// Runs queries in parallel for speed.

export async function fetchFullAppContext(userId: string): Promise<string> {
  try {
    const [
      profileRes,
      ipptRes,
      bmiRes,
      activitiesRes,
      eventsRes,
      submissionsRes,
      membershipRes,
      progressModulesRes,
    ] = await Promise.allSettled([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('ippt_results').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(3),
      supabase.from('bmi_results').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).single(),
      supabase.from('activities').select('type, title, date, duration_minutes, distance_km, description').eq('user_id', userId).order('date', { ascending: false }).limit(10),
      supabase.from('personal_events').select('title, event_date, event_type').eq('user_id', userId).gte('event_date', localDateStr()).order('event_date', { ascending: true }).limit(7),
      supabase.from('team_submissions').select('submission_date, session_type, attendance_status').eq('user_id', userId).order('submission_date', { ascending: false }).limit(5),
      supabase.from('team_members').select('team_id, team_role, teams(name)').eq('user_id', userId).limit(1).single(),
      supabase.from('tracker_modules').select('exercise_label, emoji, metric_labels').eq('user_id', userId),
    ]);

    const sections: string[] = [];

    // Profile
    if (profileRes.status === 'fulfilled' && profileRes.value.data) {
      const p = profileRes.value.data;
      sections.push(`PROFILE\nName: ${p.full_name ?? 'Unknown'}\nRank: ${p.rank ?? 'N/A'}\nAge: ${p.age ?? 'N/A'}\nUnit: ${p.unit ?? 'N/A'}`);
    }

    // IPPT
    if (ipptRes.status === 'fulfilled' && ipptRes.value.data?.length) {
      const rows = ipptRes.value.data;
      const lines = rows.map((r: any) =>
        `  • ${r.total} pts (${r.award}) — PU: ${r.pushups}, SU: ${r.situps}, Run: ${fmtTime(r.run_seconds)} — Age ${r.age}`
      );
      sections.push(`IPPT RESULTS (latest 3)\n${lines.join('\n')}`);
    } else {
      sections.push('IPPT RESULTS\nNo IPPT results saved yet.');
    }

    // BMI
    if (bmiRes.status === 'fulfilled' && bmiRes.value.data) {
      const b = bmiRes.value.data;
      sections.push(`BMI\nBMI: ${Number(b.bmi).toFixed(1)} (${b.category})\nHeight: ${b.height_cm}cm, Weight: ${b.weight_kg}kg`);
    } else {
      sections.push('BMI\nNo BMI data saved yet.');
    }

    // Activities
    if (activitiesRes.status === 'fulfilled' && activitiesRes.value.data?.length) {
      const acts = activitiesRes.value.data;
      const lines = acts.map((a: any) => {
        const parts = [`${a.type.replace(/_/g, ' ')} on ${a.date.slice(0, 10)}`];
        if (a.title) parts.push(`"${a.title}"`);
        if (a.duration_minutes) parts.push(`${a.duration_minutes}min`);
        if (a.distance_km) parts.push(`${a.distance_km}km`);
        return '  • ' + parts.join(' — ');
      });
      sections.push(`RECENT ACTIVITIES (last 10)\n${lines.join('\n')}`);
    } else {
      sections.push('RECENT ACTIVITIES\nNo activities logged yet.');
    }

    // Upcoming events
    if (eventsRes.status === 'fulfilled' && eventsRes.value.data?.length) {
      const evts = eventsRes.value.data;
      const lines = evts.map((e: any) => `  • ${e.event_date.slice(0, 10)} — ${e.title} (${e.event_type})`);
      sections.push(`UPCOMING EVENTS (next 7)\n${lines.join('\n')}`);
    } else {
      sections.push('UPCOMING EVENTS\nNone in the next 7 days.');
    }

    // Attendance submissions
    if (submissionsRes.status === 'fulfilled' && submissionsRes.value.data?.length) {
      const subs = submissionsRes.value.data;
      const lines = subs.map((s: any) => `  • ${s.submission_date.slice(0, 10)} — ${s.session_type}: ${s.attendance_status}`);
      sections.push(`RECENT ATTENDANCE\n${lines.join('\n')}`);
    } else {
      sections.push('RECENT ATTENDANCE\nNo submissions yet.');
    }

    // Team — only the user's own membership, no other members' data
    if (membershipRes.status === 'fulfilled' && membershipRes.value.data) {
      const m = membershipRes.value.data as any;
      const role = Array.isArray(m.team_role) ? m.team_role.join(', ') : (m.team_role ?? 'Member');
      sections.push(`TEAM\nTeam: ${m.teams?.name ?? 'Unknown'}\nYour role: ${role}\nNote: You can only see your own data. Direct team member queries to the Teams page.`);
    } else {
      sections.push('TEAM\nNot in a team.');
    }

    // Progress tracker modules
    if (progressModulesRes.status === 'fulfilled' && progressModulesRes.value.data?.length) {
      const mods = progressModulesRes.value.data;
      const lines = mods.map((m: any) => `  • ${m.emoji} ${m.exercise_label} — tracks: ${m.metric_labels.join(', ')}`);
      sections.push(`PROGRESS TRACKER EXERCISES\n${lines.join('\n')}`);
    } else {
      sections.push('PROGRESS TRACKER\nNo exercises set up yet.');
    }

    return sections.join('\n\n');
  } catch (e) {
    return 'App context unavailable.';
  }
}
