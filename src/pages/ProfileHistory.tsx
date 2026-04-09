import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { User, Trophy, Plus, Pencil, BarChart2, AlertCircle } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, BarChart, Bar,
} from 'recharts';

// ─── Types ───────────────────────────────────────────────────────────────────

type Activity = {
  id: string;
  date: string;
  type: string;
  distance_km: number | null;
  duration_minutes: number | null;
  pushups: number | null;
  situps: number | null;
  run_seconds: number | null;
  notes: string | null;
};

type ProfileData = {
  full_name: string;
  rank: string;
  department: string;
  age: number | null;
  height_cm: number | null;
  ippt_score: number | null;
  ippt_pushups: number | null;
  ippt_situps: number | null;
  ippt_run_seconds: number | null;
};

// ─── IPPT Scoring Tables ──────────────────────────────────────────────────────
// Source: Official SAF IPPT scoring tables
// Each row: [reps, ag1, ag2, ag3, ag4, ag5, ag6, ag7, ag8, ag9, ag10, ag11, ag12, ag13, ag14]
// Age groups: 1=<22, 2=22-24, 3=25-27, 4=28-30, 5=31-33, 6=34-36,
//             7=37-39, 8=40-42, 9=43-45, 10=46-48, 11=49-51, 12=52-54, 13=55-57, 14=58-60
// "" means max (25) already reached at fewer reps for that age group

