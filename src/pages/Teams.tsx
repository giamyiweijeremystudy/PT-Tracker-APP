import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useTeam } from '@/contexts/TeamContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from '@/components/ui/sheet';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Users, Plus, Copy, Trash2, Crown, MapPin, Activity,
  Lock, Settings, Thermometer, Calendar, CheckCircle2, Clock, Shield, Swords, Star, Pin, AlertCircle,
  BarChart2, MessageSquare, Bell, ChevronDown, Send, X as XIcon, Download, FileText, Users2, Trophy, Medal, Pencil,
  Camera, Image as ImageIcon,
} from 'lucide-react';

// ─── Local date helper (respects device timezone, e.g. UTC+8) ─────────────────
function localDateStr(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// ─── Format date string (YYYY-MM-DD or ISO) → DD/MM/YYYY ─────────────────────
function fmtDate(dateStr: string, opts?: { weekday?: boolean; year?: boolean }): string {
  // Parse as local date to avoid UTC offset shifting the day
  const [y, m, d] = dateStr.slice(0, 10).split('-').map(Number);
  const date = new Date(y, m - 1, d);
  if (opts?.weekday) {
    const wd = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][date.getDay()];
    const yr = opts?.year !== false ? ` ${y}` : '';
    return `${wd}, ${String(d).padStart(2,'0')}/${String(m).padStart(2,'0')}${yr}`;
  }
  if (opts?.year !== false) {
    return `${String(d).padStart(2,'0')}/${String(m).padStart(2,'0')}/${y}`;
  }
  return `${String(d).padStart(2,'0')}/${String(m).padStart(2,'0')}`;
}


// ─── IPPT scoring ─────────────────────────────────────────────────────────────

const PUSHUP_RAW = [[60,25,"","","","","","","","","","","","",""],[59,24,25,"","","","","","","","","","","",""],[58,24,24,25,"","","","","","","","","","",""],[57,24,24,24,25,"","","","","","","","","",""],[56,24,24,24,24,25,"","","","","","","","",""],[55,23,24,24,24,24,25,"","","","","","","",""],[54,23,23,24,24,24,24,25,"","","","","","",""],[53,23,23,23,24,24,24,24,25,"","","","","",""],[52,23,23,23,23,24,24,24,24,"","","","","",""],[51,22,23,23,23,23,24,24,24,25,"","","","",""],[50,22,22,23,23,23,23,24,24,24,"","","","",""],[49,22,22,22,23,23,23,23,24,24,25,"","","",""],[48,22,22,22,22,23,23,23,23,24,24,"","","",""],[47,21,22,22,22,22,23,23,23,24,24,25,"","",""],[46,21,21,22,22,22,22,23,23,23,24,24,"","",""],[45,21,21,21,22,22,22,22,23,23,24,24,25,"",""],[44,21,21,21,21,22,22,22,22,23,23,24,24,"",""],[43,20,21,21,21,21,22,22,22,23,23,24,24,25,""],[42,20,20,21,21,21,21,22,22,22,23,23,24,25,""],[41,20,20,20,21,21,21,21,22,22,23,23,24,24,25],[40,20,20,20,20,21,21,21,21,22,22,23,23,24,25],[39,19,20,20,20,20,21,21,21,22,22,23,23,24,24],[38,19,19,20,20,20,20,21,21,21,22,22,23,23,24],[37,19,19,19,20,20,20,20,21,21,22,22,22,23,24],[36,18,19,19,19,20,20,20,20,21,21,22,22,23,23],[35,18,18,19,19,19,20,20,20,21,21,21,22,22,23],[34,18,18,18,19,19,19,20,20,20,21,21,21,22,23],[33,17,18,18,18,19,19,19,20,20,20,21,21,22,22],[32,17,17,18,18,18,19,19,19,20,20,20,21,21,22],[31,17,17,17,18,18,18,19,19,19,20,20,20,21,22],[30,16,17,17,17,18,18,18,19,19,19,20,20,21,21],[29,16,16,17,17,17,18,18,18,19,19,19,20,20,21],[28,16,16,16,17,17,17,18,18,18,19,19,19,20,20],[27,15,16,16,16,17,17,17,18,18,18,19,19,19,20],[26,15,15,16,16,16,17,17,17,18,18,18,19,19,19],[25,14,15,15,16,16,16,17,17,17,18,18,18,19,19],[24,13,14,15,15,16,16,16,17,17,17,18,18,18,19],[23,12,13,14,15,15,16,16,16,17,17,17,18,18,18],[22,11,12,13,14,15,15,16,16,16,17,17,17,18,18],[21,10,11,12,13,14,15,15,16,16,16,17,17,17,18],[20,9,10,11,12,13,14,15,15,16,16,16,17,17,17],[19,8,9,10,11,12,13,14,15,15,16,16,16,17,17],[18,6,8,9,10,11,12,13,14,15,15,16,16,16,17],[17,4,6,8,9,10,11,12,13,14,15,15,16,16,16],[16,2,4,6,8,9,10,11,12,13,14,15,15,16,16],[15,1,2,4,6,8,9,10,11,12,13,14,15,15,16],[14,0,1,2,4,6,8,9,10,11,12,13,14,15,15]];
const SITUP_RAW  = [[60,25,"","","","","","","","","","","","",""],[59,24,25,"","","","","","","","","","","",""],[58,24,24,25,"","","","","","","","","","",""],[57,24,24,24,25,"","","","","","","","","",""],[56,24,24,24,24,25,"","","","","","","","",""],[55,23,24,24,24,24,25,"","","","","","","",""],[54,23,23,24,24,24,24,25,"","","","","","",""],[53,23,23,23,24,24,24,24,25,"","","","","",""],[52,23,23,23,23,24,24,24,24,"","","","","",""],[51,22,23,23,23,23,24,24,24,25,"","","","",""],[50,22,22,23,23,23,23,24,24,24,"","","","",""],[49,22,22,22,23,23,23,23,24,24,25,"","","",""],[48,22,22,22,22,23,23,23,23,24,24,"","","",""],[47,21,22,22,22,22,23,23,23,24,24,25,"","",""],[46,21,21,22,22,22,22,23,23,23,24,24,"","",""],[45,21,21,21,22,22,22,22,23,23,24,24,24,"",""],[44,21,21,21,21,22,22,22,22,23,23,24,24,25,""],[43,20,21,21,21,21,22,22,22,23,23,23,24,24,""],[42,20,20,21,21,21,21,22,22,22,23,23,24,24,25],[41,20,20,20,21,21,21,21,22,22,23,23,23,24,24],[40,20,20,20,20,21,21,21,21,22,22,23,23,24,24],[39,19,20,20,20,20,21,21,21,22,22,22,23,23,24],[38,19,19,20,20,20,20,21,21,21,22,22,23,23,23],[37,18,19,19,20,20,20,20,21,21,22,22,22,23,23],[36,18,18,19,19,20,20,20,20,21,21,22,22,22,23],[35,17,18,18,19,19,20,20,20,21,21,21,22,22,22],[34,16,17,18,18,19,19,20,20,20,21,21,21,22,22],[33,15,16,17,18,18,19,19,20,20,20,21,21,21,22],[32,14,15,16,17,18,18,19,19,20,20,20,21,21,21],[31,14,14,15,16,17,18,18,19,19,20,20,20,21,21],[30,13,14,14,15,16,17,18,18,19,19,20,20,20,21],[29,13,13,14,14,15,16,17,18,18,18,19,20,20,20],[28,12,13,13,14,14,15,16,17,18,18,19,19,20,20],[27,11,12,13,13,14,14,15,16,17,18,18,19,19,20],[26,10,11,12,13,13,14,14,15,16,17,18,18,19,19],[25,9,10,11,12,13,13,14,14,15,16,17,18,18,19],[24,8,9,10,11,12,13,13,14,14,15,16,17,18,18],[23,7,8,9,10,11,12,13,13,14,14,15,16,17,18],[22,7,7,8,9,10,11,12,13,13,14,14,15,16,17],[21,6,7,7,8,9,10,11,12,13,13,14,14,15,16],[20,6,6,7,7,8,9,10,11,12,13,13,14,14,15],[19,5,6,6,7,7,8,9,10,11,12,13,13,14,14],[18,4,5,6,6,7,7,8,9,10,11,12,13,13,14],[17,3,4,5,6,6,7,7,8,9,10,11,12,13,13],[16,2,3,4,5,6,6,7,7,8,9,10,11,12,13],[15,1,2,3,4,5,6,6,7,7,8,9,10,11,12],[14,0,1,2,3,4,5,6,6,7,7,8,9,10,11]];
const RUN_RAW = [["8:30",50],["8:40",49,50],["8:50",48,49,50],["9:00",47,48,49],["9:10",46,47,48,50],["9:20",45,46,47,49,50],["9:30",44,45,46,48,49,50],["9:40",43,44,45,47,48,49,50],["9:50",42,43,44,46,47,48,49,50],["10:00",41,42,43,45,46,47,48,49,50],["10:10",40,41,42,44,45,46,47,48,49,50],["10:20",39,40,41,43,44,45,46,47,48,49,50],["10:30",38,39,40,42,43,44,45,46,47,48,49,50],["10:40",38,38,39,41,42,43,44,45,46,47,48,49,50],["10:50",37,38,38,40,41,42,43,44,45,46,47,48,49,50],["11:00",37,37,38,39,40,41,42,43,44,45,46,47,48,49],["11:10",36,37,37,38,39,40,41,42,43,44,45,46,47,48],["11:20",36,36,37,38,38,39,40,41,42,43,44,45,46,47],["11:30",35,36,36,37,38,38,39,40,41,42,43,44,45,46],["11:40",35,35,36,37,37,38,38,39,40,41,42,43,44,45],["11:50",34,35,35,36,37,37,38,38,39,40,41,42,43,44],["12:00",33,34,35,36,36,37,37,38,38,39,40,41,42,43],["12:10",32,33,34,35,36,36,37,37,38,38,39,40,41,42],["12:20",31,32,33,35,35,36,36,37,37,38,38,39,40,41],["12:30",30,31,32,34,35,35,36,36,37,37,38,38,39,40],["12:40",29,30,31,33,34,35,35,36,36,37,37,38,38,39],["12:50",28,29,30,32,33,34,35,35,36,36,37,37,38,38],["13:00",27,28,29,31,32,33,34,35,35,36,36,37,37,38],["13:10",26,27,28,30,31,32,33,34,35,35,36,36,37,37],["13:20",25,26,27,29,30,31,32,33,34,35,35,36,36,37],["13:30",24,25,26,28,29,30,31,32,33,34,35,35,36,36],["13:40",23,24,25,27,28,29,30,31,32,33,34,35,35,36],["13:50",22,23,24,26,27,28,29,30,31,32,33,34,35,35],["14:00",21,22,23,25,26,27,28,29,30,31,32,33,34,35],["14:10",20,21,22,24,25,26,27,28,29,30,31,32,33,34],["14:20",19,20,21,23,24,25,26,27,28,29,30,31,32,33],["14:30",18,19,20,22,23,24,25,26,27,28,29,30,31,32],["14:40",16,18,19,21,22,23,24,25,26,27,28,29,30,31],["14:50",14,16,18,20,21,22,23,24,25,26,27,28,29,30],["15:00",12,14,16,19,20,21,22,23,24,25,26,27,28,29],["15:10",10,12,14,18,19,20,21,22,23,24,25,26,27,28],["15:20",8,10,12,16,18,19,20,21,22,23,24,25,26,27],["15:30",6,8,10,14,16,18,19,20,21,22,23,24,25,26],["15:40",4,6,8,12,14,16,18,19,20,21,22,23,24,25],["15:50",2,4,6,10,12,14,16,18,19,20,21,22,23,24],["16:00",1,2,4,8,10,12,14,16,18,19,20,21,22,23],["16:10",0,1,2,6,8,10,12,14,16,18,19,20,21,22]];

function getAgeGroupIdx(age: number){if(age<22)return 0;if(age<=24)return 1;if(age<=27)return 2;if(age<=30)return 3;if(age<=33)return 4;if(age<=36)return 5;if(age<=39)return 6;if(age<=42)return 7;if(age<=45)return 8;if(age<=48)return 9;if(age<=51)return 10;if(age<=54)return 11;if(age<=57)return 12;return 13;}
function buildMap(raw:(number|string)[][]){const m=new Map<number,number[]>();for(const row of raw){const pts:number[]=[];for(let i=1;i<=14;i++){const v=row[i];pts.push(v===""||v===undefined?25:v as number);}m.set(row[0] as number,pts);}return m;}
const PU_MAP=buildMap(PUSHUP_RAW),SU_MAP=buildMap(SITUP_RAW);
function timeToSec(t:string){const[m,s]=t.split(':').map(Number);return m*60+s;}
const RUN_TABLE:[number,number[]][]=(RUN_RAW as (string|number)[][]).map(row=>{const pts:number[]=[];for(let i=1;i<=14;i++){const v=row[i];pts.push(v===""||v===undefined?50:v as number);}return[timeToSec(row[0] as string),pts];});
function getPts(map:Map<number,number[]>,reps:number,idx:number){return(map.get(reps)??[])[idx]??0;}
function getRunPts(sec:number,idx:number){const r=Math.ceil(sec/10)*10;for(const[ms,pts]of RUN_TABLE){if(r<=ms)return pts[idx]??0;}return 0;}
function calcIpptAward(pu:number,su:number,runSec:number,age:number){const idx=getAgeGroupIdx(age);const puP=getPts(PU_MAP,pu,idx),suP=getPts(SU_MAP,su,idx),runP=getRunPts(runSec,idx);const total=puP+suP+runP;if(puP<1||suP<1||runP<1)return{total,award:'Fail'};if(total>=85)return{total,award:'Gold'};if(total>=75)return{total,award:'Silver'};if(total>=51)return{total,award:'Pass'};return{total,award:'Fail'};}

const AWARD_STYLE:Record<string,string>={Gold:'bg-yellow-400 text-yellow-900',Silver:'bg-slate-300 text-slate-800',Pass:'bg-green-100 text-green-800',Fail:'bg-red-100 text-red-800'};
const fmtTime=(sec:number|null)=>sec?`${Math.floor(sec/60)}:${String(sec%60).padStart(2,'0')}`:'—';
const ACTIVITY_EMOJIS:Record<string,string>={running:'🏃',jogging:'👟',walking:'🚶',swimming:'🏊',cycling:'🚴',ippt_training:'🪖',gym:'🏋️',strength_training:'💪',calisthenics:'🤸',others:'➕'};

// ─── Singapore Public Holidays 2024-2026 ──────────────────────────────────────
const SG_HOLIDAYS: Record<string, string> = {
  // 2025
  '2025-01-01': "New Year's Day",
  '2025-01-29': 'Chinese New Year',
  '2025-01-30': 'Chinese New Year',
  '2025-03-31': 'Hari Raya Puasa',
  '2025-04-18': 'Good Friday',
  '2025-05-01': 'Labour Day',
  '2025-05-12': 'Vesak Day',
  '2025-06-07': 'Hari Raya Haji',
  '2025-08-09': 'National Day',
  '2025-10-20': 'Deepavali',
  '2025-12-25': 'Christmas Day',
  // 2026
  '2026-01-01': "New Year's Day",
  '2026-02-17': 'Chinese New Year',
  '2026-02-18': 'Chinese New Year',
  '2026-03-20': 'Hari Raya Puasa',
  '2026-04-03': 'Good Friday',
  '2026-05-01': 'Labour Day',
  '2026-05-31': 'Vesak Day',
  '2026-05-27': 'Hari Raya Haji',
  '2026-08-09': 'National Day',
  '2026-11-08': 'Deepavali',
  '2026-12-25': 'Christmas Day',
  // 2024 (for history)
  '2024-01-01': "New Year's Day",
  '2024-02-10': 'Chinese New Year',
  '2024-02-11': 'Chinese New Year',
  '2024-04-10': 'Hari Raya Puasa',
  '2024-03-29': 'Good Friday',
  '2024-05-01': 'Labour Day',
  '2024-05-22': 'Vesak Day',
  '2024-06-17': 'Hari Raya Haji',
  '2024-08-09': 'National Day',
  '2024-10-31': 'Deepavali',
  '2024-12-25': 'Christmas Day',
};

