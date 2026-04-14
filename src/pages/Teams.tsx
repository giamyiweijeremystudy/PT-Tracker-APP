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
} from 'lucide-react';

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
};

type Tab = 'activities' | 'members' | 'submissions' | 'schedule';
type TeamRole = 'admin' | 'pt_ic' | 'spartan' | 'member';

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
  const [subDate, setSubDate]               = useState(today.toISOString().split('T')[0]);
  const [subEventId, setSubEventId]         = useState<string>('none');
  const [subAttendance, setSubAttendance]   = useState<string>('Participating');
  const [sftType, setSftType]               = useState<string>('Running');
  const [sftCustom, setSftCustom]           = useState('');


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

  // ── Events + Submissions ─────────────────────────────────────────────────────

  const fetchEvents = useCallback(async () => {
    if (!team) return;
    const { data } = await supabase.from('team_events').select('*')
      .eq('team_id', team.id).order('event_date', { ascending: true });
    if (data) setEvents(data as TeamEvent[]);
  }, [team]);

  const fetchSubmissions = useCallback(async () => {
    if (!team || !user) return;
    const { data } = await supabase.from('team_submissions').select('*')
      .eq('team_id', team.id).eq('user_id', user.id)
      .order('submission_date', { ascending: false }).limit(20);
    if (data) setSubmissions(data as TeamSubmission[]);
  }, [team, user]);

  useEffect(() => { if (team) { fetchEvents(); fetchSubmissions(); } }, [team, fetchEvents, fetchSubmissions]);

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

  const handleSubmission = async () => {
    if (!team || !user) return;
    setSubmitting(true);
    const { error } = await supabase.from('team_submissions').insert({
      team_id: team.id, user_id: user.id,
      event_id: subEventId === 'none' ? null : subEventId,
      submission_date: subDate,
      session_type: subType,
      attendance_status: subAttendance,
      sft_type: subType === 'SFT' ? sftType : null,
      sft_custom: subType === 'SFT' && sftType === 'Others' ? sftCustom : null,
      temperature: subTemp ? parseFloat(subTemp) : null,
      notes: subNotes,
    });
    setSubmitting(false);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Attendance submitted!' });
    setSubTemp(''); setSubNotes(''); setSftCustom('');
    fetchSubmissions();
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

  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'activities',  label: 'Activities',  icon: <Activity className="h-3.5 w-3.5 mr-1" /> },
    { id: 'members',     label: 'Members',     icon: <Users className="h-3.5 w-3.5 mr-1" /> },
    { id: 'submissions', label: 'Submissions', icon: <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> },
    { id: 'schedule',    label: 'Schedule',    icon: <Calendar className="h-3.5 w-3.5 mr-1" /> },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-10">

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
            className={`flex-1 py-2.5 text-xs font-medium transition-colors flex items-center justify-center ${tab === t.id ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:bg-muted'}`}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* ── Activities ── */}
      {tab === 'activities' && (() => {
        const todayStr = today.toISOString().split('T')[0];
        const pinnedEvents = events.filter(e => e.is_important && e.event_date >= todayStr)
          .sort((a, b) => a.event_date.localeCompare(b.event_date));
        return (
        <div className="space-y-4">
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
                  {new Date(e.event_date).toLocaleDateString('en-SG',{weekday:'short',day:'numeric',month:'short',year:'numeric'})}
                </p>
                {e.description && <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-0.5">{e.description}</p>}
              </div>
            </div>
          ))}

          {feed.length === 0 ? (
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
                        <span>{new Date(a.date).toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
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
        const todayEvents = events.filter(e => e.event_date === subDate);
        return (
          <div className="space-y-4">
            {/* Important pinned events */}
            {events.filter(e => e.is_important && e.event_date >= today.toISOString().split('T')[0]).slice(0,3).map(e => (
              <div key={e.id} className="flex items-start gap-2 rounded-xl border border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20 px-4 py-3">
                <Pin className="h-4 w-4 text-yellow-600 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-300">{e.title}</p>
                  <p className="text-xs text-yellow-700 dark:text-yellow-400">{new Date(e.event_date).toLocaleDateString('en-SG',{day:'numeric',month:'short',year:'numeric'})} · {e.event_type}</p>
                  {e.description && <p className="text-xs text-yellow-600 mt-0.5">{e.description}</p>}
                </div>
              </div>
            ))}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" /> Submit Attendance
                </CardTitle>
                <CardDescription>Record your parade state for PT or SFT</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">

                {/* Date */}
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input type="date" value={subDate} onChange={e => setSubDate(e.target.value)} />
                </div>

                {/* Link to event */}
                <div className="space-y-2">
                  <Label>Event <span className="text-muted-foreground text-xs">(optional)</span></Label>
                  <Select value={subEventId} onValueChange={setSubEventId}>
                    <SelectTrigger><SelectValue placeholder="Select event..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No specific event</SelectItem>
                      {events.map(e => (
                        <SelectItem key={e.id} value={e.id}>
                          {new Date(e.event_date).toLocaleDateString('en-SG',{day:'numeric',month:'short'})} — {e.title}
                        </SelectItem>
                      ))}
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

                {/* SFT type — only if SFT */}
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

                {/* Attendance status */}
                <div className="space-y-2">
                  <Label>Attendance Status</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {ATTENDANCE_STATUSES.map(s => (
                      <button key={s} onClick={() => setSubAttendance(s)}
                        className={`py-2 px-3 rounded-lg border text-sm font-medium transition-colors text-left ${subAttendance === s ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-foreground border-border hover:bg-muted'}`}>
                        {s === 'Participating' && '✅ '}
                        {s === 'Light Duty' && '⚠️ '}
                        {s === 'MC' && '🏥 '}
                        {s === 'On Leave' && '🏖️ '}
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

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

                <Button onClick={handleSubmission} disabled={submitting} className="w-full">
                  <Clock className="h-4 w-4 mr-2" />
                  {submitting ? 'Submitting...' : `Submit ${subType} Attendance`}
                </Button>
              </CardContent>
            </Card>

            {/* Submission history */}
            {submissions.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-1">My Recent Submissions</p>
                {submissions.map(s => {
                  const statusEmoji: Record<string,string> = { Participating:'✅', 'Light Duty':'⚠️', MC:'🏥', 'On Leave':'🏖️' };
                  return (
                    <div key={s.id} className="rounded-lg border bg-card p-3 flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-semibold">{new Date(s.submission_date).toLocaleDateString('en-SG',{day:'numeric',month:'short',year:'numeric'})}</span>
                          <span className="text-xs px-1.5 py-0.5 rounded-full bg-muted">{s.session_type}</span>
                          <span className="text-xs">{statusEmoji[s.attendance_status] ?? ''} {s.attendance_status}</span>
                        </div>
                        {s.session_type === 'SFT' && s.sft_type && (
                          <p className="text-xs text-muted-foreground mt-0.5">{s.sft_type}{s.sft_custom ? ` — ${s.sft_custom}` : ''}</p>
                        )}
                        {s.notes && <p className="text-xs text-muted-foreground mt-0.5">{s.notes}</p>}
                      </div>
                      {s.temperature && <span className="text-xs text-muted-foreground shrink-0">{s.temperature}°C</span>}
                    </div>
                  );
                })}
              </div>
            )}
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
                  <Button variant="outline" size="sm" onClick={() => { setShowAddEvent(true); setEvtDate(selectedDateKey || today.toISOString().split('T')[0]); }} className="w-full">
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
                    const todayMark = isToday(d);
                    const hasEvents = eventsOnDay(d).length > 0;
                    const isHoliday = !!holidayOnDay(d);
                    return (
                      <button key={d} onClick={() => setSelectedDay(isSelected ? null : d)}
                        className={`relative mx-auto flex flex-col h-9 w-9 items-center justify-center rounded-full text-sm transition-colors
                          ${isSelected ? 'bg-primary text-primary-foreground font-semibold' : ''}
                          ${todayMark && !isSelected ? 'border border-primary text-primary font-semibold' : ''}
                          ${isHoliday && !isSelected && !todayMark ? 'text-red-500' : ''}
                          ${!isSelected && !todayMark && !isHoliday ? 'hover:bg-muted text-foreground' : ''}`}>
                        {d}
                        {(hasEvents || isHoliday) && !isSelected && (
                          <span className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 flex gap-0.5`}>
                            {isHoliday && <span className="h-1 w-1 rounded-full bg-red-400" />}
                            {hasEvents && <span className="h-1 w-1 rounded-full bg-primary" />}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                {/* Legend */}
                <div className="flex items-center gap-4 mt-3 pt-2 border-t justify-center">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><span className="h-2 w-2 rounded-full bg-red-400 inline-block" /> Public Holiday</div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><span className="h-2 w-2 rounded-full bg-primary inline-block" /> Team Event</div>
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

    </div>
  );
}