const PUSHUP_RAW = [
  [60,25,"","","","","","","","","","","","",""],
  [59,24,25,"","","","","","","","","","","",""],
  [58,24,24,25,"","","","","","","","","","",""],
  [57,24,24,24,25,"","","","","","","","","",""],
  [56,24,24,24,24,25,"","","","","","","","",""],
  [55,23,24,24,24,24,25,"","","","","","","",""],
  [54,23,23,24,24,24,24,25,"","","","","","",""],
  [53,23,23,23,24,24,24,24,25,"","","","","",""],
  [52,23,23,23,23,24,24,24,24,"","","","","",""],
  [51,22,23,23,23,23,24,24,24,25,"","","","",""],
  [50,22,22,23,23,23,23,24,24,24,"","","","",""],
  [49,22,22,22,23,23,23,23,24,24,25,"","","",""],
  [48,22,22,22,22,23,23,23,23,24,24,"","","",""],
  [47,21,22,22,22,22,23,23,23,24,24,25,"","",""],
  [46,21,21,22,22,22,22,23,23,23,24,24,"","",""],
  [45,21,21,21,22,22,22,22,23,23,24,24,25,"",""],
  [44,21,21,21,21,22,22,22,22,23,23,24,24,"",""],
  [43,20,21,21,21,21,22,22,22,23,23,24,24,25,""],
  [42,20,20,21,21,21,21,22,22,22,23,23,24,25,""],
  [41,20,20,20,21,21,21,21,22,22,23,23,24,24,25],
  [40,20,20,20,20,21,21,21,21,22,22,23,23,24,25],
  [39,19,20,20,20,20,21,21,21,22,22,23,23,24,24],
  [38,19,19,20,20,20,20,21,21,21,22,22,23,23,24],
  [37,19,19,19,20,20,20,20,21,21,22,22,22,23,24],
  [36,18,19,19,19,20,20,20,20,21,21,22,22,23,23],
  [35,18,18,19,19,19,20,20,20,21,21,21,22,22,23],
  [34,18,18,18,19,19,19,20,20,20,21,21,21,22,23],
  [33,17,18,18,18,19,19,19,20,20,20,21,21,22,22],
  [32,17,17,18,18,18,19,19,19,20,20,20,21,21,22],
  [31,17,17,17,18,18,18,19,19,19,20,20,20,21,22],
  [30,16,17,17,17,18,18,18,19,19,19,20,20,21,21],
  [29,16,16,17,17,17,18,18,18,19,19,19,20,20,21],
  [28,16,16,16,17,17,17,18,18,18,19,19,19,20,20],
  [27,15,16,16,16,17,17,17,18,18,18,19,19,19,20],
  [26,15,15,16,16,16,17,17,17,18,18,18,19,19,19],
  [25,14,15,15,16,16,16,17,17,17,18,18,18,19,19],
  [24,13,14,15,15,16,16,16,17,17,17,18,18,18,19],
  [23,12,13,14,15,15,16,16,16,17,17,17,18,18,18],
  [22,11,12,13,14,15,15,16,16,16,17,17,17,18,18],
  [21,10,11,12,13,14,15,15,16,16,16,17,17,17,18],
  [20,9,10,11,12,13,14,15,15,16,16,16,17,17,17],
  [19,8,9,10,11,12,13,14,15,15,16,16,16,17,17],
  [18,6,8,9,10,11,12,13,14,15,15,16,16,16,17],
  [17,4,6,8,9,10,11,12,13,14,15,15,16,16,16],
  [16,2,4,6,8,9,10,11,12,13,14,15,15,16,16],
  [15,1,2,4,6,8,9,10,11,12,13,14,15,15,16],
  [14,0,1,2,4,6,8,9,10,11,12,13,14,15,15],
  [13,0,0,1,2,4,6,8,9,10,11,12,13,14,15],
  [12,0,0,0,1,2,4,6,8,9,10,11,12,13,14],
  [11,0,0,0,0,1,2,4,6,8,9,10,11,12,13],
  [10,0,0,0,0,0,1,2,4,6,8,9,10,11,12],
  [9,0,0,0,0,0,0,1,2,4,6,8,9,10,11],
  [8,0,0,0,0,0,0,0,1,2,4,6,8,9,10],
  [7,0,0,0,0,0,0,0,0,1,2,4,6,8,9],
  [6,0,0,0,0,0,0,0,0,0,1,2,4,6,8],
  [5,0,0,0,0,0,0,0,0,0,0,1,2,4,6],
  [4,0,0,0,0,0,0,0,0,0,0,0,1,2,4],
  [3,0,0,0,0,0,0,0,0,0,0,0,0,1,2],
  [2,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
];

const SITUP_RAW = [
  [60,25,"","","","","","","","","","","","",""],
  [59,24,25,"","","","","","","","","","","",""],
  [58,24,24,25,"","","","","","","","","","",""],
  [57,24,24,24,25,"","","","","","","","","",""],
  [56,24,24,24,24,25,"","","","","","","","",""],
  [55,23,24,24,24,24,25,"","","","","","","",""],
  [54,23,23,24,24,24,24,25,"","","","","","",""],
  [53,23,23,23,24,24,24,24,25,"","","","","",""],
  [52,23,23,23,23,24,24,24,24,"","","","","",""],
  [51,22,23,23,23,23,24,24,24,25,"","","","",""],
  [50,22,22,23,23,23,23,24,24,24,"","","","",""],
  [49,22,22,22,23,23,23,23,24,24,25,"","","",""],
  [48,22,22,22,22,23,23,23,23,24,24,"","","",""],
  [47,21,22,22,22,22,23,23,23,24,24,25,"","",""],
  [46,21,21,22,22,22,22,23,23,23,24,24,"","",""],
  [45,21,21,21,22,22,22,22,23,23,24,24,24,"",""],
  [44,21,21,21,21,22,22,22,22,23,23,24,24,25,""],
  [43,20,21,21,21,21,22,22,22,23,23,23,24,24,""],
  [42,20,20,21,21,21,21,22,22,22,23,23,24,24,25],
  [41,20,20,20,21,21,21,21,22,22,23,23,23,24,24],
  [40,20,20,20,20,21,21,21,21,22,22,23,23,24,24],
  [39,19,20,20,20,20,21,21,21,22,22,22,23,23,24],
  [38,19,19,20,20,20,20,21,21,21,22,22,23,23,23],
  [37,18,19,19,20,20,20,20,21,21,22,22,22,23,23],
  [36,18,18,19,19,20,20,20,20,21,21,22,22,22,23],
  [35,17,18,18,19,19,20,20,20,21,21,21,22,22,22],
  [34,16,17,18,18,19,19,20,20,20,21,21,21,22,22],
  [33,15,16,17,18,18,19,19,20,20,20,21,21,21,22],
  [32,14,15,16,17,18,18,19,19,20,20,20,21,21,21],
  [31,14,14,15,16,17,18,18,19,19,20,20,20,21,21],
  [30,13,14,14,15,16,17,18,18,19,19,20,20,20,21],
  [29,13,13,14,14,15,16,17,18,18,18,19,20,20,20],
  [28,12,13,13,14,14,15,16,17,18,18,19,19,20,20],
  [27,11,12,13,13,14,14,15,16,17,18,18,19,19,20],
  [26,10,11,12,13,13,14,14,15,16,17,18,18,19,19],
  [25,9,10,11,12,13,13,14,14,15,16,17,18,18,19],
  [24,8,9,10,11,12,13,13,14,14,15,16,17,18,18],
  [23,7,8,9,10,11,12,13,13,14,14,15,16,17,18],
  [22,7,7,8,9,10,11,12,13,13,14,14,15,16,17],
  [21,6,7,7,8,9,10,11,12,13,13,14,14,15,16],
  [20,6,6,7,7,8,9,10,11,12,13,13,14,14,15],
  [19,5,6,6,7,7,8,9,10,11,12,13,13,14,14],
  [18,4,5,6,6,7,7,8,9,10,11,12,13,13,14],
  [17,3,4,5,6,6,7,7,8,9,10,11,12,13,13],
  [16,2,3,4,5,6,6,7,7,8,9,10,11,12,13],
  [15,1,2,3,4,5,6,6,7,7,8,9,10,11,12],
  [14,0,1,2,3,4,5,6,6,7,7,8,9,10,11],
  [13,0,0,1,2,3,4,5,6,6,7,7,8,9,10],
  [12,0,0,0,1,2,3,4,5,6,6,7,7,8,9],
  [11,0,0,0,0,1,2,3,4,5,6,6,7,7,8],
  [10,0,0,0,0,0,1,2,3,4,5,6,6,7,7],
  [9,0,0,0,0,0,0,1,2,3,4,5,6,6,7],
  [8,0,0,0,0,0,0,0,1,2,3,4,5,6,6],
  [7,0,0,0,0,0,0,0,0,1,2,3,4,5,6],
  [6,0,0,0,0,0,0,0,0,0,1,2,3,4,5],
  [5,0,0,0,0,0,0,0,0,0,0,1,2,3,4],
  [4,0,0,0,0,0,0,0,0,0,0,0,1,2,3],
  [3,0,0,0,0,0,0,0,0,0,0,0,0,1,2],
  [2,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
];

// Run table: [time_str, ag1..ag14]
// time is "MM:SS", value is the max time (≤) for that score
const RUN_RAW = [
  ["8:30",50,"","","","","","","","","","","","",""],
  ["8:40",49,50,"","","","","","","","","","","",""],
  ["8:50",48,49,50,"","","","","","","","","","",""],
  ["9:00",47,48,49,"","","","","","","","","","",""],
  ["9:10",46,47,48,50,"","","","","","","","","",""],
  ["9:20",45,46,47,49,50,"","","","","","","","",""],
  ["9:30",44,45,46,48,49,50,"","","","","","","",""],
  ["9:40",43,44,45,47,48,49,50,"","","","","","",""],
  ["9:50",42,43,44,46,47,48,49,50,"","","","","",""],
  ["10:00",41,42,43,45,46,47,48,49,50,"","","","",""],
  ["10:10",40,41,42,44,45,46,47,48,49,50,"","","",""],
  ["10:20",39,40,41,43,44,45,46,47,48,49,50,"","",""],
  ["10:30",38,39,40,42,43,44,45,46,47,48,49,50,"",""],
  ["10:40",38,38,39,41,42,43,44,45,46,47,48,49,50,""],
  ["10:50",37,38,38,40,41,42,43,44,45,46,47,48,49,50],
  ["11:00",37,37,38,39,40,41,42,43,44,45,46,47,48,49],
  ["11:10",36,37,37,38,39,40,41,42,43,44,45,46,47,48],
  ["11:20",36,36,37,38,38,39,40,41,42,43,44,45,46,47],
  ["11:30",35,36,36,37,38,38,39,40,41,42,43,44,45,46],
  ["11:40",35,35,36,37,37,38,38,39,40,41,42,43,44,45],
  ["11:50",34,35,35,36,37,37,38,38,39,40,41,42,43,44],
  ["12:00",33,34,35,36,36,37,37,38,38,39,40,41,42,43],
  ["12:10",32,33,34,35,36,36,37,37,38,38,39,40,41,42],
  ["12:20",31,32,33,35,35,36,36,37,37,38,38,39,40,41],
  ["12:30",30,31,32,34,35,35,36,36,37,37,38,38,39,40],
  ["12:40",29,30,31,33,34,35,35,36,36,37,37,38,38,39],
  ["12:50",28,29,30,32,33,34,35,35,36,36,37,37,38,38],
  ["13:00",27,28,29,31,32,33,34,35,35,36,36,37,37,38],
  ["13:10",26,27,28,30,31,32,33,34,35,35,36,36,37,37],
  ["13:20",25,26,27,29,30,31,32,33,34,35,35,36,36,37],
  ["13:30",24,25,26,28,29,30,31,32,33,34,35,35,36,36],
  ["13:40",23,24,25,27,28,29,30,31,32,33,34,35,35,36],
  ["13:50",22,23,24,26,27,28,29,30,31,32,33,34,35,35],
  ["14:00",21,22,23,25,26,27,28,29,30,31,32,33,34,35],
  ["14:10",20,21,22,24,25,26,27,28,29,30,31,32,33,34],
  ["14:20",19,20,21,23,24,25,26,27,28,29,30,31,32,33],
  ["14:30",18,19,20,22,23,24,25,26,27,28,29,30,31,32],
  ["14:40",16,18,19,21,22,23,24,25,26,27,28,29,30,31],
  ["14:50",14,16,18,20,21,22,23,24,25,26,27,28,29,30],
  ["15:00",12,14,16,19,20,21,22,23,24,25,26,27,28,29],
  ["15:10",10,12,14,18,19,20,21,22,23,24,25,26,27,28],
  ["15:20",8,10,12,16,18,19,20,21,22,23,24,25,26,27],
  ["15:30",6,8,10,14,16,18,19,20,21,22,23,24,25,26],
  ["15:40",4,6,8,12,14,16,18,19,20,21,22,23,24,25],
  ["15:50",2,4,6,10,12,14,16,18,19,20,21,22,23,24],
  ["16:00",1,2,4,8,10,12,14,16,18,19,20,21,22,23],
  ["16:10",0,1,2,6,8,10,12,14,16,18,19,20,21,22],
  ["16:20",0,0,1,4,6,8,10,12,14,16,18,19,20,21],
  ["16:30",0,0,0,2,4,6,8,10,12,14,16,18,19,20],
  ["16:40",0,0,0,1,2,4,6,8,10,12,14,16,18,19],
  ["16:50",0,0,0,0,1,2,4,6,8,10,12,14,16,18],
  ["17:00",0,0,0,0,0,1,2,4,6,8,10,12,14,16],
  ["17:10",0,0,0,0,0,0,1,2,4,6,8,10,12,14],
  ["17:20",0,0,0,0,0,0,0,1,2,4,6,8,10,12],
  ["17:30",0,0,0,0,0,0,0,0,1,2,4,6,8,10],
  ["17:40",0,0,0,0,0,0,0,0,0,1,2,4,6,8],
  ["17:50",0,0,0,0,0,0,0,0,0,0,1,2,4,6],
  ["18:00",0,0,0,0,0,0,0,0,0,0,0,1,2,4],
  ["18:10",0,0,0,0,0,0,0,0,0,0,0,0,1,2],
  ["18:20",0,0,0,0,0,0,0,0,0,0,0,0,0,1],
];

// ─── Age group lookup ─────────────────────────────────────────────────────────
// Returns 0-indexed column into the scoring arrays (0 = age group 1 = <22)
function getAgeGroupIdx(age: number): number {
  if (age < 22) return 0;
  if (age <= 24) return 1;
  if (age <= 27) return 2;
  if (age <= 30) return 3;
  if (age <= 33) return 4;
  if (age <= 36) return 5;
  if (age <= 39) return 6;
  if (age <= 42) return 7;
  if (age <= 45) return 8;
  if (age <= 48) return 9;
  if (age <= 51) return 10;
  if (age <= 54) return 11;
  if (age <= 57) return 12;
  return 13; // 58-60
}

// Build lookup maps from raw data
// For pushup/situp: reps → points per age group
function buildStaticMap(raw: (number | string)[][]): Map<number, number[]> {
  const map = new Map<number, number[]>();
  // Track last seen value per age group column (for "" = already maxed = 25)
  const maxed = Array(14).fill(false);
  for (const row of raw) {
    const reps = row[0] as number;
    const pts: number[] = [];
    for (let i = 1; i <= 14; i++) {
      const v = row[i];
      if (v === "" || v === undefined) {
        // blank at top = 25 (age group already maxed at fewer reps)
        pts.push(25);
      } else {
        pts.push(v as number);
      }
    }
    map.set(reps, pts);
  }
  return map;
}

const PUSHUP_MAP = buildStaticMap(PUSHUP_RAW);
const SITUP_MAP = buildStaticMap(SITUP_RAW);

// Run: time string → seconds
function timeToSec(t: string): number {
  const [m, s] = t.split(':').map(Number);
  return m * 60 + s;
}

// Build run lookup: sorted array of [maxSec, points[14]]
const RUN_TABLE: [number, number[]][] = RUN_RAW.map(row => {
  const secs = timeToSec(row[0] as string);
  const pts: number[] = [];
  for (let i = 1; i <= 14; i++) {
    const v = row[i];
    pts.push(v === "" || v === undefined ? 50 : v as number);
  }
  return [secs, pts];
});

function getStaticPts(map: Map<number, number[]>, reps: number, ageIdx: number): number {
  const row = map.get(reps);
  if (!row) return 0;
  return row[ageIdx] ?? 0;
}

function getRunPts(seconds: number, ageIdx: number): number {
  // Round up to nearest 10 seconds
  const rounded = Math.ceil(seconds / 10) * 10;
  for (const [maxSec, pts] of RUN_TABLE) {
    if (rounded <= maxSec) return pts[ageIdx] ?? 0;
  }
  return 0;
}

function calcIppt(pushups: number, situps: number, runSec: number, age: number) {
  const idx = getAgeGroupIdx(age);
  const pu = getStaticPts(PUSHUP_MAP, pushups, idx);
  const su = getStaticPts(SITUP_MAP, situps, idx);
  const run = getRunPts(runSec, idx);
  const total = pu + su + run;
  let award: 'Gold' | 'Silver' | 'Pass' | 'Fail';
  if (pu < 1 || su < 1 || run < 1) award = 'Fail';
  else if (total >= 85) award = 'Gold';
  else if (total >= 75) award = 'Silver';
  else if (total >= 51) award = 'Pass';
  else award = 'Fail';
  return { total, award, pu, su, run };
}

const AWARD_STYLE: Record<string, string> = {
  Gold:   'bg-yellow-400 text-yellow-900',
  Silver: 'bg-slate-300 text-slate-800',
  Pass:   'bg-green-100 text-green-800',
  Fail:   'bg-red-100 text-red-800',
};

const fmtTime = (sec: number | null) => {
  if (sec === null || sec === undefined) return '-';
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
};

const RANKS = ['ME1T'];

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProfileStatistics() {
  const { roles, user } = useAuth();
  const { toast } = useToast();

  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [graphOpen, setGraphOpen] = useState(false);
  const [graphView, setGraphView] = useState<'week' | 'month'>('month');
  const [editForm, setEditForm] = useState<Partial<ProfileData>>({});
  const [actForm, setActForm] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'run', distance_km: '', duration_minutes: '',
    pushups: '', situps: '', run_min: '', run_sec: '', notes: '',
  });

  useEffect(() => { if (user) { fetchProfile(); fetchActivities(); } }, [user]);

  const fetchProfile = async () => {
    const { data } = await supabase.from('profiles').select('*').eq('id', user!.id).single();
    if (data) {
      setProfileData(data as unknown as ProfileData);
      setEditForm(data as unknown as ProfileData);
    }
  };

  const fetchActivities = async () => {
    const { data } = await supabase.from('activities').select('*').eq('user_id', user!.id).order('date', { ascending: true });
    if (data) setActivities(data as Activity[]);
  };

  const saveProfile = async () => {
    const { error } = await supabase.from('profiles').update(editForm).eq('id', user!.id);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); }
    else { toast({ title: 'Profile updated!' }); fetchProfile(); setEditOpen(false); }
  };

  const saveActivity = async () => {
    const run_seconds = (actForm.run_min || actForm.run_sec)
      ? parseInt(actForm.run_min || '0') * 60 + parseInt(actForm.run_sec || '0') : null;
    const { error } = await supabase.from('activities').insert({
      user_id: user!.id, date: actForm.date, type: actForm.type,
      distance_km: actForm.distance_km ? parseFloat(actForm.distance_km) : null,
      duration_minutes: actForm.duration_minutes ? parseInt(actForm.duration_minutes) : null,
      pushups: actForm.pushups ? parseInt(actForm.pushups) : null,
      situps: actForm.situps ? parseInt(actForm.situps) : null,
      run_seconds, notes: actForm.notes,
    });
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); }
    else {
      toast({ title: 'Activity logged!' });
      const prev = activities.length;
      await fetchActivities();
      setAddOpen(false);
      if (prev === 0) setGraphOpen(true);
      setActForm({ date: new Date().toISOString().split('T')[0], type: 'run', distance_km: '', duration_minutes: '', pushups: '', situps: '', run_min: '', run_sec: '', notes: '' });
    }
  };

  const graphData = (() => {
    type G = { label: string; run_km: number; cycle_km: number; swim_km: number; count: number; pushups: number[]; situps: number[]; run_seconds: number[] };
    const groups: Record<string, G> = {};
    activities.forEach(a => {
      const d = new Date(a.date);
      const key = graphView === 'week'
        ? (() => { const w = new Date(d); w.setDate(d.getDate() - d.getDay()); return w.toISOString().split('T')[0]; })()
        : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!groups[key]) groups[key] = { label: key, run_km: 0, cycle_km: 0, swim_km: 0, count: 0, pushups: [], situps: [], run_seconds: [] };
      groups[key].count++;
      if (a.type === 'run' && a.distance_km) groups[key].run_km += a.distance_km;
      if (a.type === 'cycle' && a.distance_km) groups[key].cycle_km += a.distance_km;
      if (a.type === 'swim' && a.distance_km) groups[key].swim_km += a.distance_km;
      if (a.pushups) groups[key].pushups.push(a.pushups);
      if (a.situps) groups[key].situps.push(a.situps);
      if (a.run_seconds) groups[key].run_seconds.push(a.run_seconds);
    });
    return Object.values(groups).map(g => ({
      ...g,
      avg_pushups: g.pushups.length ? Math.round(g.pushups.reduce((a, b) => a + b) / g.pushups.length) : null,
      avg_situps: g.situps.length ? Math.round(g.situps.reduce((a, b) => a + b) / g.situps.length) : null,
      avg_run_sec: g.run_seconds.length ? Math.round(g.run_seconds.reduce((a, b) => a + b) / g.run_seconds.length) : null,
    }));
  })();

  const hasAge = profileData?.age != null && profileData.age > 0;
  const hasIpptData = profileData?.ippt_pushups && profileData?.ippt_situps && profileData?.ippt_run_seconds;
  const ippt = hasAge && hasIpptData
    ? calcIppt(profileData!.ippt_pushups!, profileData!.ippt_situps!, profileData!.ippt_run_seconds!, profileData!.age!)
    : null;

  const initials = profileData?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <User className="h-7 w-7 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Profile & Statistics</h1>
        </div>
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm"><Pencil className="h-4 w-4 mr-1" /> Edit Profile</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Edit Profile</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Rank</Label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={editForm.rank || ''} onChange={e => setEditForm(f => ({ ...f, rank: e.target.value }))}>
                    {RANKS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label>Full Name</Label>
                  <Input value={editForm.full_name || ''} onChange={e => setEditForm(f => ({ ...f, full_name: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Age <span className="text-destructive">*</span></Label>
                  <Input type="number" placeholder="Required for IPPT" value={editForm.age || ''} onChange={e => setEditForm(f => ({ ...f, age: parseInt(e.target.value) }))} />
                </div>
                <div className="space-y-1">
                  <Label>Height (cm)</Label>
                  <Input type="number" value={editForm.height_cm || ''} onChange={e => setEditForm(f => ({ ...f, height_cm: parseFloat(e.target.value) }))} />
                </div>
              </div>
              <div className="border-t pt-3">
                <p className="text-sm font-medium mb-2">Official IPPT Results</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Push-ups</Label>
                    <Input type="number" value={editForm.ippt_pushups || ''} onChange={e => setEditForm(f => ({ ...f, ippt_pushups: parseInt(e.target.value) }))} />
                  </div>
                  <div className="space-y-1">
                    <Label>Sit-ups</Label>
                    <Input type="number" value={editForm.ippt_situps || ''} onChange={e => setEditForm(f => ({ ...f, ippt_situps: parseInt(e.target.value) }))} />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <Label>2.4km Run Time (MM : SS)</Label>
                    <div className="flex gap-2">
                      <Input type="number" placeholder="MM"
                        value={editForm.ippt_run_seconds ? Math.floor(editForm.ippt_run_seconds / 60) : ''}
                        onChange={e => setEditForm(f => ({ ...f, ippt_run_seconds: parseInt(e.target.value) * 60 + ((f.ippt_run_seconds || 0) % 60) }))} />
                      <Input type="number" placeholder="SS"
                        value={editForm.ippt_run_seconds ? editForm.ippt_run_seconds % 60 : ''}
                        onChange={e => setEditForm(f => ({ ...f, ippt_run_seconds: Math.floor((f.ippt_run_seconds || 0) / 60) * 60 + parseInt(e.target.value) }))} />
                    </div>
                  </div>
                </div>
              </div>
              <Button className="w-full" onClick={saveProfile}>Save</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Profile card */}
      <Card>
        <CardContent className="flex items-center gap-4 p-6">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="bg-primary text-primary-foreground text-xl">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-foreground">
                {profileData?.rank && profileData.rank !== 'Other' ? `${profileData.rank} ` : ''}
                {profileData?.full_name || 'User'}
              </h2>
              {ippt && (ippt.award === 'Gold' || ippt.award === 'Silver') && (
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${AWARD_STYLE[ippt.award]}`}>
                  IPPT {ippt.award}
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{profileData?.department} Department</p>
            {(profileData?.age || profileData?.height_cm) && (
              <p className="text-sm text-muted-foreground">
                {profileData.age ? `Age: ${profileData.age}` : ''}
                {profileData.age && profileData.height_cm ? ' · ' : ''}
                {profileData.height_cm ? `Height: ${profileData.height_cm}cm` : ''}
              </p>
            )}
            <div className="flex gap-2 mt-2 flex-wrap">
              {roles.map(r => <Badge key={r} variant="secondary">{r}</Badge>)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* IPPT Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" /> Official IPPT Results
            {ippt && (
              <span className={`ml-auto text-xs font-bold px-3 py-1 rounded-full ${AWARD_STYLE[ippt.award]}`}>
                {ippt.award} · {ippt.total} pts
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Age missing warning */}
          {!hasAge && hasIpptData && (
            <div className="flex items-center gap-2 rounded-lg border border-yellow-300 bg-yellow-50 p-3 mb-4 text-sm text-yellow-800">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>Add your age in <button className="underline font-medium" onClick={() => setEditOpen(true)}>Edit Profile</button> to calculate your IPPT score — scoring varies by age group.</span>
            </div>
          )}
          {!hasAge && !hasIpptData && (
            <div className="flex items-center gap-2 rounded-lg border border-yellow-300 bg-yellow-50 p-3 mb-4 text-sm text-yellow-800">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>Add your age and IPPT results via <button className="underline font-medium" onClick={() => setEditOpen(true)}>Edit Profile</button> to see your score calculated automatically.</span>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center rounded-lg border p-3">
              <div className="text-2xl font-bold text-foreground">{profileData?.ippt_pushups ?? '-'}</div>
              <div className="text-xs text-muted-foreground">Push-ups</div>
              {ippt && <div className="text-xs text-primary mt-1">{ippt.pu} pts</div>}
            </div>
            <div className="text-center rounded-lg border p-3">
              <div className="text-2xl font-bold text-foreground">{profileData?.ippt_situps ?? '-'}</div>
              <div className="text-xs text-muted-foreground">Sit-ups</div>
              {ippt && <div className="text-xs text-primary mt-1">{ippt.su} pts</div>}
            </div>
            <div className="text-center rounded-lg border p-3">
              <div className="text-2xl font-bold text-foreground">{fmtTime(profileData?.ippt_run_seconds ?? null)}</div>
              <div className="text-xs text-muted-foreground">2.4km Run</div>
              {ippt && <div className="text-xs text-primary mt-1">{ippt.run} pts</div>}
            </div>
            <div className="text-center rounded-lg border p-3">
              <div className={`text-2xl font-bold ${ippt?.award === 'Gold' ? 'text-yellow-500' : ippt?.award === 'Fail' ? 'text-red-500' : 'text-foreground'}`}>
                {ippt?.total ?? '-'}
              </div>
              <div className="text-xs text-muted-foreground">Total Score</div>
              {ippt && (
                <div className={`text-xs font-semibold mt-1 px-2 py-0.5 rounded-full inline-block ${AWARD_STYLE[ippt.award]}`}>
                  {ippt.award}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Tracking */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Activity Tracking</CardTitle>
            <div className="flex gap-2">
              {activities.length > 0 && (
                <Dialog open={graphOpen} onOpenChange={setGraphOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm"><BarChart2 className="h-4 w-4 mr-1" /> View Graphs</Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <div className="flex items-center justify-between pr-6">
                        <DialogTitle>Activity Graphs</DialogTitle>
                        <div className="flex rounded-lg border overflow-hidden text-sm">
                          <button className={`px-3 py-1 ${graphView === 'week' ? 'bg-primary text-primary-foreground' : 'bg-background'}`} onClick={() => setGraphView('week')}>Week</button>
                          <button className={`px-3 py-1 ${graphView === 'month' ? 'bg-primary text-primary-foreground' : 'bg-background'}`} onClick={() => setGraphView('month')}>Month</button>
                        </div>
                      </div>
                    </DialogHeader>
                    <div className="space-y-6 pt-2">
                      <div>
                        <p className="text-sm font-medium mb-2">Distance by Activity (km)</p>
                        <ResponsiveContainer width="100%" height={200}>
                          <BarChart data={graphData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                            <YAxis tick={{ fontSize: 10 }} />
                            <Tooltip /><Legend />
                            <Bar dataKey="run_km" name="Run" fill="#3b82f6" />
                            <Bar dataKey="cycle_km" name="Cycle" fill="#f97316" />
                            <Bar dataKey="swim_km" name="Swim" fill="#06b6d4" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-2">Activity Frequency</p>
                        <ResponsiveContainer width="100%" height={180}>
                          <BarChart data={graphData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                            <YAxis tick={{ fontSize: 10 }} />
                            <Tooltip />
                            <Bar dataKey="count" name="Sessions" fill="#8b5cf6" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-2">IPPT Training — Push-ups & Sit-ups</p>
                        <ResponsiveContainer width="100%" height={200}>
                          <LineChart data={graphData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                            <YAxis tick={{ fontSize: 10 }} />
                            <Tooltip /><Legend />
                            <Line type="monotone" dataKey="avg_pushups" name="Push-ups" stroke="#3b82f6" dot />
                            <Line type="monotone" dataKey="avg_situps" name="Sit-ups" stroke="#10b981" dot />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-2">2.4km Run Time (lower = better)</p>
                        <ResponsiveContainer width="100%" height={200}>
                          <LineChart data={graphData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                            <YAxis tick={{ fontSize: 10 }} tickFormatter={v => fmtTime(v)} />
                            <Tooltip formatter={(v: number) => fmtTime(v)} />
                            <Line type="monotone" dataKey="avg_run_sec" name="Run Time" stroke="#f97316" dot />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}

              <Dialog open={addOpen} onOpenChange={setAddOpen}>
                <DialogTrigger asChild>
                  <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Log</Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader><DialogTitle>Log Activity</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label>Date</Label>
                        <Input type="date" value={actForm.date} onChange={e => setActForm(f => ({ ...f, date: e.target.value }))} />
                      </div>
                      <div className="space-y-1">
                        <Label>Type</Label>
                        <Select value={actForm.type} onValueChange={v => setActForm(f => ({ ...f, type: v }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="run">Run</SelectItem>
                            <SelectItem value="cycle">Cycle</SelectItem>
                            <SelectItem value="swim">Swim</SelectItem>
                            <SelectItem value="gym">Gym</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    {['run', 'cycle', 'swim'].includes(actForm.type) && (
                      <div className="space-y-1">
                        <Label>Distance (km)</Label>
                        <Input type="number" step="0.1" value={actForm.distance_km} onChange={e => setActForm(f => ({ ...f, distance_km: e.target.value }))} />
                      </div>
                    )}
                    <div className="space-y-1">
                      <Label>Duration (minutes)</Label>
                      <Input type="number" value={actForm.duration_minutes} onChange={e => setActForm(f => ({ ...f, duration_minutes: e.target.value }))} />
                    </div>
                    <div className="border-t pt-3">
                      <p className="text-sm font-medium mb-2">IPPT Training (optional)</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label>Push-ups</Label>
                          <Input type="number" value={actForm.pushups} onChange={e => setActForm(f => ({ ...f, pushups: e.target.value }))} />
                        </div>
                        <div className="space-y-1">
                          <Label>Sit-ups</Label>
                          <Input type="number" value={actForm.situps} onChange={e => setActForm(f => ({ ...f, situps: e.target.value }))} />
                        </div>
                        <div className="col-span-2 space-y-1">
                          <Label>2.4km Run Time (MM : SS)</Label>
                          <div className="flex gap-2">
                            <Input type="number" placeholder="MM" value={actForm.run_min} onChange={e => setActForm(f => ({ ...f, run_min: e.target.value }))} />
                            <Input type="number" placeholder="SS" value={actForm.run_sec} onChange={e => setActForm(f => ({ ...f, run_sec: e.target.value }))} />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label>Notes</Label>
                      <Input value={actForm.notes} onChange={e => setActForm(f => ({ ...f, notes: e.target.value }))} />
                    </div>
                    <Button className="w-full" onClick={saveActivity}>Save Activity</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No activities logged yet. Hit Log to get started.</p>
          ) : (
            <div className="space-y-2">
              {activities.slice().reverse().slice(0, 5).map(a => (
                <div key={a.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <div className="font-medium text-sm text-foreground capitalize">
                      {a.type}{a.distance_km ? ` · ${a.distance_km}km` : ''}
                    </div>
                    <div className="text-xs text-muted-foreground">{a.date}{a.notes ? ` · ${a.notes}` : ''}</div>
                  </div>
                  <div className="text-xs text-muted-foreground text-right">
                    {[a.pushups ? `${a.pushups} PU` : '', a.situps ? `${a.situps} SU` : '', a.run_seconds ? fmtTime(a.run_seconds) : ''].filter(Boolean).join(' · ')}
                  </div>
                </div>
              ))}
              {activities.length > 5 && (
                <p className="text-xs text-muted-foreground text-center pt-1">Showing last 5 of {activities.length} activities</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