const SFT_TYPES = ['Running','Gym','Swimming','Basketball','Badminton','Frisbee','Squash','Strength Training','Others'] as const;

// ─── Shared parade state formatter ───────────────────────────────────────────
function formatParadeState(
  submissions: any[],
  notSubmitted: any[],
  date: string,
  teamName: string,
  sessionType: 'SFT' | 'PT' | 'mixed' = 'mixed'
): string {
  const getName = (s: any) =>
    s.profile
      ? `${s.profile.rank && s.profile.rank !== 'Other' ? s.profile.rank + ' ' : ''}${s.profile.full_name}`
      : 'Member';
  const getMemberName = (m: any) =>
    `${m.profile?.rank && m.profile?.rank !== 'Other' ? m.profile.rank + ' ' : ''}${m.profile?.full_name ?? 'Member'}`;

  // Format date as "22 Apr 2026"
  const [y, mo, d] = date.slice(0, 10).split('-').map(Number);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const fmtD = `${d} ${months[mo - 1]} ${y}`;

  // Determine session label for header
  const isSFT = submissions.length > 0
    ? submissions.every(s => s.session_type === 'SFT')
    : sessionType === 'SFT';
  const sessionLabel = isSFT ? 'SFT Attendance' : 'PT Attendance';

  const lines: string[] = [
    `${sessionLabel} | ${teamName}`,
    `Date: ${fmtD}`,
  ];

  // Split into attending vs not attending
  // For SFT: in_camp counts for attendance; personal is logging-only
  const attending    = submissions.filter(s => s.attendance_status === 'Participating');
  const notAttending = submissions.filter(s => s.attendance_status !== 'Participating');
  const attendingInCamp = isSFT
    ? attending.filter(s => !s.sft_kind || s.sft_kind === 'in_camp')
    : attending;

  // Status abbreviation map
  const statusAbbr: Record<string, string> = {
    'Light Duty': 'LD',
    'MC': 'MC',
    'On Leave': 'OL',
    'RSO': 'RSO',
  };

  // ATTENDING section — grouped by SFT type if SFT, flat if PT
  lines.push(`
ATTENDING (${attending.length})`);

  if (isSFT) {
    const pushGroup = (grpList: any[]) => {
      const groups: Record<string, any[]> = {};
      grpList.forEach(s => {
        const key = s.sft_type === 'Others' && s.sft_custom ? s.sft_custom : (s.sft_type ?? 'Other');
        if (!groups[key]) groups[key] = [];
        groups[key].push(s);
      });
      Object.entries(groups).forEach(([groupName, members]) => {
        lines.push(`${groupName} (${members.length})`);
        members.forEach((s, i) => {
          const temp = s.temperature != null ? ` — ${s.temperature}°C` : '';
          lines.push(`${i + 1}. ${getName(s)}${temp}`);
        });
      });
    };
    const inCampList   = attending.filter(s => !s.sft_kind || s.sft_kind === 'in_camp');
    const personalList = attending.filter(s => s.sft_kind === 'personal');
    if (inCampList.length > 0) pushGroup(inCampList);
    if (personalList.length > 0) {
      lines.push(`
PERSONAL SFT (${personalList.length})`);
      pushGroup(personalList);
    }
  } else {
    // PT — flat numbered list
    attending.forEach((s, i) => {
      const temp = s.temperature != null ? ` — ${s.temperature}°C` : '';
      lines.push(`${i + 1}. ${getName(s)}${temp}`);
    });
  }

  // NOT ATTENDING section
  const totalNotAttending = notAttending.length + notSubmitted.length;
  lines.push(`
NOT ATTENDING (${totalNotAttending})`);
  let idx = 1;
  notAttending.forEach(s => {
    const reason = statusAbbr[s.attendance_status] ?? s.attendance_status;
    lines.push(`${idx++}. ${getName(s)} — ${reason}`);
  });
  notSubmitted.forEach(m => {
    lines.push(`${idx++}. ${getMemberName(m)} — No submission`);
  });

  return lines.join('\n');
}
const ATTENDANCE_STATUSES = ['Participating','Light Duty','MC','On Leave'] as const;

type TeamEvent = {
  id: string; team_id: string; created_by: string;
  title: string; description: string;
  event_date: string; event_type: 'PT'|'SFT'|'Other';
  is_important: boolean; created_at: string;
};

type TeamSubmission = {
  id: string; team_id: string; user_id: string;
  event_id: string|null; submission_date: string;
  session_type: 'PT'|'SFT'; attendance_status: string;
  sft_type: string|null; sft_custom: string|null;
  temperature: number|null; notes: string; created_at: string;
  sft_screenshot_url: string|null;
  sft_kind: 'in_camp' | 'personal' | null;
};

type Tab = 'activities' | 'members' | 'submissions' | 'schedule' | 'leaderboard';
type LeaderboardMetric = 'ippt_total' | 'pushups' | 'situps' | 'run' | 'activities';
type TeamRole = 'admin' | 'pt_ic' | 'spartan' | 'member';

// ── Team posts (polls, notices, questions) ────────────────────────────────────
type PostType = 'poll' | 'notice' | 'question';

type PollOption = { id: string; post_id: string; label: string; position: number };
type PollVote   = { id: string; post_id: string; option_id: string; user_id: string };
type QAnswer    = { id: string; post_id: string; user_id: string; answer: string; created_at: string };

type TeamPost = {
  id: string; team_id: string; created_by: string;
  post_type: PostType; title: string; body: string;
  is_pinned: boolean; pin_until: string | null;
  allow_multi: boolean; created_at: string;
  // hydrated client-side
  options?: PollOption[];
  votes?:   PollVote[];
  answers?: QAnswer[];
};


// ─── Role display helpers ─────────────────────────────────────────────────────

const ROLE_LABEL: Record<TeamRole, string> = {
  admin:   'Team Admin',
  pt_ic:   'PT IC',
  spartan: 'Spartan',
  member:  'Member',
};

const ROLE_BADGE: Record<TeamRole, string> = {
  admin:   'bg-yellow-100 text-yellow-800 border-yellow-300',
  pt_ic:   'bg-blue-100 text-blue-800 border-blue-300',
  spartan: 'bg-red-100 text-red-800 border-red-300',
  member:  'bg-muted text-muted-foreground border-border',
};

function RoleIcon({ role }: { role: TeamRole }) {
  if (role === 'admin')   return <Crown className="h-3.5 w-3.5 text-yellow-500" />;
  if (role === 'pt_ic')   return <Shield className="h-3.5 w-3.5 text-blue-500" />;
  if (role === 'spartan') return <Swords className="h-3.5 w-3.5 text-red-500" />;
  return null;
}

// ─── Triple-confirm delete dialog ────────────────────────────────────────────

