import { useState } from 'react';
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
import {
  Users, Plus, Copy, Trash2, Crown, MapPin, Activity,
  Lock, Settings, Thermometer, Calendar, CheckCircle2, Clock, Shield, Swords,
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

  const isAdmin       = (profile as any)?.is_admin === true;
  const canManage     = myTeamRole === 'admin' || myTeamRole === 'pt_ic';
  const canAssignPTIC = myTeamRole === 'admin';

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
  const [subType, setSubType]       = useState<'SFT' | 'PT'>('PT');
  const [subTemp, setSubTemp]       = useState('');
  const [subNotes, setSubNotes]     = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Role assignment state
  const [roleUpdating, setRoleUpdating] = useState<string | null>(null);

  // Calendar
  const today = new Date();
  const [calYear, setCalYear]   = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(today.getDate());

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

  const handleRoleChange = async (userId: string, newRole: TeamRole) => {
    setRoleUpdating(userId);
    await updateMemberRole(userId, newRole);
    setRoleUpdating(null);
    toast({ title: `Role updated to ${ROLE_LABEL[newRole]}` });
  };

  const handleSubmission = async () => {
    const tempVal = parseFloat(subTemp);
    if (!subTemp || isNaN(tempVal)) { toast({ title: 'Enter a valid temperature', variant: 'destructive' }); return; }
    if (tempVal < 35 || tempVal > 42) { toast({ title: 'Temperature must be between 35°C and 42°C', variant: 'destructive' }); return; }
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 600));
    setSubmitting(false);
    setSubTemp(''); setSubNotes('');
    toast({ title: `${subType} submission recorded!`, description: `Temp: ${tempVal}°C` });
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

        {/* My role badge */}
        {myTeamRole && myTeamRole !== 'member' && (
          <div className="mt-2">
            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${ROLE_BADGE[myTeamRole]}`}>
              <RoleIcon role={myTeamRole} />
              {ROLE_LABEL[myTeamRole]}
            </span>
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
      {tab === 'activities' && (
        feed.length === 0 ? (
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
                  {a.image_url && <img src={a.image_url} alt="activity" className="w-full max-h-72 object-cover" />}
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
        )
      )}

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
            const memberTeamRole = (m.team_role ?? 'member') as TeamRole;
            const ippt = p?.ippt_pushups && p?.ippt_situps && p?.ippt_run_seconds && p?.age
              ? calcIpptAward(p.ippt_pushups, p.ippt_situps, p.ippt_run_seconds, p.age) : null;

            // What roles can the current user assign to this member?
            const assignableRoles: TeamRole[] = (() => {
              if (isMe) return [];
              if (canAssignPTIC) return ['admin', 'pt_ic', 'spartan', 'member']; // admin can assign all
              if (myTeamRole === 'pt_ic') return ['spartan', 'member'];           // PT IC can only assign spartan/member
              return [];
            })();

            const canKick = canManage && !isMe && memberTeamRole !== 'admin';

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
                      <RoleIcon role={memberTeamRole} />
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${ROLE_BADGE[memberTeamRole]}`}>
                        {ROLE_LABEL[memberTeamRole]}
                      </span>
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

                {/* Role assignment — only shown if current user can assign roles to this member */}
                {assignableRoles.length > 0 && (
                  <div className="flex items-center gap-2 pt-1 border-t">
                    <span className="text-xs text-muted-foreground shrink-0">Assign role:</span>
                    <Select
                      value={memberTeamRole}
                      onValueChange={val => handleRoleChange(m.user_id, val as TeamRole)}
                      disabled={roleUpdating === m.user_id}
                    >
                      <SelectTrigger className="h-7 text-xs flex-1 max-w-[160px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {assignableRoles.map(r => (
                          <SelectItem key={r} value={r} className="text-xs">
                            {ROLE_LABEL[r]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
      {tab === 'submissions' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" /> Clock In
              </CardTitle>
              <CardDescription>Record your parade state and temperature</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Session Type</Label>
                <div className="flex rounded-lg border overflow-hidden">
                  {(['PT', 'SFT'] as const).map(t => (
                    <button key={t} onClick={() => setSubType(t)}
                      className={`flex-1 py-2 text-sm font-semibold transition-colors ${subType === t ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:bg-muted'}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <Thermometer className="h-4 w-4" /> Temperature (°C)
                </Label>
                <Input type="number" step="0.1" min="35" max="42" placeholder="e.g. 36.5" value={subTemp} onChange={e => setSubTemp(e.target.value)} />
              </div>
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
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Submission history coming soon</p>
          </div>
        </div>
      )}

      {/* ── Schedule ── */}
      {tab === 'schedule' && (
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-4 px-3 pb-3">
              <div className="flex items-center justify-between mb-3 px-1">
                <button onClick={prevMonth} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">‹</button>
                <span className="text-sm font-semibold">{MONTHS[calMonth]} {calYear}</span>
                <button onClick={nextMonth} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">›</button>
              </div>
              <div className="grid grid-cols-7 mb-1">
                {DAYS.map(d => (
                  <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-y-1">
                {Array.from({ length: firstDayOfWeek }).map((_, i) => <div key={`empty-${i}`} />)}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const d = i + 1;
                  const isSelected = selectedDay === d;
                  const todayMark = isToday(d);
                  return (
                    <button key={d} onClick={() => setSelectedDay(isSelected ? null : d)}
                      className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full text-sm transition-colors
                        ${isSelected ? 'bg-primary text-primary-foreground font-semibold' : ''}
                        ${todayMark && !isSelected ? 'border border-primary text-primary font-semibold' : ''}
                        ${!isSelected && !todayMark ? 'hover:bg-muted text-foreground' : ''}`}>
                      {d}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
          {selectedDay && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{selectedDay} {MONTHS[calMonth]} {calYear}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-6 text-muted-foreground">
                  <Calendar className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No events scheduled</p>
                  <p className="text-xs mt-1 opacity-70">Team scheduling coming soon</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

    </div>
  );
}
