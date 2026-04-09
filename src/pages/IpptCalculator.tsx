import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Timer, Trophy, Save } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts';

// ─── IPPT Scoring Tables (exact official data) ────────────────────────────────

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

// ─── Scoring logic ────────────────────────────────────────────────────────────

function getAgeGroupIdx(age: number): number {
  if (age < 22) return 0; if (age <= 24) return 1; if (age <= 27) return 2;
  if (age <= 30) return 3; if (age <= 33) return 4; if (age <= 36) return 5;
  if (age <= 39) return 6; if (age <= 42) return 7; if (age <= 45) return 8;
  if (age <= 48) return 9; if (age <= 51) return 10; if (age <= 54) return 11;
  if (age <= 57) return 12; return 13;
}

function buildStaticMap(raw: (number | string)[][]): Map<number, number[]> {
  const map = new Map<number, number[]>();
  for (const row of raw) {
    const pts: number[] = [];
    for (let i = 1; i <= 14; i++) { const v = row[i]; pts.push(v === "" || v === undefined ? 25 : v as number); }
    map.set(row[0] as number, pts);
  }
  return map;
}
const PUSHUP_MAP = buildStaticMap(PUSHUP_RAW);
const SITUP_MAP  = buildStaticMap(SITUP_RAW);

function timeToSec(t: string): number { const [m, s] = t.split(':').map(Number); return m * 60 + s; }
const RUN_TABLE: [number, number[]][] = RUN_RAW.map(row => {
  const pts: number[] = [];
  for (let i = 1; i <= 14; i++) { const v = row[i]; pts.push(v === "" || v === undefined ? 50 : v as number); }
  return [timeToSec(row[0] as string), pts];
});