function TripleConfirmDelete({ teamName, onConfirm }: { teamName: string; onConfirm: () => void }) {
  const [step, setStep] = useState(0);

  const STEPS = [
    {
      title: 'Delete team?',
      desc: `This will permanently delete "${teamName}" and remove all members. This cannot be undone.`,
      action: 'Yes, continue',
    },
    {
      title: 'Are you absolutely sure?',
      desc: 'All activities shared to this team, member roles, and team data will be lost forever.',
      action: 'Yes, I understand',
    },
    {
      title: 'Final confirmation',
      desc: `Type "DELETE" in your mind and confirm. There is no recovery after this step.`,
      action: 'DELETE TEAM',
    },
  ];

  const current = STEPS[step];

  return (
    <AlertDialog onOpenChange={open => { if (!open) setStep(0); }}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" className="w-full">
          <Trash2 className="h-4 w-4 mr-2" /> Delete Team
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{current.title}</AlertDialogTitle>
          <AlertDialogDescription>{current.desc}</AlertDialogDescription>
          {step > 0 && (
            <p className="text-xs text-muted-foreground mt-1">Step {step + 1} of 3</p>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setStep(0)}>Cancel</AlertDialogCancel>
          {step < 2 ? (
            <AlertDialogAction
              onClick={e => { e.preventDefault(); setStep(s => s + 1); }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {current.action}
            </AlertDialogAction>
          ) : (
            <AlertDialogAction
              onClick={onConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {current.action}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ─── Mini calendar helpers ────────────────────────────────────────────────────

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

// ─── Screenshot card ──────────────────────────────────────────────────────────

function ScreenshotCard({
  name, imageUrl, submission, daysLeft, onExpand,
}: {
  name: string;
  imageUrl: string;
  submission: any;
  daysLeft: number;
  onExpand: (url: string) => void;
}) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const s = submission;

  return (
    <div className="rounded-xl border bg-card overflow-hidden flex flex-col sm:flex-row">
      {/* Thumbnail */}
      <div
        className="sm:w-40 w-full shrink-0 bg-muted flex items-center justify-center cursor-zoom-in overflow-hidden"
        style={{ minHeight: '120px' }}
        onClick={() => !imgError && onExpand(imageUrl)}
      >
        {!imgError ? (
          <>
            {!imgLoaded && (
              <div className="absolute flex flex-col items-center gap-1 text-muted-foreground">
                <Camera className="h-8 w-8 opacity-30 animate-pulse" />
                <span className="text-[10px]">Loading...</span>
              </div>
            )}
            <img
              src={imageUrl}
              alt="SFT screenshot"
              className={`w-full h-full object-cover transition-opacity ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
              style={{ maxHeight: '160px' }}
              onLoad={() => setImgLoaded(true)}
              onError={() => { setImgError(true); setImgLoaded(false); }}
            />
          </>
        ) : (
          <div className="flex flex-col items-center gap-1 text-muted-foreground p-4">
            <Camera className="h-8 w-8 opacity-30" />
            <span className="text-[10px]">Failed to load</span>
          </div>
        )}
      </div>
      {/* Details */}
      <div className="p-3 flex-1 space-y-1.5">
        <p className="text-sm font-semibold">{name}</p>
        <div className="flex flex-wrap gap-1.5 text-xs">
          <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
            {s.sft_type}{s.sft_custom ? ` - ${s.sft_custom}` : ''}
          </span>
          <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
            {s.attendance_status}
          </span>
          {s.temperature != null && (
            <span className={`px-2 py-0.5 rounded-full font-medium ${s.temperature >= 37.5 ? 'bg-red-100 text-red-700' : 'bg-muted text-muted-foreground'}`}>
              {s.temperature}°C
            </span>
          )}
        </div>
        {s.notes && <p className="text-xs text-muted-foreground italic">{s.notes}</p>}
        <p className="text-[10px] text-muted-foreground">
          Tap image to expand · deletes in {daysLeft} day{daysLeft !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Teams() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const { team, members, feed, myRole, myTeamRole, loading, createTeam, joinTeam, deleteTeam, removeMember, updateTeam, updateMemberRole, refreshFeed } = useTeam();

  const hasRole = (roles: string[], role: string) => Array.isArray(roles) && roles.includes(role);

  const isAdmin       = (profile as any)?.is_admin === true;
  const canManage     = hasRole(myTeamRole, 'admin') || hasRole(myTeamRole, 'pt_ic');
  const canAssignPTIC = hasRole(myTeamRole, 'admin');

  const [tab, setTab]               = useState<Tab>('activities');
  const [createName, setCreateName] = useState('');
  const [createDesc, setCreateDesc] = useState('');
  const [creating, setCreating]     = useState(false);
  const [joinCode, setJoinCode]     = useState('');
  const [joining, setJoining]       = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Settings form
  const [editName, setEditName]     = useState('');
  const [editDesc, setEditDesc]     = useState('');
  const [editSaving, setEditSaving] = useState(false);

  // Submission form
  const [subType, setSubType] = useState<'SFT'|'PT'>('PT');
  const [subTemp, setSubTemp] = useState('');
  const [subNotes, setSubNotes] = useState('');

  // Role assignment state
  const [roleUpdating, setRoleUpdating] = useState<string | null>(null);

  // Calendar
  const today = new Date();
  const [calYear, setCalYear]   = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(today.getDate());

  // Events
  const [events, setEvents]           = useState<TeamEvent[]>([]);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [evtTitle, setEvtTitle]       = useState('');
  const [evtDesc, setEvtDesc]         = useState('');
  const [evtDate, setEvtDate]         = useState('');
  const [evtType, setEvtType]         = useState<'PT'|'SFT'|'Other'>('PT');
  const [evtImportant, setEvtImportant] = useState(false);
  const [evtSaving, setEvtSaving]     = useState(false);
  const [submitting, setSubmitting]     = useState(false);

  // Submissions
  const [submissions, setSubmissions]       = useState<TeamSubmission[]>([]);
  const [subDate, setSubDate]               = useState(localDateStr(today));
  const [subEventId, setSubEventId]         = useState<string>('none');
  const [subAttendance, setSubAttendance]   = useState<string>('Participating');
  const [sftType, setSftType]               = useState<string>('Running');
  const [sftCustom, setSftCustom]           = useState('');
  const [sftKind, setSftKind]               = useState<'in_camp'|'personal'>('in_camp');

  // Edit submission state
  const [editingSubId, setEditingSubId]     = useState<string | null>(null);

  // Admin submit-for-others state
  const [adminSubUserId, setAdminSubUserId] = useState<string>('');
  const [adminSubType, setAdminSubType]     = useState<'SFT'|'PT'>('PT');
  const [adminSubAttendance, setAdminSubAttendance] = useState<string>('Participating');
  const [adminSubNotes, setAdminSubNotes]   = useState('');
  const [adminSubTemp, setAdminSubTemp]     = useState('');
  const [adminSftType, setAdminSftType]     = useState<string>('Running');
  const [adminSftCustom, setAdminSftCustom] = useState('');
  const [adminSftKind, setAdminSftKind]     = useState<'in_camp'|'personal'>('in_camp');
  const [adminSubmitting, setAdminSubmitting] = useState(false);
  const [showAdminSubModal, setShowAdminSubModal] = useState(false);


  const [submissionPopupOpen, setSubmissionPopupOpen] = useState(false);
  const [submissionPopupDate, setSubmissionPopupDate] = useState(localDateStr(today));
  const [teamSftView, setTeamSftView] = useState<'in_camp'|'personal'>('in_camp');
  const [screenshotPopupOpen, setScreenshotPopupOpen] = useState(false);
  const [subScreenshotFile, setSubScreenshotFile] = useState<File | null>(null);
  const [subScreenshotUploading, setSubScreenshotUploading] = useState(false);
  const [editSubScreenshotFile, setEditSubScreenshotFile] = useState<File | null>(null);
  const [editSubScreenshotPreview, setEditSubScreenshotPreview] = useState<string | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!createName.trim()) { toast({ title: 'Enter a team name', variant: 'destructive' }); return; }
    setCreating(true);
    const err = await createTeam(createName, createDesc);
    setCreating(false);
    if (err) toast({ title: 'Error', description: err, variant: 'destructive' });
    else toast({ title: `Team "${createName}" created!` });
  };

  const handleJoin = async () => {
    if (!joinCode.trim()) { toast({ title: 'Enter an invite code', variant: 'destructive' }); return; }
    setJoining(true);
    const err = await joinTeam(joinCode);
    setJoining(false);
    if (err) toast({ title: 'Error', description: err, variant: 'destructive' });
    else toast({ title: 'Team joined!' });
  };

  const handleSaveSettings = async () => {
    if (!editName.trim()) { toast({ title: 'Name cannot be empty', variant: 'destructive' }); return; }
    setEditSaving(true);
    await updateTeam(editName, editDesc);
    setEditSaving(false);
    setSettingsOpen(false);
    toast({ title: 'Team settings saved!' });
  };

  const handleRoleToggle = async (userId: string, currentRoles: string[], toggleRole: string) => {
    setRoleUpdating(userId);
    let newRoles: string[];
    if (currentRoles.includes(toggleRole)) {
      // Remove role; ensure at least 'member' remains
      newRoles = currentRoles.filter(r => r !== toggleRole);
      if (newRoles.length === 0) newRoles = ['member'];
    } else {
      // Add role; remove 'member' placeholder if adding a real role
      newRoles = [...currentRoles.filter(r => r !== 'member'), toggleRole];
    }
    await updateMemberRole(userId, newRoles);
    setRoleUpdating(null);
    toast({ title: 'Role updated' });
  };

  // Posts (polls, notices, questions)
  const [posts, setPosts]                 = useState<TeamPost[]>([]);
  const [showPostModal, setShowPostModal] = useState(false);
  const [postType, setPostType]           = useState<PostType>('poll');
  const [postTitle, setPostTitle]         = useState('');
  const [postBody, setPostBody]           = useState('');
  const [postPinned, setPostPinned]       = useState(false);
  const [postPinUntil, setPostPinUntil]   = useState('');
  const [postMulti, setPostMulti]         = useState(false);
  const [pollOptions, setPollOptions]     = useState<string[]>(['', '']);
  const [postSaving, setPostSaving]       = useState(false);
  // per-post interaction state
  const [selectedVotes, setSelectedVotes] = useState<Record<string, string[]>>({});
  const [answerDrafts, setAnswerDrafts]   = useState<Record<string, string>>({});
  const [submittingPost, setSubmittingPost] = useState<string | null>(null);
  const [expandedPost, setExpandedPost]       = useState<string | null>(null);
  const [lbMetric, setLbMetric]               = useState<LeaderboardMetric>('ippt_total');
  const [activityCounts, setActivityCounts]   = useState<Record<string, number>>({});
  const [allSubmissions, setAllSubmissions]   = useState<(TeamSubmission & { profile?: { full_name: string; rank: string } })[]>([]);

  // ── Events + Submissions ─────────────────────────────────────────────────────

  const fetchEvents = useCallback(async () => {
    if (!team) return;
    const { data } = await supabase.from('team_events').select('*')
      .eq('team_id', team.id).order('event_date', { ascending: true });
    if (data) {
      const evts = data as TeamEvent[];
      setEvents(evts);
      // Auto-select today's event in submissions
      const todayStr = localDateStr();
      const todayEvt = evts.find(e => e.event_date === todayStr);
      if (todayEvt) setSubEventId(todayEvt.id);
    }
  }, [team]);

  const fetchSubmissions = useCallback(async () => {
    if (!team || !user) return;
    const { data } = await supabase.from('team_submissions').select('*')
      .eq('team_id', team.id).eq('user_id', user.id)
      .order('submission_date', { ascending: false }).limit(20);
    if (data) setSubmissions(data as TeamSubmission[]);
  }, [team, user]);

  useEffect(() => { if (team) { fetchEvents(); fetchSubmissions(); } }, [team, fetchEvents, fetchSubmissions]);
  useEffect(() => { if (team) { fetchEvents(); fetchSubmissions(); fetchPosts(); } }, [team, fetchEvents, fetchSubmissions]);

  // ── Posts ─────────────────────────────────────────────────────────────────

  const fetchPosts = useCallback(async () => {
    if (!team) return;
    const todayStr = localDateStr();
    const { data: postsData } = await supabase
      .from('team_bulletins').select('*').eq('team_id', team.id)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false });
    if (!postsData) return;

    const postIds = postsData.map((p: any) => p.id);
    const [optRes, voteRes, ansRes] = await Promise.all([
      supabase.from('team_bulletin_options').select('*').in('post_id', postIds).order('position'),
      supabase.from('team_bulletin_votes').select('*').in('post_id', postIds),
      supabase.from('team_bulletin_answers').select('*').in('post_id', postIds),
    ]);

    const options  = (optRes.data  ?? []) as PollOption[];
    const votes    = (voteRes.data ?? []) as PollVote[];
    const answers  = (ansRes.data  ?? []) as QAnswer[];

    const hydrated: TeamPost[] = postsData.map((p: any) => ({
      ...p,
      options:  options.filter(o => o.post_id === p.id),
      votes:    votes.filter(v => v.post_id === p.id),
      answers:  answers.filter(a => a.post_id === p.id),
    }));

    // Filter out expired notices
    const visible = hydrated.filter(p =>
      p.post_type !== 'notice' || !p.pin_until || p.pin_until >= todayStr
    );
    setPosts(visible);

    // Pre-fill user's existing votes
    const myVoteMap: Record<string, string[]> = {};
    votes.filter(v => v.user_id === user?.id).forEach(v => {
      if (!myVoteMap[v.post_id]) myVoteMap[v.post_id] = [];
      myVoteMap[v.post_id].push(v.option_id);
    });
    setSelectedVotes(prev => ({ ...myVoteMap, ...Object.fromEntries(Object.entries(prev).filter(([k]) => !myVoteMap[k])) }));
  }, [team, user]);

  const handleCreatePost = async () => {
    if (!team || !user || !postTitle.trim()) {
      toast({ title: 'Enter a title', variant: 'destructive' }); return;
    }
    if (postType === 'poll' && pollOptions.filter(o => o.trim()).length < 2) {
      toast({ title: 'Add at least 2 options', variant: 'destructive' }); return;
    }
    setPostSaving(true);
    const { data: newPost, error } = await supabase.from('team_bulletins').insert({
      team_id: team.id, created_by: user.id,
      post_type: postType, title: postTitle.trim(), body: postBody.trim(),
      is_pinned: postPinned, pin_until: postPinned && postType === 'notice' ? postPinUntil || null : null,
      allow_multi: postType === 'poll' ? postMulti : false,
    }).select().single();
    if (error || !newPost) { toast({ title: 'Error', description: error?.message, variant: 'destructive' }); setPostSaving(false); return; }

    if (postType === 'poll') {
      const opts = pollOptions.filter(o => o.trim()).map((label, i) => ({ post_id: newPost.id, label: label.trim(), position: i }));
      await supabase.from('team_bulletin_options').insert(opts);
    }
    setPostSaving(false);
    toast({ title: `${postType === 'poll' ? 'Poll' : postType === 'notice' ? 'Notice' : 'Question'} posted!` });
    setShowPostModal(false);
    setPostTitle(''); setPostBody(''); setPostPinned(false); setPostPinUntil(''); setPostMulti(false); setPollOptions(['', '']);
    fetchPosts();
  };

  const handleVote = async (post: TeamPost, optionId: string) => {
    if (!user) return;
    const myVotes = selectedVotes[post.id] ?? [];
    const alreadyVoted = myVotes.includes(optionId);

    if (alreadyVoted) {
      // Remove vote
      await supabase.from('team_bulletin_votes').delete()
        .eq('post_id', post.id).eq('option_id', optionId).eq('user_id', user.id);
      setSelectedVotes(prev => ({ ...prev, [post.id]: myVotes.filter(v => v !== optionId) }));
    } else {
      if (!post.allow_multi) {
        // Single select — remove previous vote first
        if (myVotes.length > 0) {
          await supabase.from('team_bulletin_votes').delete()
            .eq('post_id', post.id).eq('user_id', user.id);
        }
        await supabase.from('team_bulletin_votes').insert({ post_id: post.id, option_id: optionId, user_id: user.id });
        setSelectedVotes(prev => ({ ...prev, [post.id]: [optionId] }));
      } else {
        await supabase.from('team_bulletin_votes').insert({ post_id: post.id, option_id: optionId, user_id: user.id });
        setSelectedVotes(prev => ({ ...prev, [post.id]: [...myVotes, optionId] }));
      }
    }
    fetchPosts();
  };

  const handleSubmitAnswer = async (post: TeamPost) => {
    if (!user) return;
    const answer = (answerDrafts[post.id] ?? '').trim();
    if (!answer) { toast({ title: 'Enter an answer', variant: 'destructive' }); return; }
    setSubmittingPost(post.id);
    const existing = post.answers?.find(a => a.user_id === user.id);
    if (existing) {
      await supabase.from('team_bulletin_answers').update({ answer }).eq('id', existing.id);
    } else {
      await supabase.from('team_bulletin_answers').insert({ post_id: post.id, user_id: user.id, answer });
    }
    setSubmittingPost(null);
    setAnswerDrafts(prev => ({ ...prev, [post.id]: '' }));
    toast({ title: 'Answer submitted!' });
    fetchPosts();
  };

  const handleDeletePost = async (id: string) => {
    await supabase.from('team_bulletins').delete().eq('id', id);
    fetchPosts();
  };

  // ── All submissions (visible to all team members) ────────────────────────────

  const fetchAllSubmissions = useCallback(async () => {
    if (!team) return;
    const { data: subs } = await supabase
      .from('team_submissions').select('*')
      .eq('team_id', team.id)
      .order('submission_date', { ascending: false });
    if (!subs) return;

    const userIds = [...new Set(subs.map((s: any) => s.user_id))];
    const { data: profiles } = userIds.length > 0
      ? await supabase.from('profiles').select('id, full_name, rank').in('id', userIds)
      : { data: [] };
    const profileMap = Object.fromEntries((profiles ?? []).map((p: any) => [p.id, p]));
    setAllSubmissions(subs.map((s: any) => ({ ...s, profile: profileMap[s.user_id] })));
  }, [team]);

  useEffect(() => { if (team) fetchAllSubmissions(); }, [team, fetchAllSubmissions]);
  useEffect(() => { if (team) fetchAllSubmissions(); }, [team, fetchAllSubmissions]);

  const fetchActivityCounts = useCallback(async () => {
    if (!team || members.length === 0) return;
    const memberIds = members.map(m => m.user_id);
    const { data } = await supabase
      .from('team_activities')
      .select('user_id')
      .eq('team_id', team.id);
    if (!data) return;
    const counts: Record<string, number> = {};
    memberIds.forEach(id => { counts[id] = 0; });
    data.forEach((row: any) => { if (counts[row.user_id] !== undefined) counts[row.user_id]++; });
    setActivityCounts(counts);
  }, [team, members]);

  useEffect(() => { if (team && members.length > 0) fetchActivityCounts(); }, [team, members, fetchActivityCounts]);

  // ── Download helpers ──────────────────────────────────────────────────────────

  const downloadTxt = (filename: string, lines: string[]) => {
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const downloadCsv = (filename: string, rows: string[][]) => {
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const downloadPollResults = (p: TeamPost, fmt: 'txt' | 'csv') => {
    const title = p.title;
    const totalVotes = p.votes?.length ?? 0;
    if (fmt === 'txt') {
      const lines = [`Poll: ${title}`, `Total votes: ${totalVotes}`, `Type: ${p.allow_multi ? 'Multi-select' : 'Single-select'}`, ''];
      p.options?.forEach(opt => {
        const voters = (p.votes ?? []).filter(v => v.option_id === opt.id);
        const pct = totalVotes > 0 ? Math.round((voters.length / totalVotes) * 100) : 0;
        lines.push(`${opt.label}: ${voters.length} votes (${pct}%)`);
        voters.forEach(v => {
          const m = members.find(mb => mb.user_id === v.user_id);
          lines.push(`  - ${m?.profile?.full_name ?? v.user_id}`);
        });
      });
      downloadTxt(`poll_${title.replace(/\s+/g,'_')}.txt`, lines);
    } else {
      const rows: string[][] = [['Option', 'Votes', 'Percentage', 'Voters']];
      p.options?.forEach(opt => {
        const voters = (p.votes ?? []).filter(v => v.option_id === opt.id);
        const pct = totalVotes > 0 ? Math.round((voters.length / totalVotes) * 100) : 0;
        const voterNames = voters.map(v => members.find(mb => mb.user_id === v.user_id)?.profile?.full_name ?? v.user_id).join('; ');
        rows.push([opt.label, String(voters.length), `${pct}%`, voterNames]);
      });
      downloadCsv(`poll_${title.replace(/\s+/g,'_')}.csv`, rows);
    }
  };

  const downloadQuestionResults = (p: TeamPost, fmt: 'txt' | 'csv') => {
    const title = p.title;
    if (fmt === 'txt') {
      const lines = [`Question: ${title}`, `Answers: ${p.answers?.length ?? 0}`, ''];
      p.answers?.forEach(a => {
        const m = members.find(mb => mb.user_id === a.user_id);
        lines.push(`${m?.profile?.full_name ?? 'Member'}: ${a.answer}`);
      });
      downloadTxt(`question_${title.replace(/\s+/g,'_')}.txt`, lines);
    } else {
      const rows: string[][] = [['Name', 'Rank', 'Answer', 'Submitted']];
      p.answers?.forEach(a => {
        const m = members.find(mb => mb.user_id === a.user_id);
        rows.push([m?.profile?.full_name ?? 'Member', m?.profile?.rank ?? '', a.answer, fmtDate(a.created_at.slice(0,10))]);
      });
      downloadCsv(`question_${title.replace(/\s+/g,'_')}.csv`, rows);
    }
  };

  const downloadSubmissions = (fmt: 'txt' | 'csv', filterDate?: string) => {
    const STATUS_ORDER: Record<string, number> = { 'Participating': 0, 'Light Duty': 1, 'MC': 2, 'On Leave': 3 };
    const getName = (s: any) => s.profile ? `${s.profile.rank && s.profile.rank !== 'Other' ? s.profile.rank+' ' : ''}${s.profile.full_name}` : s.user_id;
    const getMemberName = (m: any) => `${m.profile?.rank && m.profile.rank !== 'Other' ? m.profile.rank+' ' : ''}${m.profile?.full_name ?? 'Member'}`;

    const notSubmitted = filterDate
      ? members
          .filter(m => !allSubmissions.some(s => s.user_id === m.user_id && s.submission_date === filterDate))
          .sort((a, b) => getMemberName(a).localeCompare(getMemberName(b)))
      : [];
    const filtered = filterDate ? allSubmissions.filter(s => s.submission_date === filterDate) : allSubmissions;
    const sorted = [...filtered].sort((a, b) => {
      const od = (STATUS_ORDER[a.attendance_status] ?? 99) - (STATUS_ORDER[b.attendance_status] ?? 99);
      if (od !== 0) return od;
      return getName(a).localeCompare(getName(b));
    });

    if (fmt === 'txt') {
      const date = filterDate ?? localDateStr();
      const txt = formatParadeState(sorted, notSubmitted, date, team?.name ?? 'Team');
      downloadTxt(`parade_state_${date}.txt`, txt.split('\n'));
    } else {
      const rows: string[][] = [['Date','Name','Rank','Session','Attendance','SFT Type','SFT Kind','Temperature','Notes']];
      sorted.forEach(s => {
        rows.push([
          fmtDate(s.submission_date),
          s.profile?.full_name ?? s.user_id,
          s.profile?.rank ?? '',
          s.session_type,
          s.attendance_status,
          s.session_type==='SFT' ? `${s.sft_type ?? ''}${s.sft_custom ? '/'+s.sft_custom : ''}` : '',
          s.session_type==='SFT' ? (s.sft_kind === 'personal' ? 'Personal' : 'In Camp') : '',
          s.temperature ? String(s.temperature) : '',
          s.notes ?? '',
        ]);
      });
      if (notSubmitted.length > 0) {
        rows.push(['', '', '', '', '', '', '', '']);
        rows.push([filterDate ? fmtDate(filterDate) : '', 'NOT SUBMITTED', '', '', '', '', '', '']);
        notSubmitted.forEach(m => rows.push([
          filterDate ? fmtDate(filterDate) : '',
          m.profile?.full_name ?? 'Member',
          m.profile?.rank ?? '',
          '', 'Not Submitted', '', '', '',
        ]));
      }
      downloadCsv(`submissions_${team?.name?.replace(/\s+/g,'_')}.csv`, rows);
    }
  };

    const handleAddEvent = async () => {
    if (!evtTitle.trim() || !evtDate || !team || !user) {
      toast({ title: 'Fill in title and date', variant: 'destructive' }); return;
    }
    setEvtSaving(true);
    const { error } = await supabase.from('team_events').insert({
      team_id: team.id, created_by: user.id,
      title: evtTitle.trim(), description: evtDesc.trim(),
      event_date: evtDate, event_type: evtType, is_important: evtImportant,
    });
    setEvtSaving(false);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Event added!' });
    setEvtTitle(''); setEvtDesc(''); setEvtDate(''); setEvtType('PT'); setEvtImportant(false);
    setShowAddEvent(false);
    fetchEvents();
  };

  const handleDeleteEvent = async (id: string) => {
    await supabase.from('team_events').delete().eq('id', id);
    fetchEvents();
  };

  const handleToggleImportant = async (evt: TeamEvent) => {
    await supabase.from('team_events').update({ is_important: !evt.is_important }).eq('id', evt.id);
    fetchEvents();
  };

  const uploadScreenshot = async (file: File, submissionId: string): Promise<string | null> => {
    const ext = file.name.split('.').pop() ?? 'jpg';
    const path = `${user!.id}/${submissionId}.${ext}`;
    const { error } = await supabase.storage
      .from('sft-screenshots')
      .upload(path, file, { upsert: true, contentType: file.type });
    if (error) { console.error('Screenshot upload error:', error); return null; }
    const { data } = supabase.storage.from('sft-screenshots').getPublicUrl(path);
    return data?.publicUrl ?? null;
  };

  const handleSubmission = async () => {
    if (!team || !user) return;
    // Block future-date SFT submissions (GMT+8)
    const todayGmt8 = localDateStr();
    if (subType === 'SFT' && subDate > todayGmt8) {
      toast({ title: 'Cannot submit future SFT', description: 'SFT submissions are only allowed for today or past dates.', variant: 'destructive' });
      return;
    }
    // PT: block duplicate on same date. SFT: allow multiple per day.
    if (subType === 'PT') {
      const { data: existing } = await supabase
        .from('team_submissions')
        .select('id')
        .eq('team_id', team.id)
        .eq('user_id', user.id)
        .eq('submission_date', subDate)
        .eq('session_type', 'PT')
        .limit(1);
      if (existing && existing.length > 0) {
        toast({ title: 'Already submitted', description: 'You have already submitted PT attendance for this date. Edit your existing submission above.', variant: 'destructive' });
        return;
      }
    }
    setSubmitting(true);
    const { data: inserted, error } = await supabase.from('team_submissions').insert({
      team_id: team.id, user_id: user.id,
      event_id: subEventId === 'none' ? null : subEventId,
      submission_date: subDate,
      session_type: subType,
      attendance_status: subAttendance,
      sft_type: subType === 'SFT' ? sftType : null,
      sft_custom: subType === 'SFT' && sftType === 'Others' ? sftCustom : null,
      sft_kind: subType === 'SFT' ? sftKind : null,
      temperature: subTemp ? parseFloat(subTemp) : null,
      notes: subNotes,
    }).select().single();
    if (error || !inserted) { setSubmitting(false); toast({ title: 'Error', description: error?.message, variant: 'destructive' }); return; }

    // Upload screenshot if provided (SFT only)
    if (subType === 'SFT' && subScreenshotFile) {
      setSubScreenshotUploading(true);
      const url = await uploadScreenshot(subScreenshotFile, inserted.id);
      if (url) {
        await supabase.from('team_submissions').update({ sft_screenshot_url: url }).eq('id', inserted.id);
      }
      setSubScreenshotUploading(false);
      setSubScreenshotFile(null);
    }

    setSubmitting(false);
    toast({ title: 'Attendance submitted!' });
    setSubTemp(''); setSubNotes(''); setSftCustom(''); setSftKind('in_camp');
    fetchSubmissions();
    fetchAllSubmissions();
  };

  const handleEditSubmission = async (id: string) => {
    if (!team || !user) return;
    setSubmitting(true);
    // Handle screenshot: upload new file, keep existing preview URL, or null if cleared
    let screenshotUrl: string | null | undefined = undefined; // undefined = don't change
    if (editSubScreenshotFile) {
      setSubScreenshotUploading(true);
      const uploaded = await uploadScreenshot(editSubScreenshotFile, id);
      setSubScreenshotUploading(false);
      setEditSubScreenshotFile(null);
      screenshotUrl = uploaded;
    } else if (editSubScreenshotPreview === null) {
      // User explicitly cleared the screenshot
      screenshotUrl = null;
    }
    const updatePayload: Record<string, any> = {
      session_type: subType,
      attendance_status: subAttendance,
      sft_type: subType === 'SFT' ? sftType : null,
      sft_custom: subType === 'SFT' && sftType === 'Others' ? sftCustom : null,
      sft_kind: subType === 'SFT' ? sftKind : null,
      temperature: subTemp ? parseFloat(subTemp) : null,
      notes: subNotes,
    };
    if (screenshotUrl !== undefined) updatePayload.sft_screenshot_url = screenshotUrl;
    const { error } = await supabase.from('team_submissions').update(updatePayload).eq('id', id);
    setSubmitting(false);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Submission updated!' });
    setEditingSubId(null);
    setSubTemp(''); setSubNotes(''); setSftCustom(''); setSftKind('in_camp');
    setEditSubScreenshotFile(null); setEditSubScreenshotPreview(null);
    fetchSubmissions();
    fetchAllSubmissions();
  };

  const handleDeleteSubmission = async (id: string) => {
    const { error } = await supabase.from('team_submissions').delete().eq('id', id);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Submission deleted' });
    fetchSubmissions();
    fetchAllSubmissions();
  };

  const handleAdminSubmit = async () => {
    if (!team || !adminSubUserId) return;
    setAdminSubmitting(true);
    const { error } = await supabase.from('team_submissions').insert({
      team_id: team.id,
      user_id: adminSubUserId,
      event_id: null,
      submission_date: submissionPopupDate,
      session_type: adminSubType,
      attendance_status: adminSubAttendance,
      sft_type: adminSubType === 'SFT' ? adminSftType : null,
      sft_custom: adminSubType === 'SFT' && adminSftType === 'Others' ? adminSftCustom : null,
      sft_kind: adminSubType === 'SFT' ? adminSftKind : null,
      temperature: adminSubTemp ? parseFloat(adminSubTemp) : null,
      notes: adminSubNotes,
    });
    setAdminSubmitting(false);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Attendance recorded!' });
    setShowAdminSubModal(false);
    setAdminSubUserId(''); setAdminSubNotes(''); setAdminSubTemp(''); setAdminSftCustom('');
    fetchAllSubmissions();
  };

  const copyCode = () => {
    if (!team) return;
    navigator.clipboard.writeText(team.invite_code);
    toast({ title: 'Invite code copied!' });
  };

  const initials = (name: string) => name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  const prevMonth = () => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); } else setCalMonth(m => m - 1); setSelectedDay(null); };
  const nextMonth = () => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); } else setCalMonth(m => m + 1); setSelectedDay(null); };

  // ── Loading ───────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="max-w-2xl mx-auto pt-16 text-center text-muted-foreground">
        <Users className="h-8 w-8 mx-auto mb-2 opacity-30 animate-pulse" />
        <p className="text-sm">Loading...</p>
      </div>
    );
  }

  // ── No team ───────────────────────────────────────────────────────────────────
  if (!team) {
    return (
      <div className="max-w-lg mx-auto space-y-6 pt-2">
        <div className="flex items-center gap-3">
          <Users className="h-7 w-7 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Teams</h1>
        </div>

        {isAdmin && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Plus className="h-5 w-5" /> Create a Team</CardTitle>
              <CardDescription>Start a new team and invite your squad</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label>Team Name</Label>
                <Input placeholder="e.g. Alpha Company" value={createName} onChange={e => setCreateName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Description <span className="text-muted-foreground text-xs">(optional)</span></Label>
                <Textarea placeholder="What's this team about?" value={createDesc} onChange={e => setCreateDesc(e.target.value)} rows={2} />
              </div>
              <Button onClick={handleCreate} disabled={creating} className="w-full">
                {creating ? 'Creating...' : 'Create Team'}
              </Button>
            </CardContent>
          </Card>
        )}

        {isAdmin && (
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground uppercase">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Join a Team</CardTitle>
            <CardDescription>Enter an invite code from your team leader</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label>Invite Code</Label>
              <Input placeholder="e.g. a1b2c3d4" value={joinCode} onChange={e => setJoinCode(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleJoin()} />
            </div>
            <Button onClick={handleJoin} disabled={joining} variant={isAdmin ? 'outline' : 'default'} className="w-full">
              {joining ? 'Joining...' : 'Join Team'}
            </Button>
          </CardContent>
        </Card>

        {!isAdmin && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center">
            <Lock className="h-3 w-3" />
            <span>Team creation requires admin access</span>
          </div>
        )}
      </div>
    );
  }

  // ── Has team ──────────────────────────────────────────────────────────────────

  const daysInMonth    = getDaysInMonth(calYear, calMonth);
  const firstDayOfWeek = getFirstDayOfWeek(calYear, calMonth);
  const isToday = (d: number) => d === today.getDate() && calMonth === today.getMonth() && calYear === today.getFullYear();

  const TABS: { id: Tab; label: string; shortLabel: string; icon: React.ReactNode }[] = [
    { id: 'activities',   label: 'Activities',  shortLabel: 'Activity',  icon: <Activity className="h-4 w-4" /> },
    { id: 'members',      label: 'Members',     shortLabel: 'Members',   icon: <Users className="h-4 w-4" /> },
    { id: 'submissions',  label: 'Submissions', shortLabel: 'Submit',    icon: <CheckCircle2 className="h-4 w-4" /> },
    { id: 'schedule',     label: 'Schedule',    shortLabel: 'Schedule',  icon: <Calendar className="h-4 w-4" /> },
    { id: 'leaderboard',  label: 'Leaderboard', shortLabel: 'Ranks',     icon: <Trophy className="h-4 w-4" /> },
  ];

  return (
    <div className="w-full min-w-0 max-w-2xl mx-auto space-y-4 pb-10" style={{ overflowX: 'hidden' }}>

      {/* ── Team header ── */}
      <div className="rounded-2xl border bg-card p-4 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-foreground truncate">{team.name}</h2>
            {team.description && <p className="text-sm text-muted-foreground mt-0.5">{team.description}</p>}
            <p className="text-xs text-muted-foreground mt-1">{members.length} member{members.length !== 1 ? 's' : ''}</p>
          </div>

          {/* Settings sheet — visible to all members */}
          <Sheet open={settingsOpen} onOpenChange={open => { if (open) { setEditName(team.name); setEditDesc(team.description ?? ''); } setSettingsOpen(open); }}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 ml-2">
                <Settings className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Team Settings</SheetTitle>
              </SheetHeader>
              <div className="space-y-6 mt-6">

                {/* Team info — editable by admin only */}
                {myTeamRole === 'admin' && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Team Info</h3>
                    <div className="space-y-2">
                      <Label>Team Name</Label>
                      <Input value={editName} onChange={e => setEditName(e.target.value)} placeholder="Team name" />
                    </div>
                    <div className="space-y-2">
                      <Label>Description <span className="text-muted-foreground text-xs">(optional)</span></Label>
                      <Textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} placeholder="What's this team about?" rows={3} />
                    </div>
                    <Button onClick={handleSaveSettings} disabled={editSaving} className="w-full">
                      {editSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                )}

                {/* Invite code — visible to admin & PT IC */}
                {canManage && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Invite Code</h3>
                    <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2">
                      <p className="flex-1 text-sm font-mono font-semibold tracking-wider">{team.invite_code}</p>
                      <Button variant="ghost" size="icon" onClick={copyCode} className="h-8 w-8">
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">Share this code with members to join your team.</p>
                  </div>
                )}

                {/* Danger zone — admin & PT IC can delete */}
                {canManage && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-destructive uppercase tracking-wide">Danger Zone</h3>
                    <TripleConfirmDelete teamName={team.name} onConfirm={deleteTeam} />
                  </div>
                )}

              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Invite code quick-copy for admin */}
        {myTeamRole === 'admin' && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-muted px-3 py-2">
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Invite Code</p>
              <p className="text-sm font-mono font-semibold tracking-wider">{team.invite_code}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={copyCode} className="h-8 w-8">
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* My role badges — show all non-member roles */}
        {myTeamRole.some(r => r !== 'member') && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {myTeamRole.filter(r => r !== 'member').map(r => (
              <span key={r} className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${ROLE_BADGE[r as TeamRole]}`}>
                <RoleIcon role={r as TeamRole} />
                {ROLE_LABEL[r as TeamRole]}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Tabs ── */}
      <div className="flex rounded-xl border overflow-hidden">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 py-2.5 font-medium transition-colors flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1 ${tab === t.id ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:bg-muted'}`}>
            {t.icon}
            <span className="text-[10px] sm:text-xs leading-tight">{t.shortLabel}</span>
          </button>
        ))}
      </div>

      {/* ── Activities ── */}
      {tab === 'activities' && (() => {
        const todayStr = localDateStr(today);
        const pinnedEvents = events.filter(e => e.is_important && e.event_date >= todayStr)
          .sort((a, b) => a.event_date.localeCompare(b.event_date));
        const pinnedPosts = posts.filter(p => p.is_pinned);
        const unpinnedPosts = posts.filter(p => !p.is_pinned);

        const renderPost = (p: TeamPost) => {
          const myVotes = selectedVotes[p.id] ?? [];
          const myAnswer = p.answers?.find(a => a.user_id === user?.id);
          const totalVotes = p.votes?.length ?? 0;

          return (
            <div key={p.id} className={`rounded-2xl border bg-card shadow-sm overflow-hidden ${p.is_pinned ? 'border-yellow-400' : ''}`}>
              {/* Header */}
              <div className="flex items-start gap-3 px-4 pt-4 pb-3">
                <div className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 text-white
                  ${p.post_type==='poll'?'bg-violet-500':p.post_type==='notice'?'bg-orange-500':'bg-teal-500'}`}>
                  {p.post_type==='poll' ? <BarChart2 className="h-4 w-4" /> : p.post_type==='notice' ? <Bell className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {p.is_pinned && <Pin className="h-3.5 w-3.5 text-yellow-500 shrink-0" />}
                    <span className="text-sm font-semibold">{p.title}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                      ${p.post_type==='poll'?'bg-violet-100 text-violet-700':p.post_type==='notice'?'bg-orange-100 text-orange-700':'bg-teal-100 text-teal-700'}`}>
                      {p.post_type==='poll'?'Poll':p.post_type==='notice'?'Notice':'Question'}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {fmtDate(p.created_at.slice(0,10), { year: true })}
                    {p.post_type==='notice' && p.pin_until && ` · Until ${fmtDate(p.pin_until.slice(0,10))}`}
                  </p>
                </div>
                {canManage && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-destructive transition-colors shrink-0">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete this post?</AlertDialogTitle>
                        <AlertDialogDescription>This will remove the {p.post_type} and all responses permanently.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeletePost(p.id)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>

              {/* Body */}
              {p.body && <p className="px-4 pb-3 text-sm text-muted-foreground">{p.body}</p>}

              {/* Poll options */}
              {p.post_type === 'poll' && p.options && (
                <div className="px-4 pb-4 space-y-2">
                  <p className="text-xs text-muted-foreground">{p.allow_multi ? 'Select all that apply' : 'Select one'} · {totalVotes} vote{totalVotes !== 1 ? 's' : ''}</p>
                  {p.options.map(opt => {
                    const optVotes = p.votes?.filter(v => v.option_id === opt.id).length ?? 0;
                    const pct = totalVotes > 0 ? Math.round((optVotes / totalVotes) * 100) : 0;
                    const voted = myVotes.includes(opt.id);
                    return (
                      <button key={opt.id} onClick={() => handleVote(p, opt.id)}
                        className={`w-full text-left rounded-lg border px-3 py-2 transition-colors relative overflow-hidden
                          ${voted ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted'}`}>
                        <div className="absolute inset-0 rounded-lg transition-all" style={{ width: `${pct}%`, backgroundColor: voted ? 'hsl(var(--primary)/0.12)' : 'hsl(var(--muted))' }} />
                        <div className="relative flex items-center justify-between gap-2">
                          <span className={`text-sm ${voted ? 'font-semibold text-primary' : ''}`}>{opt.label}</span>
                          <span className="text-xs text-muted-foreground tabular-nums">{pct}% ({optVotes})</span>
                        </div>
                      </button>
                    );
                  })}

                  {/* Voter breakdown dropdown — all members */}
                  {totalVotes > 0 && (
                    <div className="border-t pt-2">
                      <button
                        onClick={() => setExpandedPost(expandedPost === p.id + '_p' ? null : p.id + '_p')}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors w-full">
                        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expandedPost === p.id + '_p' ? 'rotate-180' : ''}`} />
                        <span>See who voted ({totalVotes})</span>
                      </button>
                      {expandedPost === p.id + '_p' && (
                        <div className="mt-2 space-y-2">
                          {p.options?.map(opt => {
                            const voters = (p.votes ?? []).filter(v => v.option_id === opt.id);
                            if (voters.length === 0) return null;
                            return (
                              <div key={opt.id}>
                                <p className="text-xs font-semibold text-muted-foreground mb-1">{opt.label}</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {voters.map(v => {
                                    const m = members.find(mb => mb.user_id === v.user_id);
                                    return (
                                      <span key={v.id} className="text-xs bg-muted rounded-full px-2 py-0.5">
                                        {m?.profile?.rank && m.profile.rank !== 'Other' ? m.profile.rank + ' ' : ''}{m?.profile?.full_name ?? 'Member'}
                                      </span>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                          {canManage && (
                            <div className="flex gap-2 pt-1">
                              <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => downloadPollResults(p, 'txt')}>
                                <FileText className="h-3 w-3 mr-1" /> .txt
                              </Button>
                              <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => downloadPollResults(p, 'csv')}>
                                <Download className="h-3 w-3 mr-1" /> .csv
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Question answer box */}
              {p.post_type === 'question' && (
                <div className="px-4 pb-4 space-y-2">
                  {myAnswer ? (
                    <div className="rounded-lg bg-teal-50 dark:bg-teal-900/20 border border-teal-200 px-3 py-2">
                      <p className="text-xs text-teal-600 font-medium mb-0.5">Your answer</p>
                      <p className="text-sm">{myAnswer.answer}</p>
                      <button className="text-xs text-muted-foreground underline mt-1"
                        onClick={() => setAnswerDrafts(prev => ({ ...prev, [p.id]: myAnswer.answer }))}>
                        Edit
                      </button>
                    </div>
                  ) : null}
                  {(!myAnswer || (answerDrafts[p.id] ?? '') !== '') && (
                    <div className="flex gap-2">
                      <Textarea
                        placeholder="Type your answer..."
                        rows={2}
                        value={answerDrafts[p.id] ?? ''}
                        onChange={e => setAnswerDrafts(prev => ({ ...prev, [p.id]: e.target.value }))}
                        className="flex-1 text-sm resize-none"
                      />
                      <Button size="icon" className="shrink-0 self-end"
                        disabled={submittingPost === p.id}
                        onClick={() => handleSubmitAnswer(p)}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  {/* Results dropdown — all members */}
                  {(p.answers?.length ?? 0) > 0 && (
                    <div className="mt-1 border-t pt-2">
                      <button
                        onClick={() => setExpandedPost(expandedPost === p.id + '_q' ? null : p.id + '_q')}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors w-full">
                        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expandedPost === p.id + '_q' ? 'rotate-180' : ''}`} />
                        <span>{p.answers?.length} answer{(p.answers?.length ?? 0) !== 1 ? 's' : ''} submitted</span>
                      </button>
                      {expandedPost === p.id + '_q' && (
                        <div className="mt-2 space-y-1.5">
                          {p.answers?.map(a => {
                            const member = members.find(m => m.user_id === a.user_id);
                            return (
                              <div key={a.id} className="rounded-lg bg-muted px-3 py-2 text-sm">
                                <p className="text-xs font-semibold text-muted-foreground mb-0.5">
                                  {member?.profile?.rank && member.profile.rank !== 'Other' ? member.profile.rank + ' ' : ''}{member?.profile?.full_name ?? 'Member'}
                                </p>
                                <p>{a.answer}</p>
                              </div>
                            );
                          })}
                          {canManage && (
                            <div className="flex gap-2 pt-1">
                              <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => downloadQuestionResults(p, 'txt')}>
                                <FileText className="h-3 w-3 mr-1" /> .txt
                              </Button>
                              <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => downloadQuestionResults(p, 'csv')}>
                                <Download className="h-3 w-3 mr-1" /> .csv
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        };

        return (
        <div className="space-y-4">

          {/* Create post button — admin/PT IC only */}
          {canManage && (
            <Button variant="outline" size="sm" className="w-full" onClick={() => setShowPostModal(true)}>
              <Plus className="h-4 w-4 mr-2" /> Create Poll / Notice / Question
            </Button>
          )}

          {/* Pinned important events */}
          {pinnedEvents.map(e => (
            <div key={e.id} className="flex items-start gap-3 rounded-xl border-2 border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 px-4 py-3 shadow-sm">
              <Pin className="h-4 w-4 text-yellow-600 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold text-yellow-800 dark:text-yellow-200">{e.title}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${e.event_type==='PT'?'bg-blue-100 text-blue-700':e.event_type==='SFT'?'bg-green-100 text-green-700':'bg-muted text-muted-foreground'}`}>
                    {e.event_type}
                  </span>
                </div>
                <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-0.5">
                  {fmtDate(e.event_date, { weekday: true })}
                </p>
                {e.description && <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-0.5">{e.description}</p>}
              </div>
            </div>
          ))}

          {/* Pinned posts */}
          {pinnedPosts.map(renderPost)}

          {feed.length === 0 && unpinnedPosts.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Activity className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">No activities yet</p>
              <p className="text-xs mt-1 opacity-70">Team members' activities will appear here</p>
            </div>
          ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">{feed.length} recent activities</p>
              <Button variant="ghost" size="sm" onClick={refreshFeed} className="text-xs h-7 px-2">
                Refresh
              </Button>
            </div>
            {feed.map(a => {
              const mi = a.profile?.full_name ? initials(a.profile.full_name) : '?';
              const emoji = ACTIVITY_EMOJIS[a.type] ?? '🏃';
              const label = a.type === 'others' && a.custom_type ? a.custom_type : a.type.replace(/_/g, ' ');
              return (
                <div key={a.id} className="rounded-2xl border bg-card shadow-sm overflow-hidden">
                  <div className="flex items-center gap-3 px-4 pt-4 pb-2">
                    <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold shrink-0">{mi}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-sm font-semibold">{a.profile?.rank && a.profile.rank !== 'Other' ? `${a.profile.rank} ` : ''}{a.profile?.full_name ?? 'Member'}</p>
                        <span>{emoji}</span>
                        <span className="text-xs font-medium text-primary capitalize">{label}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <span>{fmtDate(a.date, { year: true })}</span>
                        {a.location && <><span>·</span><MapPin className="h-3 w-3" /><span>{a.location}</span></>}
                      </div>
                    </div>
                  </div>
                  {a.title && <p className="px-4 pb-1 text-sm font-semibold">{a.title}</p>}
                  {a.description && <p className="px-4 pb-2 text-sm leading-relaxed text-muted-foreground">{a.description}</p>}
                  {a.image_url && <img src={a.image_url} alt="activity" className="w-full h-auto max-h-[75vw] sm:max-h-96 object-contain bg-muted" />}
                  {(a.duration_minutes || a.distance_km) && (
                    <div className="flex gap-6 px-4 py-3 border-t bg-muted/30">
                      {a.duration_minutes && <div><p className="text-xs text-muted-foreground">Duration</p><p className="text-sm font-semibold">{a.duration_minutes} min</p></div>}
                      {a.distance_km && <div><p className="text-xs text-muted-foreground">Distance</p><p className="text-sm font-semibold">{a.distance_km} km</p></div>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          )}

          {/* Unpinned posts — below feed */}
          {unpinnedPosts.map(renderPost)}

        </div>
        );
      })()}

      {/* ── Members ── */}
      {tab === 'members' && (
        <div className="space-y-3">
          {members.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No members yet</p>
            </div>
          )}

          {/* Role legend */}
          {members.length > 0 && (
            <div className="flex flex-wrap gap-2 px-1">
              {(['admin', 'pt_ic', 'spartan', 'member'] as TeamRole[]).map(r => (
                <span key={r} className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${ROLE_BADGE[r]}`}>
                  <RoleIcon role={r} />{ROLE_LABEL[r]}
                </span>
              ))}
            </div>
          )}

          {members.map(m => {
            const p = m.profile;
            const isMe = m.user_id === user!.id;
            const memberTeamRole: string[] = Array.isArray(m.team_role) && m.team_role.length ? m.team_role : ['member'];
            const primaryRole = (['admin','pt_ic','spartan'].find(r => memberTeamRole.includes(r)) ?? 'member') as TeamRole;
            const ippt = p?.ippt_pushups && p?.ippt_situps && p?.ippt_run_seconds && p?.age
              ? calcIpptAward(p.ippt_pushups, p.ippt_situps, p.ippt_run_seconds, p.age) : null;

            // What roles can the current user assign to this member?
            const assignableRoles: string[] = (() => {
              if (isMe) return [];
              if (canAssignPTIC) return ['pt_ic', 'spartan']; // admin role is permanent, cannot be toggled
              if (hasRole(myTeamRole, 'pt_ic')) return ['spartan'];     // PT IC can only toggle spartan
              return [];
            })();

            const canKick = canManage && !isMe && !memberTeamRole.includes('admin');

            return (
              <div key={m.id || m.user_id} className="rounded-xl border bg-card p-4 space-y-3">
                {/* Member info row */}
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold shrink-0">
                    {p?.full_name ? initials(p.full_name) : '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold">
                        {p?.rank && p.rank !== 'Other' ? `${p.rank} ` : ''}{p?.full_name ?? 'Member'}
                      </span>
                      <RoleIcon role={primaryRole} />
                      {memberTeamRole.filter(r => r !== 'member').map(r => (
                        <span key={r} className={`text-xs px-2 py-0.5 rounded-full border ${ROLE_BADGE[r as TeamRole]}`}>
                          {ROLE_LABEL[r as TeamRole]}
                        </span>
                      ))}
                      {memberTeamRole.every(r => r === 'member') && (
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${ROLE_BADGE['member']}`}>Member</span>
                      )}
                      {isMe && <Badge variant="outline" className="text-xs">You</Badge>}
                      {ippt && (
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${AWARD_STYLE[ippt.award]}`}>
                          IPPT {ippt.award} · {ippt.total}pts
                        </span>
                      )}
                    </div>
                    {ippt && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        PU: {p?.ippt_pushups} · SU: {p?.ippt_situps} · Run: {fmtTime(p?.ippt_run_seconds ?? null)}
                      </p>
                    )}
                    {!ippt && p?.rank && (
                      <p className="text-xs text-muted-foreground mt-0.5">{p.rank}</p>
                    )}
                  </div>

                  {/* Kick button */}
                  {canKick && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remove member?</AlertDialogTitle>
                          <AlertDialogDescription>
                            {p?.full_name ?? 'This member'} will be removed from the team.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => removeMember(m.user_id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Remove
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>

                {/* Role assignment — checkboxes so roles can be stacked */}
                {assignableRoles.length > 0 && (
                  <div className="pt-2 border-t space-y-1">
                    <span className="text-xs text-muted-foreground">Assign roles:</span>
                    <div className="flex flex-wrap gap-3 pt-1">
                      {assignableRoles.map(r => (
                        <label key={r} className="flex items-center gap-1.5 cursor-pointer select-none">
                          <Checkbox
                            checked={memberTeamRole.includes(r)}
                            onCheckedChange={() => handleRoleToggle(m.user_id, memberTeamRole, r)}
                            disabled={roleUpdating === m.user_id}
                            className="h-4 w-4"
                          />
                          <span className="text-xs font-medium">{ROLE_LABEL[r as TeamRole]}</span>
                        </label>
                      ))}
                    </div>
                    {roleUpdating === m.user_id && (
                      <span className="text-xs text-muted-foreground">Saving...</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Submissions ── */}
      {tab === 'submissions' && (() => {
        const todayStr = localDateStr(today);
        // Event selector: only show events for the selected date
        const eventsForDate = events.filter(e => e.event_date === subDate);
        // All-team view: group by date, compute not-submitted per date
        const submissionDates = [...new Set(allSubmissions.map(s => s.submission_date))].sort((a,b) => b.localeCompare(a));
        const statusEmoji: Record<string,string> = { Participating:'✅', 'Light Duty':'⚠️', MC:'🏥', 'On Leave':'🏖️' };

        // For popup: build state string for a given date
        const STATUS_ORDER_TEXT: Record<string, number> = { 'Participating': 0, 'Light Duty': 1, 'MC': 2, 'On Leave': 3 };
        const buildStateText = (date: string) => {
          // Exclude personal SFT — they are logging only, not attendance
          const daySubmissions = allSubmissions.filter(s =>
            s.submission_date === date &&
            !(s.session_type === 'SFT' && s.sft_kind === 'personal')
          );
          const notSub = members.filter(m => !daySubmissions.some(s => s.user_id === m.user_id));
          return formatParadeState(daySubmissions, notSub, date, team?.name ?? 'Team');
        };

        return (
          <div className="space-y-4 min-w-0 overflow-hidden">
            {/* Important pinned events */}
            {events.filter(e => e.is_important && e.event_date >= todayStr).slice(0,3).map(e => (
              <div key={e.id} className="flex items-start gap-2 rounded-xl border border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20 px-4 py-3">
                <Pin className="h-4 w-4 text-yellow-600 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-300">{e.title}</p>
                  <p className="text-xs text-yellow-700 dark:text-yellow-400">{fmtDate(e.event_date, { weekday: true })} · {e.event_type}</p>
                  {e.description && <p className="text-xs text-yellow-600 mt-0.5">{e.description}</p>}
                </div>
              </div>
            ))}

            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" /> Submit Attendance
                </CardTitle>
                <CardDescription>Record your parade state for PT or SFT</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 overflow-hidden">

                {/* Date */}
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={subDate}
                    max={localDateStr()}
                    onChange={e => {
                      // GMT+8: clamp to today
                      const selected = e.target.value;
                      const todayGmt8 = localDateStr();
                      setSubDate(selected > todayGmt8 ? todayGmt8 : selected);
                      setSubEventId('none');
                    }}
                    className="w-full appearance-none"
                    style={{ colorScheme: 'light' }}
                  />
                </div>

                {/* Link to event — only shows events for the selected date */}
                <div className="space-y-2">
                  <Label>Event <span className="text-muted-foreground text-xs">(optional)</span></Label>
                  <Select value={subEventId} onValueChange={setSubEventId}>
                    <SelectTrigger><SelectValue placeholder="Select event..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No specific event</SelectItem>
                      {eventsForDate.length === 0 ? (
                        <SelectItem value="__no_events__" disabled>No events on this date</SelectItem>
                      ) : (
                        eventsForDate.map(e => (
                          <SelectItem key={e.id} value={e.id}>
                            {e.title} ({e.event_type})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Session type */}
                <div className="space-y-2">
                  <Label>Session Type</Label>
                  <div className="flex rounded-lg border overflow-hidden">
                    {(['PT','SFT'] as const).map(t => (
                      <button key={t} onClick={() => setSubType(t)}
                        className={`flex-1 py-2 text-sm font-semibold transition-colors ${subType === t ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:bg-muted'}`}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* SFT type */}
                {subType === 'SFT' && (
                  <div className="space-y-2">
                    <Label>SFT Mode</Label>
                    <div className="flex rounded-lg border overflow-hidden">
                      {(['in_camp', 'personal'] as const).map(k => (
                        <button key={k} onClick={() => {
                          setSftKind(k);
                          if (k === 'personal') setSubAttendance('Participating');
                        }}
                          className={`flex-1 py-2 text-sm font-semibold transition-colors ${sftKind === k ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:bg-muted'}`}>
                          {k === 'in_camp' ? '🏕️ In Camp' : '🏃 Personal'}
                        </button>
                      ))}
                    </div>
                    {sftKind === 'personal' && (
                      <p className="text-xs text-muted-foreground">Personal SFT is for logging only and does not count towards attendance.</p>
                    )}
                  </div>
                )}
                {subType === 'SFT' && (
                  <div className="space-y-2">
                    <Label>Type of SFT</Label>
                    <Select value={sftType} onValueChange={setSftType}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {SFT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {sftType === 'Others' && (
                      <Input placeholder="Describe the activity..." value={sftCustom} onChange={e => setSftCustom(e.target.value)} />
                    )}
                  </div>
                )}

                {/* Attendance status — hidden for personal SFT (always Participating) */}
                {!(subType === 'SFT' && sftKind === 'personal') && (
                  <div className="space-y-2">
                    <Label>Attendance Status</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {ATTENDANCE_STATUSES.map(s => (
                        <button key={s} onClick={() => setSubAttendance(s)}
                          className={`py-2 px-3 rounded-lg border text-sm font-medium transition-colors text-left ${subAttendance === s ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-foreground border-border hover:bg-muted'}`}>
                          {s === 'Participating' && '✅ '}{s === 'Light Duty' && '⚠️ '}{s === 'MC' && '🏥 '}{s === 'On Leave' && '🏖️ '}
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Temperature */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    <Thermometer className="h-4 w-4" /> Temperature (°C) <span className="text-muted-foreground text-xs">(optional)</span>
                  </Label>
                  <Input type="number" step="0.1" min="35" max="42" placeholder="e.g. 36.5" value={subTemp} onChange={e => setSubTemp(e.target.value)} />
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label>Notes <span className="text-muted-foreground text-xs">(optional)</span></Label>
                  <Textarea placeholder="Any remarks..." value={subNotes} onChange={e => setSubNotes(e.target.value)} rows={2} />
                </div>

                {/* SFT Screenshot upload */}
                {subType === 'SFT' && (
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5">
                      <Camera className="h-4 w-4" /> SFT Form Screenshot <span className="text-muted-foreground text-xs">(optional)</span>
                    </Label>
                    <div className="flex items-center gap-2">
                      <label className="flex-1 cursor-pointer">
                        <div className={`flex items-center gap-2 rounded-lg border border-dashed px-3 py-2.5 text-sm transition-colors hover:bg-muted ${subScreenshotFile ? 'border-primary bg-primary/5' : 'border-border'}`}>
                          <ImageIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                          <span className={`truncate text-xs ${subScreenshotFile ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                            {subScreenshotFile ? subScreenshotFile.name : 'Tap to attach screenshot...'}
                          </span>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={e => setSubScreenshotFile(e.target.files?.[0] ?? null)}
                        />
                      </label>
                      {subScreenshotFile && (
                        <button onClick={() => setSubScreenshotFile(null)} className="p-1.5 rounded hover:bg-muted text-muted-foreground shrink-0">
                          <XIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">Screenshot will be automatically deleted after 27 days.</p>
                  </div>
                )}

                <Button onClick={handleSubmission} disabled={submitting || subScreenshotUploading} className="w-full">
                  <Clock className="h-4 w-4 mr-2" />
                  {subScreenshotUploading ? 'Uploading screenshot...' : submitting ? 'Submitting...' : `Submit ${subType} Attendance`}
                </Button>
              </CardContent>
            </Card>

            {/* My submission history */}
            {submissions.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-1">My Recent Submissions</p>
                {submissions.map(s => (
                  <div key={s.id} className="rounded-lg border bg-card p-3 space-y-2">
                    {editingSubId === s.id ? (
                      // ── Edit mode ──
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold">{fmtDate(s.submission_date, { year: true })}</span>
                          <button onClick={() => { setEditingSubId(null); setSubTemp(''); setSubNotes(''); setSftCustom(''); setEditSubScreenshotFile(null); setEditSubScreenshotPreview(null); }}
                            className="p-1 rounded hover:bg-muted text-muted-foreground">
                            <XIcon className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="flex rounded-lg border overflow-hidden">
                          {(['PT','SFT'] as const).map(t2 => (
                            <button key={t2} onClick={() => setSubType(t2)}
                              className={`flex-1 py-1.5 text-xs font-semibold transition-colors ${subType === t2 ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:bg-muted'}`}>
                              {t2}
                            </button>
                          ))}
                        </div>
                        {subType === 'SFT' && (
                          <div className="flex rounded-lg border overflow-hidden">
                            {(['in_camp', 'personal'] as const).map(k => (
                              <button key={k} onClick={() => setSftKind(k)}
                                className={`flex-1 py-1.5 text-xs font-semibold transition-colors ${sftKind === k ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:bg-muted'}`}>
                                {k === 'in_camp' ? '🏕️ In Camp' : '🏃 Personal'}
                              </button>
                            ))}
                          </div>
                        )}
                        {subType === 'SFT' && (
                          <Select value={sftType} onValueChange={setSftType}>
                            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>{SFT_TYPES.map(t2 => <SelectItem key={t2} value={t2} className="text-xs">{t2}</SelectItem>)}</SelectContent>
                          </Select>
                        )}
                        {!(subType === 'SFT' && sftKind === 'personal') && (
                          <div className="grid grid-cols-2 gap-2">
                            {ATTENDANCE_STATUSES.map(st => (
                              <button key={st} onClick={() => setSubAttendance(st)}
                                className={`py-1.5 px-2 rounded-lg border text-xs font-medium transition-colors text-left ${subAttendance === st ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-foreground border-border hover:bg-muted'}`}>
                                {st === 'Participating' && '✅ '}{st === 'Light Duty' && '⚠️ '}{st === 'MC' && '🏥 '}{st === 'On Leave' && '🏖️ '}
                                {st}
                              </button>
                            ))}
                          </div>
                        )}
                        <Input type="number" step="0.1" min="35" max="42" placeholder="Temp °C (optional)" value={subTemp} onChange={e => setSubTemp(e.target.value)} className="h-8 text-xs" />
                        <Input placeholder="Notes (optional)" value={subNotes} onChange={e => setSubNotes(e.target.value)} className="h-8 text-xs" />
                        {/* Screenshot edit — SFT only */}
                        {subType === 'SFT' && (
                          <div className="space-y-1.5">
                            <p className="text-[10px] font-medium text-muted-foreground flex items-center gap-1"><Camera className="h-3 w-3" /> Screenshot</p>
                            {editSubScreenshotPreview ? (
                              <div className="relative rounded-lg overflow-hidden border">
                                <img src={editSubScreenshotPreview} alt="screenshot preview" className="w-full h-24 object-cover" />
                                <button
                                  onClick={() => { setEditSubScreenshotPreview(null); setEditSubScreenshotFile(null); }}
                                  className="absolute top-1 right-1 bg-black/60 rounded-full p-0.5 text-white hover:bg-black/80"
                                >
                                  <XIcon className="h-3 w-3" />
                                </button>
                              </div>
                            ) : (
                              <label className="cursor-pointer block">
                                <div className={`flex items-center gap-2 rounded-lg border border-dashed px-2 py-2 text-xs transition-colors hover:bg-muted ${editSubScreenshotFile ? 'border-primary bg-primary/5' : 'border-border'}`}>
                                  <ImageIcon className="h-3 w-3 shrink-0 text-muted-foreground" />
                                  <span className={`truncate ${editSubScreenshotFile ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                                    {editSubScreenshotFile ? editSubScreenshotFile.name : 'Tap to attach screenshot...'}
                                  </span>
                                </div>
                                <input type="file" accept="image/*" className="hidden"
                                  onChange={e => {
                                    const f = e.target.files?.[0];
                                    if (f) { setEditSubScreenshotFile(f); setEditSubScreenshotPreview(URL.createObjectURL(f)); }
                                  }}
                                />
                              </label>
                            )}
                          </div>
                        )}
                        <div className="flex gap-2">
                          <Button size="sm" className="flex-1 h-8 text-xs" onClick={() => handleEditSubmission(s.id)} disabled={submitting || subScreenshotUploading}>
                            {subScreenshotUploading ? 'Uploading...' : submitting ? 'Saving...' : 'Save Changes'}
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="destructive" className="h-8 text-xs px-2">
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete submission?</AlertDialogTitle>
                                <AlertDialogDescription>This will permanently remove this attendance record.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteSubmission(s.id)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    ) : (
                      // ── View mode ──
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-semibold">{fmtDate(s.submission_date, { year: true })}</span>
                            <span className="text-xs px-1.5 py-0.5 rounded-full bg-muted">{s.session_type}</span>
                            <span className="text-xs">{statusEmoji[s.attendance_status] ?? ''} {s.attendance_status}</span>
                          </div>
                          {s.session_type === 'SFT' && (
                            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${s.sft_kind === 'personal' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'}`}>
                                {s.sft_kind === 'personal' ? '🏃 Personal' : '🏕️ In Camp'}
                              </span>
                              {s.sft_type && <p className="text-xs text-muted-foreground">{s.sft_type}{s.sft_custom ? ` - ${s.sft_custom}` : ''}</p>}
                            </div>
                          )}
                          {s.notes && <p className="text-xs text-muted-foreground mt-0.5">{s.notes}</p>}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {s.temperature && <span className="text-xs text-muted-foreground">{s.temperature}°C</span>}
                          <button
                            onClick={() => {
                              setEditingSubId(s.id);
                              setSubType(s.session_type as 'PT'|'SFT');
                              setSubAttendance(s.attendance_status);
                              setSftType(s.sft_type ?? 'Running');
                              setSftCustom(s.sft_custom ?? '');
                              setSftKind((s.sft_kind as 'in_camp'|'personal') ?? 'in_camp');
                              setSubTemp(s.temperature ? String(s.temperature) : '');
                              setSubNotes(s.notes ?? '');
                              setEditSubScreenshotPreview(s.sft_screenshot_url ?? null);
                              setEditSubScreenshotFile(null);
                            }}
                            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                            title="Edit submission"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* ── All Team Submissions (all members) ── */}
            {(() => {
              const availableDates = [...new Set([todayStr, ...submissionDates])].sort((a,b) => b.localeCompare(a));
              const viewDate = submissionPopupDate;
              const daySubmissions = allSubmissions.filter(s => s.submission_date === viewDate);
              const notSub = members.filter(m => !daySubmissions.some(s => s.user_id === m.user_id));

              const STATUS_ORDER: Record<string, number> = {
                'Participating': 0, 'Light Duty': 1, 'MC': 2, 'On Leave': 3,
              };
              const getName = (s: typeof daySubmissions[0]) =>
                s.profile ? `${s.profile.rank && s.profile.rank !== 'Other' ? s.profile.rank+' ' : ''}${s.profile.full_name}` : 'Member';

              // In Camp: one submission per member (PT or in_camp SFT)
              // Personal SFT: all personal sft rows across all members, sorted by created_at
              const inCampSubs = daySubmissions.filter(s =>
                s.session_type === 'PT' || (s.session_type === 'SFT' && (!s.sft_kind || s.sft_kind === 'in_camp'))
              );
              const personalSftSubs = [...allSubmissions.filter(s =>
                s.submission_date === viewDate && s.session_type === 'SFT' && s.sft_kind === 'personal'
              )].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

              const sortedInCamp = [...inCampSubs].sort((a, b) => {
                const od = (STATUS_ORDER[a.attendance_status] ?? 99) - (STATUS_ORDER[b.attendance_status] ?? 99);
                if (od !== 0) return od;
                return getName(a).localeCompare(getName(b));
              });
              const sortedNotSub = [...notSub].sort((a, b) => {
                const na = `${a.profile?.rank && a.profile.rank !== 'Other' ? a.profile.rank+' ' : ''}${a.profile?.full_name ?? ''}`;
                const nb = `${b.profile?.rank && b.profile.rank !== 'Other' ? b.profile.rank+' ' : ''}${b.profile?.full_name ?? ''}`;
                return na.localeCompare(nb);
              });

              // 27-day expiry helper (GMT+8 aware via localDateStr)
              const daysLeftForSub = (sub: any) => {
                const [sy, sm, sd] = sub.submission_date.split('-').map(Number);
                const subMs = new Date(sy, sm - 1, sd).getTime();
                const [ty, tm, td] = localDateStr().split('-').map(Number);
                const todayMs = new Date(ty, tm - 1, td).getTime();
                return Math.max(0, 27 - Math.floor((todayMs - subMs) / (1000 * 60 * 60 * 24)));
              };

              return (
                <div className="space-y-3 pt-2 border-t mt-2">
                  {/* Header row */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                      <Users2 className="h-3.5 w-3.5" /> All Team Submissions
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Select value={viewDate} onValueChange={setSubmissionPopupDate}>
                        <SelectTrigger className="h-7 text-xs w-36"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {availableDates.map(d => (
                            <SelectItem key={d} value={d} className="text-xs">
                              {d === todayStr ? `Today (${fmtDate(d)})` : fmtDate(d, { weekday: true })}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {teamSftView === 'in_camp' && (
                        <Button variant="outline" size="sm" className="h-7 text-xs px-2" onClick={() => setSubmissionPopupOpen(true)}>
                          <FileText className="h-3 w-3 mr-1" /> Attendance
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* In Camp / Personal SFT toggle */}
                  <div className="flex rounded-lg border overflow-hidden">
                    {(['in_camp', 'personal'] as const).map(k => (
                      <button key={k} onClick={() => setTeamSftView(k)}
                        className={`flex-1 py-2 text-xs font-semibold transition-colors ${teamSftView === k ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:bg-muted'}`}>
                        {k === 'in_camp' ? `🏕️ In Camp (${inCampSubs.length})` : `🏃 Personal SFT (${personalSftSubs.length})`}
                      </button>
                    ))}
                  </div>

                  {/* ── IN CAMP view ── */}
                  {teamSftView === 'in_camp' && (
                    <>
                      <p className="text-xs text-muted-foreground">{inCampSubs.length} of {members.length} submitted</p>
                      <div className="rounded-xl border bg-card overflow-hidden divide-y">
                        <div className="px-3 py-2 bg-green-50/60 dark:bg-green-900/10">
                          <p className="text-xs font-semibold text-green-700 dark:text-green-400">
                            ✅ Submitted ({inCampSubs.length})
                          </p>
                        </div>
                        {sortedInCamp.length === 0 ? (
                          <div className="px-3 py-3 text-xs text-muted-foreground italic">No submissions for this date</div>
                        ) : (
                          sortedInCamp.map(s => {
                            const name = getName(s);
                            const isFever = s.temperature != null && s.temperature >= 37.5;
                            const dl = daysLeftForSub(s);
                            const screenshotExpired = dl <= 0;
                            return (
                              <div key={s.id} className="flex items-start justify-between gap-2 px-3 py-2.5">
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className={`text-xs font-medium ${isFever ? 'text-red-600 dark:text-red-400' : ''}`}>{name}</span>
                                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-muted">{s.session_type}</span>
                                    <span className="text-xs">{statusEmoji[s.attendance_status] ?? ''} {s.attendance_status}</span>
                                    {isFever && (
                                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 border border-red-300 dark:border-red-700">fever</span>
                                    )}
                                  </div>
                                  {s.session_type === 'SFT' && s.sft_type && (
                                    <p className="text-xs text-muted-foreground mt-0.5">{s.sft_type}{s.sft_custom ? ` - ${s.sft_custom}` : ''}</p>
                                  )}
                                  {s.notes && <p className="text-xs text-muted-foreground mt-0.5 italic">{s.notes}</p>}
                                  {/* Screenshot button — in-camp SFT only, canManage */}
                                  {s.session_type === 'SFT' && canManage && (s.sft_screenshot_url || screenshotExpired) && (
                                    <button
                                      onClick={() => {
                                        if (screenshotExpired || !s.sft_screenshot_url) {
                                          toast({ title: 'Image expired', description: 'This screenshot has been automatically deleted.' });
                                        } else {
                                          setLightboxUrl(s.sft_screenshot_url);
                                        }
                                      }}
                                      className="mt-1 flex items-center gap-1 text-[10px] text-primary hover:underline"
                                    >
                                      <Camera className="h-3 w-3" />
                                      {screenshotExpired ? 'Image expired' : `See screenshot · deletes in ${dl}d`}
                                    </button>
                                  )}
                                </div>
                                <span className={`text-xs shrink-0 font-medium ${isFever ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'}`}>
                                  {s.temperature != null ? `${s.temperature}°C` : '—'}
                                </span>
                              </div>
                            );
                          })
                        )}
                        <div className="px-3 py-2 bg-red-50/60 dark:bg-red-900/10">
                          <p className="text-xs font-semibold text-red-600 dark:text-red-400">
                            ❌ Not Submitted ({notSub.length})
                          </p>
                        </div>
                        {sortedNotSub.length === 0 ? (
                          <div className="px-3 py-3 text-xs text-muted-foreground italic">All members have submitted</div>
                        ) : (
                          sortedNotSub.map(m => {
                            const mp = m.profile;
                            const name = `${mp?.rank && mp.rank !== 'Other' ? mp.rank+' ' : ''}${mp?.full_name ?? 'Member'}`;
                            return (
                              <div key={m.user_id} className="px-3 py-2.5 flex items-center justify-between gap-2">
                                <span className="text-xs font-medium text-muted-foreground">{name}</span>
                                {canManage && (
                                  <button
                                    onClick={() => {
                                      setAdminSubUserId(m.user_id);
                                      setAdminSubType('PT');
                                      setAdminSubAttendance('Participating');
                                      setAdminSubNotes('');
                                      setAdminSubTemp('');
                                      setAdminSftType('Running');
                                      setAdminSftCustom('');
                                      setShowAdminSubModal(true);
                                    }}
                                    className="text-xs text-primary hover:underline shrink-0 flex items-center gap-1"
                                  >
                                    <Plus className="h-3 w-3" /> Record
                                  </button>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </>
                  )}

                  {/* ── PERSONAL SFT view ── */}
                  {teamSftView === 'personal' && (
                    <div className="rounded-xl border bg-card overflow-hidden divide-y">
                      {personalSftSubs.length === 0 ? (
                        <div className="px-3 py-6 text-center text-xs text-muted-foreground italic">
                          No personal SFT logs for this date
                        </div>
                      ) : (
                        personalSftSubs.map((s, idx) => {
                          const name = getName(s);
                          const isFever = s.temperature != null && s.temperature >= 37.5;
                          const dl = daysLeftForSub(s);
                          const screenshotExpired = dl <= 0;
                          return (
                            <div key={s.id} className="flex items-start justify-between gap-2 px-3 py-2.5">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-[10px] text-muted-foreground font-mono shrink-0">#{idx + 1}</span>
                                  <span className={`text-xs font-medium ${isFever ? 'text-red-600 dark:text-red-400' : ''}`}>{name}</span>
                                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 font-medium">🏃 Personal</span>
                                  {isFever && (
                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 border border-red-300 dark:border-red-700">fever</span>
                                  )}
                                </div>
                                {s.sft_type && (
                                  <p className="text-xs text-muted-foreground mt-0.5">{s.sft_type}{s.sft_custom ? ` - ${s.sft_custom}` : ''}</p>
                                )}
                                {s.notes && <p className="text-xs text-muted-foreground mt-0.5 italic">{s.notes}</p>}
                                {/* Screenshot button — personal SFT */}
                                {(s.sft_screenshot_url || screenshotExpired) && (
                                  <button
                                    onClick={() => {
                                      if (screenshotExpired || !s.sft_screenshot_url) {
                                        toast({ title: 'Image expired', description: 'This screenshot has been automatically deleted.' });
                                      } else {
                                        setLightboxUrl(s.sft_screenshot_url);
                                      }
                                    }}
                                    className="mt-1 flex items-center gap-1 text-[10px] text-primary hover:underline"
                                  >
                                    <Camera className="h-3 w-3" />
                                    {screenshotExpired ? 'Image expired' : `See screenshot · deletes in ${dl}d`}
                                  </button>
                                )}
                              </div>
                              <span className={`text-xs shrink-0 font-medium ${isFever ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'}`}>
                                {s.temperature != null ? `${s.temperature}°C` : '—'}
                              </span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        );
      })()}



      {/* ── Schedule ── */}
      {tab === 'schedule' && (() => {
        const dateKey = (y:number,m:number,d:number) => `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        const eventsOnDay = (d:number) => events.filter(e => e.event_date === dateKey(calYear,calMonth,d));
        const holidayOnDay = (d:number) => SG_HOLIDAYS[dateKey(calYear,calMonth,d)];
        const selectedDateKey = selectedDay ? dateKey(calYear,calMonth,selectedDay) : '';
        const selectedEvents = selectedDay ? eventsOnDay(selectedDay) : [];
        const selectedHoliday = selectedDay ? holidayOnDay(selectedDay) : null;

        return (
          <div className="space-y-4">
            {/* Add event button — admin/pt_ic only */}
            {canManage && (
              <div>
                {!showAddEvent ? (
                  <Button variant="outline" size="sm" onClick={() => { setShowAddEvent(true); setEvtDate(selectedDateKey || localDateStr(today)); }} className="w-full">
                    <Plus className="h-4 w-4 mr-2" /> Add Event
                  </Button>
                ) : (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">New Event</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Title</Label>
                        <Input placeholder="e.g. Morning PT" value={evtTitle} onChange={e => setEvtTitle(e.target.value)} />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs">Date</Label>
                          <Input type="date" value={evtDate} onChange={e => setEvtDate(e.target.value)} />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Type</Label>
                          <Select value={evtType} onValueChange={v => setEvtType(v as any)}>
                            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="PT">PT</SelectItem>
                              <SelectItem value="SFT">SFT</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Description <span className="text-muted-foreground">(optional)</span></Label>
                        <Textarea placeholder="Details..." value={evtDesc} onChange={e => setEvtDesc(e.target.value)} rows={2} />
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <Checkbox checked={evtImportant} onCheckedChange={v => setEvtImportant(!!v)} />
                        <span className="text-sm">Mark as Important <span className="text-xs text-muted-foreground">(pins to top of Submissions)</span></span>
                      </label>
                      <div className="flex gap-2">
                        <Button onClick={handleAddEvent} disabled={evtSaving} size="sm" className="flex-1">
                          {evtSaving ? 'Saving...' : 'Save Event'}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setShowAddEvent(false)}>Cancel</Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Calendar */}
            <Card>
              <CardContent className="pt-4 px-3 pb-3">
                <div className="flex items-center justify-between mb-3 px-1">
                  <button onClick={prevMonth} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">‹</button>
                  <span className="text-sm font-semibold">{MONTHS[calMonth]} {calYear}</span>
                  <button onClick={nextMonth} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">›</button>
                </div>
                <div className="grid grid-cols-7 mb-1">
                  {DAYS.map(d => <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">{d}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-y-1">
                  {Array.from({ length: firstDayOfWeek }).map((_, i) => <div key={`empty-${i}`} />)}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const d = i + 1;
                    const isSelected = selectedDay === d;
                    const todayMark  = isToday(d);
                    const dayEvts    = eventsOnDay(d);
                    const isHoliday  = !!holidayOnDay(d);
                    const hasPT      = dayEvts.some(e => e.event_type === 'PT');
                    const hasSFT     = dayEvts.some(e => e.event_type === 'SFT');
                    const hasOther   = dayEvts.some(e => e.event_type === 'Other');
                    // Segments: holiday=red, PT=blue, SFT=green, Other=amber
                    const segments: string[] = [];
                    if (isHoliday) segments.push('#f87171');
                    if (hasPT)     segments.push('#3b82f6');
                    if (hasSFT)    segments.push('#22c55e');
                    if (hasOther)  segments.push('#f59e0b');
                    const showRing = segments.length > 0 && !isSelected;
                    const r = 17, circ = 2 * Math.PI * r;
                    const gap = 2;
                    const n = segments.length;
                    const segLen = (circ - n * gap) / n;
                    return (
                      <button key={d} onClick={() => setSelectedDay(isSelected ? null : d)}
                        className={`relative mx-auto flex items-center justify-center h-9 w-9 text-sm transition-colors rounded-full
                          ${isSelected ? 'bg-primary text-primary-foreground font-semibold' : ''}
                          ${todayMark && !isSelected ? 'text-primary font-semibold' : ''}
                          ${isHoliday && !isSelected && !todayMark ? 'text-red-500' : ''}
                          ${!isSelected && !todayMark && !isHoliday ? 'hover:bg-muted text-foreground' : ''}`}>
                        {todayMark && !isSelected && (
                          <span className="absolute inset-0 rounded-full border-2 border-primary pointer-events-none" />
                        )}
                        {showRing && (
                          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)' }}>
                            {segments.map((color, si) => {
                              const offset = si * (segLen + gap);
                              return (
                                <circle key={si}
                                  cx="18" cy="18" r={r}
                                  fill="none"
                                  stroke={color}
                                  strokeWidth="2.5"
                                  strokeDasharray={`${segLen} ${circ - segLen}`}
                                  strokeDashoffset={-offset}
                                  strokeLinecap="round"
                                />
                              );
                            })}
                          </svg>
                        )}
                        {d}
                      </button>
                    );
                  })}
                </div>
                {/* Legend */}
                <div className="flex items-center gap-2 mt-3 pt-2 border-t justify-center flex-wrap">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground"><span className="h-2 w-2 rounded-full bg-red-400 inline-block" /> Holiday</div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground"><span className="h-2 w-2 rounded-full bg-blue-500 inline-block" /> PT</div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground"><span className="h-2 w-2 rounded-full bg-green-500 inline-block" /> SFT</div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground"><span className="h-2 w-2 rounded-full bg-amber-500 inline-block" /> Other</div>
                </div>
              </CardContent>
            </Card>

            {/* Selected day detail */}
            {selectedDay && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{selectedDay} {MONTHS[calMonth]} {calYear}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Public holiday */}
                  {selectedHoliday && (
                    <div className="flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 px-3 py-2">
                      <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                      <span className="text-sm font-medium text-red-700 dark:text-red-300">{selectedHoliday}</span>
                      <Badge variant="outline" className="ml-auto text-xs border-red-300 text-red-600">Public Holiday</Badge>
                    </div>
                  )}

                  {/* Team events */}
                  {selectedEvents.length === 0 && !selectedHoliday && (
                    <div className="text-center py-6 text-muted-foreground">
                      <Calendar className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No events scheduled</p>
                    </div>
                  )}
                  {selectedEvents.map(e => (
                    <div key={e.id} className="rounded-lg border bg-card p-3 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            {e.is_important && <Pin className="h-3.5 w-3.5 text-yellow-500 shrink-0" />}
                            <span className="text-sm font-semibold">{e.title}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${e.event_type==='PT'?'bg-blue-100 text-blue-700':e.event_type==='SFT'?'bg-green-100 text-green-700':'bg-muted text-muted-foreground'}`}>
                              {e.event_type}
                            </span>
                          </div>
                          {e.description && <p className="text-xs text-muted-foreground mt-0.5">{e.description}</p>}
                        </div>
                        {canManage && (
                          <div className="flex items-center gap-1 shrink-0">
                            <button onClick={() => handleToggleImportant(e)}
                              className={`p-1 rounded hover:bg-muted transition-colors ${e.is_important ? 'text-yellow-500' : 'text-muted-foreground'}`}
                              title={e.is_important ? 'Unpin' : 'Pin as Important'}>
                              <Star className="h-3.5 w-3.5" />
                            </button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <button className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-destructive">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete event?</AlertDialogTitle>
                                  <AlertDialogDescription>This will permanently remove "{e.title}".</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteEvent(e.id)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        );
      })()}

      {/* ── Leaderboard ── */}
      {tab === 'leaderboard' && (() => {
        const METRICS: { id: LeaderboardMetric; label: string; unit: string; higherBetter: boolean }[] = [
          { id: 'ippt_total', label: 'IPPT Score',     unit: 'pts',  higherBetter: true  },
          { id: 'pushups',    label: 'Push-ups',       unit: 'reps', higherBetter: true  },
          { id: 'situps',     label: 'Sit-ups',        unit: 'reps', higherBetter: true  },
          { id: 'run',        label: '2.4km Run',      unit: '',     higherBetter: false },
          { id: 'activities', label: 'Activities',     unit: 'logs', higherBetter: true  },
        ];

        const getValue = (m: typeof members[0]): number | null => {
          const p = m.profile;
          if (!p) return null;
          if (lbMetric === 'ippt_total') {
            if (!p.ippt_pushups || !p.ippt_situps || !p.ippt_run_seconds || !p.age) return null;
            return calcIpptAward(p.ippt_pushups, p.ippt_situps, p.ippt_run_seconds, p.age).total;
          }
          if (lbMetric === 'pushups')    return p.ippt_pushups ?? null;
          if (lbMetric === 'situps')     return p.ippt_situps ?? null;
          if (lbMetric === 'run')        return p.ippt_run_seconds ?? null;
          if (lbMetric === 'activities') return activityCounts[m.user_id] ?? 0;
          return null;
        };

        const metric = METRICS.find(m => m.id === lbMetric)!;

        const ranked = members
          .map(m => ({ member: m, value: getValue(m) }))
          .filter(r => r.value !== null)
          .sort((a, b) => metric.higherBetter ? (b.value! - a.value!) : (a.value! - b.value!));

        const noData = members
          .map(m => ({ member: m, value: getValue(m) }))
          .filter(r => r.value === null);

        const maxVal = ranked.length > 0 ? ranked[0].value! : 1;

        const AWARD_COLORS = ['text-yellow-500', 'text-slate-400', 'text-orange-400'];
        const AWARD_BG     = ['bg-yellow-50 border-yellow-300 dark:bg-yellow-900/20', 'bg-slate-50 border-slate-200 dark:bg-slate-800/30', 'bg-orange-50 border-orange-200 dark:bg-orange-900/20'];
        const MEDAL_ICONS  = ['🥇', '🥈', '🥉'];

        return (
          <div className="space-y-4">
            {/* Metric selector */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {METRICS.map(m => (
                <button key={m.id} onClick={() => setLbMetric(m.id)}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors
                    ${lbMetric === m.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-muted-foreground border-border hover:bg-muted'}`}>
                  {m.label}
                </button>
              ))}
            </div>

            {ranked.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Trophy className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium">No data yet</p>
                <p className="text-xs mt-1 opacity-70">Members need to save their {metric.label} first</p>
              </div>
            ) : (
              <div className="space-y-2">
                {ranked.map((r, i) => {
                  const p = r.member.profile!;
                  const isMe = r.member.user_id === user?.id;
                  const barPct = maxVal > 0 ? (r.value! / maxVal) * 100 : 0;
                  const displayVal = lbMetric === 'run'
                    ? fmtTime(r.value)
                    : `${r.value}${metric.unit ? ' ' + metric.unit : ''}`;
                  const ippt = (lbMetric === 'ippt_total' && p.ippt_pushups && p.ippt_situps && p.ippt_run_seconds && p.age)
                    ? calcIpptAward(p.ippt_pushups, p.ippt_situps, p.ippt_run_seconds, p.age)
                    : null;

                  return (
                    <div key={r.member.user_id}
                      className={`rounded-xl border p-3 transition-all ${i < 3 ? AWARD_BG[i] : 'bg-card'} ${isMe ? 'ring-2 ring-primary' : ''}`}>
                      <div className="flex items-center gap-3">
                        {/* Rank */}
                        <div className={`text-lg font-black w-8 text-center shrink-0 ${i < 3 ? AWARD_COLORS[i] : 'text-muted-foreground'}`}>
                          {i < 3 ? MEDAL_ICONS[i] : `#${i + 1}`}
                        </div>
                        {/* Avatar */}
                        <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold shrink-0">
                          {p.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        {/* Name + value */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold">
                              {p.rank && p.rank !== 'Other' ? `${p.rank} ` : ''}{p.full_name}
                            </span>
                            {isMe && <Badge variant="outline" className="text-xs">You</Badge>}
                            {ippt && (
                              <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${AWARD_STYLE[ippt.award]}`}>
                                {ippt.award}
                              </span>
                            )}
                          </div>
                          {/* Bar */}
                          <div className="mt-1.5 h-1.5 rounded-full bg-border overflow-hidden">
                            <div className="h-full rounded-full bg-primary transition-all"
                              style={{ width: `${lbMetric === 'run' ? (100 - barPct + 10) : barPct}%` }} />
                          </div>
                        </div>
                        {/* Value */}
                        <span className={`text-base font-bold tabular-nums shrink-0 ${i < 3 ? AWARD_COLORS[i] : 'text-foreground'}`}>
                          {displayVal}
                        </span>
                      </div>
                      {/* Sub-stats for IPPT */}
                      {lbMetric === 'ippt_total' && p.ippt_pushups && p.ippt_situps && p.ippt_run_seconds && (
                        <p className="text-xs text-muted-foreground mt-1.5 pl-20">
                          PU: {p.ippt_pushups} · SU: {p.ippt_situps} · Run: {fmtTime(p.ippt_run_seconds)}
                        </p>
                      )}
                    </div>
                  );
                })}

                {/* Members with no data */}
                {noData.length > 0 && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground px-1 mb-2">No {metric.label} data</p>
                    <div className="flex flex-wrap gap-2">
                      {noData.map(r => {
                        const p = r.member.profile;
                        return (
                          <span key={r.member.user_id} className="text-xs bg-muted rounded-full px-3 py-1 text-muted-foreground">
                            {p?.full_name ?? 'Member'}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })()}

      {/* ── Admin Submit For Member Modal ── */}
      {showAdminSubModal && canManage && (() => {
        const targetMember = members.find(m => m.user_id === adminSubUserId);
        const targetProfile = targetMember?.profile;
        const targetName = targetProfile
          ? `${targetProfile.rank && targetProfile.rank !== 'Other' ? targetProfile.rank+' ' : ''}${targetProfile.full_name}`
          : 'Member';
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            onClick={() => setShowAdminSubModal(false)}>
            <div className="w-full max-w-md bg-background rounded-2xl shadow-2xl flex flex-col overflow-hidden"
              style={{ maxHeight: 'min(90dvh, 680px)' }}
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b shrink-0">
                <div>
                  <h2 className="text-base font-semibold">Record Attendance</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">{targetName} · {fmtDate(submissionPopupDate)}</p>
                </div>
                <button onClick={() => setShowAdminSubModal(false)} className="p-1 rounded hover:bg-muted">
                  <XIcon className="h-4 w-4" />
                </button>
              </div>
              <div className="p-5 space-y-4 overflow-y-auto flex-1">
                <div className="space-y-2">
                  <Label>Session Type</Label>
                  <div className="flex rounded-lg border overflow-hidden">
                    {(['PT','SFT'] as const).map(t2 => (
                      <button key={t2} onClick={() => setAdminSubType(t2)}
                        className={`flex-1 py-2 text-sm font-semibold transition-colors ${adminSubType === t2 ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:bg-muted'}`}>
                        {t2}
                      </button>
                    ))}
                  </div>
                </div>
                {adminSubType === 'SFT' && (
                  <div className="space-y-2">
                    <Label>SFT Mode</Label>
                    <div className="flex rounded-lg border overflow-hidden">
                      {(['in_camp', 'personal'] as const).map(k => (
                        <button key={k} onClick={() => setAdminSftKind(k)}
                          className={`flex-1 py-2 text-sm font-semibold transition-colors ${adminSftKind === k ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:bg-muted'}`}>
                          {k === 'in_camp' ? '🏕️ In Camp' : '🏃 Personal'}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {adminSubType === 'SFT' && (
                  <div className="space-y-2">
                    <Label>Type of SFT</Label>
                    <Select value={adminSftType} onValueChange={setAdminSftType}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{SFT_TYPES.map(t2 => <SelectItem key={t2} value={t2}>{t2}</SelectItem>)}</SelectContent>
                    </Select>
                    {adminSftType === 'Others' && (
                      <Input placeholder="Describe the activity..." value={adminSftCustom} onChange={e => setAdminSftCustom(e.target.value)} />
                    )}
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Attendance Status</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {ATTENDANCE_STATUSES.map(st => (
                      <button key={st} onClick={() => setAdminSubAttendance(st)}
                        className={`py-2 px-3 rounded-lg border text-sm font-medium transition-colors text-left ${adminSubAttendance === st ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-foreground border-border hover:bg-muted'}`}>
                        {st === 'Participating' && '✅ '}{st === 'Light Duty' && '⚠️ '}{st === 'MC' && '🏥 '}{st === 'On Leave' && '🏖️ '}
                        {st}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    <Thermometer className="h-4 w-4" /> Temperature (°C) <span className="text-muted-foreground text-xs">(optional)</span>
                  </Label>
                  <Input type="number" step="0.1" min="35" max="42" placeholder="e.g. 36.5" value={adminSubTemp} onChange={e => setAdminSubTemp(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Notes <span className="text-muted-foreground text-xs">(optional)</span></Label>
                  <Textarea placeholder="Any remarks..." value={adminSubNotes} onChange={e => setAdminSubNotes(e.target.value)} rows={2} />
                </div>
                <Button onClick={handleAdminSubmit} disabled={adminSubmitting} className="w-full">
                  <Clock className="h-4 w-4 mr-2" />
                  {adminSubmitting ? 'Recording...' : 'Record Attendance'}
                </Button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Attendance Popup ── */}
      {submissionPopupOpen && (() => {
        const STATUS_ORDER: Record<string, number> = { 'Participating': 0, 'Light Duty': 1, 'MC': 2, 'On Leave': 3 };
        const daySubs = allSubmissions.filter(s => s.submission_date === submissionPopupDate);
        const notSubmitted = members.filter(m => !daySubs.some(s => s.user_id === m.user_id));
        const sortedDaySubs = [...daySubs].sort((a, b) => {
          const od = (STATUS_ORDER[a.attendance_status] ?? 99) - (STATUS_ORDER[b.attendance_status] ?? 99);
          if (od !== 0) return od;
          const na = a.profile ? `${a.profile.rank && a.profile.rank !== 'Other' ? a.profile.rank+' ':'' }${a.profile.full_name}` : '';
          const nb = b.profile ? `${b.profile.rank && b.profile.rank !== 'Other' ? b.profile.rank+' ':'' }${b.profile.full_name}` : '';
          return na.localeCompare(nb);
        });
        const sortedNotSub = [...notSubmitted].sort((a, b) => {
          const na = `${a.profile?.rank && a.profile.rank !== 'Other' ? a.profile.rank+' ':'' }${a.profile?.full_name ?? ''}`;
          const nb = `${b.profile?.rank && b.profile.rank !== 'Other' ? b.profile.rank+' ':'' }${b.profile?.full_name ?? ''}`;
          return na.localeCompare(nb);
        });
        const stateText = formatParadeState(sortedDaySubs, sortedNotSub, submissionPopupDate, team?.name ?? 'Team');

        return (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4" onClick={() => setSubmissionPopupOpen(false)}>
            <div
              className="w-full max-w-lg bg-background rounded-2xl shadow-2xl flex flex-col overflow-hidden"
              style={{ maxHeight: 'min(85dvh, 600px)' }}
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-start justify-between px-5 pt-5 pb-4 border-b shrink-0 bg-background">
                <div>
                  <h2 className="text-base font-bold">Attendance</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">{fmtDate(submissionPopupDate, { weekday: true })}</p>
                </div>
                <button onClick={() => setSubmissionPopupOpen(false)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground ml-3 shrink-0 -mt-0.5">
                  <XIcon className="h-4 w-4" />
                </button>
              </div>

              {/* Structured parade state body */}
              <div className="overflow-y-auto flex-1 p-5 space-y-4">
                {/* Submitted section */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-green-600">Submitted ({sortedDaySubs.length})</span>
                    <div className="flex-1 h-px bg-green-200 dark:bg-green-900" />
                  </div>
                  {sortedDaySubs.length === 0 ? (
                    <p className="text-xs text-muted-foreground px-1">None</p>
                  ) : (
                    <div className="space-y-1.5">
                      {sortedDaySubs.map(s => {
                        const name = s.profile ? `${s.profile.rank && s.profile.rank !== 'Other' ? s.profile.rank+' ':'' }${s.profile.full_name}` : 'Member';
                        const isFever = s.temperature != null && s.temperature >= 37.5;
                        const statusColor: Record<string,string> = {
                          'Participating': 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
                          'Light Duty':    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400',
                          'MC':            'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
                          'On Leave':      'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
                        };
                        return (
                          <div key={s.id} className={`flex items-center gap-2 rounded-lg px-3 py-2 ${isFever ? 'bg-red-50 dark:bg-red-950/30' : 'bg-muted/50'}`}>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <p className={`text-xs font-semibold truncate ${isFever ? 'text-red-600 dark:text-red-400' : ''}`}>{name}</p>
                                {isFever && (
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 border border-red-300 dark:border-red-700 shrink-0">fever</span>
                                )}
                              </div>
                              <p className="text-[10px] text-muted-foreground">{s.session_type}{s.notes ? ` · ${s.notes}` : ''}</p>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {s.temperature != null && (
                                <span className={`text-[10px] font-medium ${isFever ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'}`}>{s.temperature}°C</span>
                              )}
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColor[s.attendance_status] ?? 'bg-muted text-muted-foreground'}`}>
                                {s.attendance_status}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Not submitted section */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-red-500">Not Submitted ({sortedNotSub.length})</span>
                    <div className="flex-1 h-px bg-red-200 dark:bg-red-900" />
                  </div>
                  {sortedNotSub.length === 0 ? (
                    <p className="text-xs text-muted-foreground px-1">All submitted! 🎉</p>
                  ) : (
                    <div className="space-y-1.5">
                      {sortedNotSub.map(m => {
                        const mp = m.profile;
                        const name = `${mp?.rank && mp.rank !== 'Other' ? mp.rank+' ' : ''}${mp?.full_name ?? 'Member'}`;
                        return (
                          <div key={m.user_id} className="flex items-center gap-2 rounded-lg bg-muted/30 px-3 py-2">
                            <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground shrink-0">
                              {(mp?.full_name ?? 'M').charAt(0).toUpperCase()}
                            </div>
                            <p className="text-xs font-medium truncate">{name}</p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Raw text export area */}
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Export Text</p>
                  <Textarea
                    readOnly
                    value={stateText}
                    className="font-mono text-[10px] resize-none w-full bg-muted/30 border-muted"
                    rows={Math.min(8, stateText.split('\n').length + 1)}
                  />
                </div>
              </div>

              {/* Footer actions */}
              <div className="flex items-center gap-2 px-5 py-3 border-t shrink-0 bg-background">
                <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => {
                  navigator.clipboard.writeText(stateText);
                  toast({ title: 'Copied to clipboard!' });
                }}>
                  <Copy className="h-3 w-3 mr-1.5" /> Copy
                </Button>
                <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => downloadSubmissions('txt', submissionPopupDate)}>
                  <FileText className="h-3 w-3 mr-1.5" /> TXT
                </Button>
                <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => downloadSubmissions('csv', submissionPopupDate)}>
                  <Download className="h-3 w-3 mr-1.5" /> CSV
                </Button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Lightbox ── */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 p-4 cursor-zoom-out"
          onClick={() => setLightboxUrl(null)}
        >
          <img
            src={lightboxUrl}
            alt="Screenshot full view"
            className="max-w-full max-h-full rounded-xl object-contain shadow-2xl"
          />
          <button
            onClick={() => setLightboxUrl(null)}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/50 text-white hover:bg-black/70"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* ── Create Post Modal ── */}
      {showPostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setShowPostModal(false)}>
          <div className="w-full max-w-lg bg-background rounded-2xl shadow-2xl flex flex-col overflow-hidden" style={{ maxHeight: 'min(90dvh, 700px)' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b">
              <h2 className="text-base font-semibold">Create Post</h2>
              <button onClick={() => setShowPostModal(false)} className="p-1 rounded hover:bg-muted">
                <XIcon className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5 space-y-4 overflow-y-auto flex-1">

              {/* Post type selector */}
              <div className="space-y-2">
                <Label>Type</Label>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { type: 'poll',     icon: <BarChart2 className="h-4 w-4" />,     label: 'Poll',     color: 'border-violet-400 bg-violet-50 text-violet-700' },
                    { type: 'notice',   icon: <Bell className="h-4 w-4" />,          label: 'Notice',   color: 'border-orange-400 bg-orange-50 text-orange-700' },
                    { type: 'question', icon: <MessageSquare className="h-4 w-4" />, label: 'Question', color: 'border-teal-400 bg-teal-50 text-teal-700' },
                  ] as const).map(({ type, icon, label, color }) => (
                    <button key={type} onClick={() => setPostType(type)}
                      className={`flex flex-col items-center gap-1 py-3 rounded-xl border-2 text-xs font-semibold transition-colors
                        ${postType === type ? color : 'border-border bg-background text-muted-foreground hover:bg-muted'}`}>
                      {icon}{label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div className="space-y-1.5">
                <Label>{postType === 'poll' ? 'Question / Title' : postType === 'notice' ? 'Notice Title' : 'Question Prompt'}</Label>
                <Input placeholder={postType === 'poll' ? 'e.g. What time should we meet?' : postType === 'notice' ? 'e.g. PT cancelled tomorrow' : 'e.g. What is your IPPT goal?'} value={postTitle} onChange={e => setPostTitle(e.target.value)} />
              </div>

              {/* Body — notices and questions */}
              {(postType === 'notice' || postType === 'question') && (
                <div className="space-y-1.5">
                  <Label>{postType === 'notice' ? 'Body' : 'Additional context'} <span className="text-muted-foreground text-xs">(optional)</span></Label>
                  <Textarea rows={3} placeholder={postType === 'notice' ? 'Details...' : 'Any context for your question...'} value={postBody} onChange={e => setPostBody(e.target.value)} />
                </div>
              )}

              {/* Poll options */}
              {postType === 'poll' && (
                <div className="space-y-2">
                  <Label>Options</Label>
                  {pollOptions.map((opt, i) => (
                    <div key={i} className="flex gap-2">
                      <Input placeholder={`Option ${i + 1}`} value={opt} onChange={e => { const o = [...pollOptions]; o[i] = e.target.value; setPollOptions(o); }} />
                      {pollOptions.length > 2 && (
                        <button onClick={() => setPollOptions(pollOptions.filter((_, j) => j !== i))} className="p-2 rounded hover:bg-muted text-muted-foreground">
                          <XIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  {pollOptions.length < 8 && (
                    <Button variant="outline" size="sm" onClick={() => setPollOptions([...pollOptions, ''])}>
                      <Plus className="h-3.5 w-3.5 mr-1" /> Add option
                    </Button>
                  )}
                  <label className="flex items-center gap-2 cursor-pointer pt-1">
                    <Checkbox checked={postMulti} onCheckedChange={v => setPostMulti(!!v)} />
                    <span className="text-sm">Allow multiple selections</span>
                  </label>
                </div>
              )}

              {/* Pin options */}
              <div className="space-y-2 pt-1 border-t">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox checked={postPinned} onCheckedChange={v => setPostPinned(!!v)} />
                  <span className="text-sm">Pin to top of Activities</span>
                </label>
                {postPinned && postType === 'notice' && (
                  <div className="space-y-1.5 pl-6">
                    <Label className="text-xs">Pin until (date)</Label>
                    <Input type="date" value={postPinUntil} onChange={e => setPostPinUntil(e.target.value)} className="max-w-[180px]" />
                  </div>
                )}
              </div>

              <Button onClick={handleCreatePost} disabled={postSaving} className="w-full">
                {postSaving ? 'Posting...' : `Post ${postType === 'poll' ? 'Poll' : postType === 'notice' ? 'Notice' : 'Question'}`}
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