function getStaticPts(map: Map<number, number[]>, reps: number, idx: number): number {
  return (map.get(reps) ?? [])[idx] ?? 0;
}
function getRunPts(seconds: number, idx: number): number {
  const r = Math.ceil(seconds / 10) * 10;
  for (const [ms, pts] of RUN_TABLE) { if (r <= ms) return pts[idx] ?? 0; }
  return 0;
}
function calcIppt(pushups: number, situps: number, runSec: number, age: number) {
  const idx = getAgeGroupIdx(age);
  const pu  = getStaticPts(PUSHUP_MAP, pushups, idx);
  const su  = getStaticPts(SITUP_MAP,  situps,  idx);
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

const AWARD_STYLE: Record<string, { badge: string; text: string }> = {
  Gold:   { badge: 'bg-yellow-400 text-yellow-900', text: 'text-yellow-500' },
  Silver: { badge: 'bg-slate-300 text-slate-800',   text: 'text-slate-500'  },
  Pass:   { badge: 'bg-green-100 text-green-800',   text: 'text-green-600'  },
  Fail:   { badge: 'bg-red-100 text-red-800',       text: 'text-red-500'    },
};

const fmtTime = (sec: number) =>
  `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;

// ─── Types ────────────────────────────────────────────────────────────────────

type SavedResult = {
  id: string;
  user_id: string;
  age: number;
  pushups: number;
  situps: number;
  run_seconds: number;
  pu_pts: number;
  su_pts: number;
  run_pts: number;
  total: number;
  award: string;
  created_at: string;
};

const AGE_GROUPS = [
  { label: '< 22',   min: 18, max: 21 },
  { label: '22–24',  min: 22, max: 24 },
  { label: '25–27',  min: 25, max: 27 },
  { label: '28–30',  min: 28, max: 30 },
  { label: '31–33',  min: 31, max: 33 },
  { label: '34–36',  min: 34, max: 36 },
  { label: '37–39',  min: 37, max: 39 },
  { label: '40–42',  min: 40, max: 42 },
  { label: '43–45',  min: 43, max: 45 },
  { label: '46–48',  min: 46, max: 48 },
  { label: '49–51',  min: 49, max: 51 },
  { label: '52–54',  min: 52, max: 54 },
  { label: '55–57',  min: 55, max: 57 },
  { label: '58–60',  min: 58, max: 60 },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function IpptCalculator() {
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const [age, setAge] = useState('');
  const [pushups, setPushups] = useState('');
  const [situps, setSitups] = useState('');
  const [runMin, setRunMin] = useState('');
  const [runSec, setRunSec] = useState('');
  const [result, setResult] = useState<ReturnType<typeof calcIppt> | null>(null);
  const [savedResults, setSavedResults] = useState<SavedResult[]>([]);
  const [saving, setSaving] = useState(false);

  // Pre-fill age from profile
  useEffect(() => {
    if (profile?.age) setAge(String(profile.age));
  }, [profile]);

  useEffect(() => {
    if (user) fetchSaved();
  }, [user]);

  const fetchSaved = async () => {
    const { data } = await supabase
      .from('ippt_results')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: true });
    if (data) setSavedResults(data as SavedResult[]);
  };

  const calculate = () => {
    const a  = parseInt(age)     || 0;
    const pu = parseInt(pushups) || 0;
    const su = parseInt(situps)  || 0;
    const rs = (parseInt(runMin) || 0) * 60 + (parseInt(runSec) || 0);
    if (!a || !pu || !su || !rs) {
      toast({ title: 'Fill in all fields', variant: 'destructive' });
      return;
    }
    setResult(calcIppt(pu, su, rs, a));
  };

  const saveResult = async () => {
    if (!result || !user) return;
    const a  = parseInt(age);
    const pu = parseInt(pushups);
    const su = parseInt(situps);
    const rs = (parseInt(runMin) || 0) * 60 + (parseInt(runSec) || 0);
    setSaving(true);
    const { error } = await supabase.from('ippt_results').insert({
      user_id:     user.id,
      age:         a,
      pushups:     pu,
      situps:      su,
      run_seconds: rs,
      pu_pts:      result.pu,
      su_pts:      result.su,
      run_pts:     result.run,
      total:       result.total,
      award:       result.award,
    });
    setSaving(false);
    if (error) { toast({ title: 'Error saving', description: error.message, variant: 'destructive' }); }
    else { toast({ title: 'Result saved!' }); fetchSaved(); }
  };

  const ageGroupLabel = (a: number) => AGE_GROUPS.find(g => a >= g.min && a <= g.max)?.label ?? `Age ${a}`;

  // Graph data
  const graphData = savedResults.map((r, i) => ({
    name: new Date(r.created_at).toLocaleDateString('en-SG', { day: 'numeric', month: 'short' }),
    attempt: i + 1,
    total: r.total,
    pushups: r.pu_pts,
    situps:  r.su_pts,
    run:     r.run_pts,
  }));

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      <div className="flex items-center gap-3">
        <Timer className="h-7 w-7 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">IPPT Calculator</h1>
      </div>

      {/* Input card */}
      <Card>
        <CardHeader>
          <CardTitle>Calculate Your Score</CardTitle>
          <CardDescription>Enter your age and results to get your official IPPT score</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Age */}
          <div className="space-y-2">
            <Label>Age</Label>
            <Input
              type="number" placeholder="e.g. 22"
              value={age} onChange={e => { setAge(e.target.value); setResult(null); }}
              className="max-w-[120px]"
            />
            {age && parseInt(age) >= 18 && parseInt(age) <= 60 && (
              <p className="text-xs text-muted-foreground">Age group: {ageGroupLabel(parseInt(age))}</p>
            )}
          </div>

          {/* Push-ups & Sit-ups */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Push-ups <span className="text-xs text-muted-foreground">(max 25 pts)</span></Label>
              <Input type="number" placeholder="e.g. 40" value={pushups} onChange={e => { setPushups(e.target.value); setResult(null); }} />
            </div>
            <div className="space-y-2">
              <Label>Sit-ups <span className="text-xs text-muted-foreground">(max 25 pts)</span></Label>
              <Input type="number" placeholder="e.g. 40" value={situps} onChange={e => { setSitups(e.target.value); setResult(null); }} />
            </div>
          </div>

          {/* Run time */}
          <div className="space-y-2">
            <Label>2.4km Run Time <span className="text-xs text-muted-foreground">(max 50 pts)</span></Label>
            <div className="flex items-center gap-2">
              <Input type="number" placeholder="MM" value={runMin} onChange={e => { setRunMin(e.target.value); setResult(null); }} className="w-24" />
              <span className="text-muted-foreground font-medium">:</span>
              <Input type="number" placeholder="SS" value={runSec} onChange={e => { setRunSec(e.target.value); setResult(null); }} className="w-24" />
              <span className="text-xs text-muted-foreground">min : sec</span>
            </div>
          </div>

          <Button onClick={calculate} className="w-full">Calculate</Button>

          {/* Result */}
          {result && (() => {
            const style = AWARD_STYLE[result.award];
            return (
              <div className="rounded-xl border p-5 space-y-4">
                {/* Score + award */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className={`text-5xl font-bold ${style.text}`}>{result.total}</div>
                    <div className="text-sm text-muted-foreground mt-1">out of 100</div>
                  </div>
                  <span className={`text-sm font-bold px-4 py-2 rounded-full ${style.badge}`}>
                    {result.award}
                  </span>
                </div>

                {/* Station breakdown */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Push-ups', pts: result.pu,  max: 25, value: pushups  },
                    { label: 'Sit-ups',  pts: result.su,  max: 25, value: situps   },
                    { label: '2.4km Run', pts: result.run, max: 50,
                      value: runMin || runSec ? `${runMin || '0'}:${String(parseInt(runSec || '0')).padStart(2,'0')}` : '-' },
                  ].map(s => (
                    <div key={s.label} className="rounded-lg bg-muted p-3 text-center">
                      <div className="text-xs text-muted-foreground mb-1">{s.label}</div>
                      <div className="text-lg font-bold text-foreground">{s.value}</div>
                      <div className={`text-xs font-semibold mt-1 ${s.pts < 1 ? 'text-red-500' : 'text-primary'}`}>
                        {s.pts} / {s.max} pts
                      </div>
                      {/* Mini progress bar */}
                      <div className="mt-2 h-1.5 rounded-full bg-border overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${(s.pts / s.max) * 100}%`,
                            backgroundColor: s.pts < 1 ? '#ef4444' : s.pts === s.max ? '#eab308' : '#3b82f6',
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Next award hint */}
                {result.award !== 'Gold' && result.award !== 'Fail' && (
                  <p className="text-xs text-muted-foreground text-center">
                    {result.award === 'Silver' ? `${85 - result.total} more pts for Gold` :
                     result.award === 'Pass'   ? `${75 - result.total} more pts for Silver` : ''}
                  </p>
                )}
                {result.award === 'Fail' && (
                  <p className="text-xs text-red-500 text-center">
                    {result.pu < 1 || result.su < 1 || result.run < 1
                      ? 'Must score at least 1 point in every station to pass'
                      : `${51 - result.total} more pts needed to pass`}
                  </p>
                )}

                <Button onClick={saveResult} disabled={saving} variant="outline" className="w-full">
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Result'}
                </Button>
              </div>
            );
          })()}
        </CardContent>
      </Card>

      {/* Saved results */}
      {savedResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" /> Saved Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">

            {/* Graph — only if more than one result */}
            {savedResults.length > 1 && (
              <div className="space-y-6">
                <div>
                  <p className="text-sm font-medium mb-2">Total Score Over Time</p>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={graphData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <ReferenceLine y={85} stroke="#eab308" strokeDasharray="4 4" label={{ value: 'Gold', fill: '#eab308', fontSize: 10 }} />
                      <ReferenceLine y={75} stroke="#94a3b8" strokeDasharray="4 4" label={{ value: 'Silver', fill: '#94a3b8', fontSize: 10 }} />
                      <ReferenceLine y={51} stroke="#22c55e" strokeDasharray="4 4" label={{ value: 'Pass', fill: '#22c55e', fontSize: 10 }} />
                      <Line type="monotone" dataKey="total" name="Total" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Station Scores Over Time</p>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={graphData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip /><Legend />
                      <Line type="monotone" dataKey="pushups" name="Push-ups" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="situps"  name="Sit-ups"  stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="run"     name="2.4km Run" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Results list */}
            <div className="space-y-2">
              {savedResults.slice().reverse().map((r, i) => {
                const style = AWARD_STYLE[r.award] ?? AWARD_STYLE['Fail'];
                return (
                  <div key={r.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">
                          {new Date(r.created_at).toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${style.badge}`}>{r.award}</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        Age {r.age} · PU: {r.pushups} ({r.pu_pts}pts) · SU: {r.situps} ({r.su_pts}pts) · Run: {fmtTime(r.run_seconds)} ({r.run_pts}pts)
                      </div>
                    </div>
                    <div className={`text-2xl font-bold ${style.text}`}>{r.total}</div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
