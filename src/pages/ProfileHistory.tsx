import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTeam } from '@/contexts/TeamContext';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { User, Trophy, Pencil, AlertCircle, SlidersHorizontal, Check, Camera, ArrowLeft } from 'lucide-react';
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
  avatar_url: string | null;
};

// ─── IPPT Scoring Tables ──────────────────────────────────────────────────────

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
  Gold: 'bg-yellow-400 text-yellow-900', Silver: 'bg-slate-300 text-slate-800',
  Pass: 'bg-green-100 text-green-800',   Fail:   'bg-red-100 text-red-800',
};
const fmtTime = (sec: number | null) => {
  if (sec == null) return '-';
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
};
const RANKS = ['ME1T'];

// ─── Stat definitions ─────────────────────────────────────────────────────────
// Each stat has: an id, a label, a required data check, and a render function

type GraphData = {
  label: string;
  run_km: number; cycle_km: number; swim_km: number;
  count: number; duration: number;
  pushups: number[]; situps: number[]; run_seconds: number[];
  avg_pushups: number | null; avg_situps: number | null;
  avg_run_sec: number | null; avg_duration: number | null;
};

type StatDef = {
  id: string;
  label: string;
  description: string;
  // Whether this stat is available given the current activities
  available: (acts: Activity[]) => boolean;
  render: (data: GraphData[], view: 'week' | 'month') => React.ReactNode;
};

const STAT_DEFS: StatDef[] = [
  {
    id: 'run_frequency',
    label: 'Run Frequency',
    description: 'Number of run sessions per period',
    available: acts => acts.some(a => a.type === 'run'),
    render: (data, _) => (
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data.filter(d => d.run_km > 0 || d.count > 0)}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} />
          <Tooltip />
          <Bar dataKey="count" name="Run Sessions" fill="#3b82f6" />
        </BarChart>
      </ResponsiveContainer>
    ),
  },
  {
    id: 'run_distance',
    label: 'Run Distance',
    description: 'Total running distance (km) per period',
    available: acts => acts.some(a => a.type === 'run' && a.distance_km),
    render: (data, _) => (
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} />
          <Tooltip />
          <Bar dataKey="run_km" name="Run (km)" fill="#3b82f6" />
        </BarChart>
      </ResponsiveContainer>
    ),
  },
  {
    id: 'run_timing',
    label: 'Run Timing',
    description: '2.4km run time progress (lower = better)',
    available: acts => acts.some(a => a.type === 'run' && a.run_seconds),
    render: (data, _) => (
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data.filter(d => d.avg_run_sec)}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} tickFormatter={v => fmtTime(v)} />
          <Tooltip formatter={(v: number) => fmtTime(v)} />
          <Line type="monotone" dataKey="avg_run_sec" name="Avg Run Time" stroke="#3b82f6" dot connectNulls />
        </LineChart>
      </ResponsiveContainer>
    ),
  },
  {
    id: 'cycle_frequency',
    label: 'Cycle Frequency',
    description: 'Number of cycling sessions per period',
    available: acts => acts.some(a => a.type === 'cycle'),
    render: (data, _) => (
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} />
          <Tooltip />
          <Bar dataKey="cycle_km" name="Cycle Sessions" fill="#f97316" />
        </BarChart>
      </ResponsiveContainer>
    ),
  },
  {
    id: 'cycle_distance',
    label: 'Cycle Distance',
    description: 'Total cycling distance (km) per period',
    available: acts => acts.some(a => a.type === 'cycle' && a.distance_km),
    render: (data, _) => (
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} />
          <Tooltip />
          <Bar dataKey="cycle_km" name="Cycle (km)" fill="#f97316" />
        </BarChart>
      </ResponsiveContainer>
    ),
  },
  {
    id: 'swim_frequency',
    label: 'Swim Frequency',
    description: 'Number of swim sessions per period',
    available: acts => acts.some(a => a.type === 'swim'),
    render: (data, _) => (
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} />
          <Tooltip />
          <Bar dataKey="swim_km" name="Swim Sessions" fill="#06b6d4" />
        </BarChart>
      </ResponsiveContainer>
    ),
  },
  {
    id: 'swim_distance',
    label: 'Swim Distance',
    description: 'Total swim distance (km) per period',
    available: acts => acts.some(a => a.type === 'swim' && a.distance_km),
    render: (data, _) => (
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} />
          <Tooltip />
          <Bar dataKey="swim_km" name="Swim (km)" fill="#06b6d4" />
        </BarChart>
      </ResponsiveContainer>
    ),
  },
  {
    id: 'pushups',
    label: 'Push-up Progress',
    description: 'Average push-up reps over time',
    available: acts => acts.some(a => a.pushups),
    render: (data, _) => (
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data.filter(d => d.avg_pushups)}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} />
          <Tooltip />
          <Line type="monotone" dataKey="avg_pushups" name="Avg Push-ups" stroke="#8b5cf6" dot connectNulls />
        </LineChart>
      </ResponsiveContainer>
    ),
  },
  {
    id: 'situps',
    label: 'Sit-up Progress',
    description: 'Average sit-up reps over time',
    available: acts => acts.some(a => a.situps),
    render: (data, _) => (
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data.filter(d => d.avg_situps)}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} />
          <Tooltip />
          <Line type="monotone" dataKey="avg_situps" name="Avg Sit-ups" stroke="#10b981" dot connectNulls />
        </LineChart>
      </ResponsiveContainer>
    ),
  },
  {
    id: 'overall_frequency',
    label: 'Overall Activity Frequency',
    description: 'Total sessions across all activity types',
    available: acts => acts.length > 0,
    render: (data, _) => (
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} />
          <Tooltip /><Legend />
          <Bar dataKey="run_km" name="Run" fill="#3b82f6" stackId="a" />
          <Bar dataKey="cycle_km" name="Cycle" fill="#f97316" stackId="a" />
          <Bar dataKey="swim_km" name="Swim" fill="#06b6d4" stackId="a" />
        </BarChart>
      </ResponsiveContainer>
    ),
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProfileStatistics() {
  const { roles, user, profile: authProfile } = useAuth();
  const { myTeamRole, myRole } = useTeam();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // If ?user=<id> is set, we're viewing someone else's profile
  const viewUserId = searchParams.get('user') ?? user?.id ?? null;
  const isOwnProfile = !searchParams.get('user') || searchParams.get('user') === user?.id;

  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [selectOpen, setSelectOpen] = useState(false);
  const [graphView, setGraphView] = useState<'week' | 'month'>('month');
  const [selectedStats, setSelectedStats] = useState<Set<string>>(new Set());
  const [editForm, setEditForm] = useState<Partial<ProfileData>>({});

  // Avatar upload state
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  useEffect(() => { if (viewUserId) { fetchProfile(); fetchActivities(); } }, [viewUserId]);

  const fetchProfile = async () => {
    const { data } = await supabase.from('profiles').select('*').eq('id', viewUserId!).single();
    if (data) { setProfileData(data as unknown as ProfileData); setEditForm(data as unknown as ProfileData); }
  };

  const fetchActivities = async () => {
    const { data } = await supabase.from('activities').select('*').eq('user_id', viewUserId!).order('date', { ascending: true });
    if (data) setActivities(data as Activity[]);
  };

  const saveProfile = async () => {
    const { error } = await supabase.from('profiles').update(editForm).eq('id', user!.id);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); }
    else { toast({ title: 'Profile updated!' }); fetchProfile(); setEditOpen(false); }
  };

  const handleAvatarUpload = async (file: File) => {
    if (!user) return;
    setAvatarUploading(true);
    const ext = file.name.split('.').pop() ?? 'jpg';
    const path = `${user.id}/avatar.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true, contentType: file.type });
    if (uploadError) {
      toast({ title: 'Upload failed', description: uploadError.message, variant: 'destructive' });
      setAvatarUploading(false);
      return;
    }
    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    // Append cache-buster so the browser refreshes the image
    const avatarUrl = data.publicUrl + '?t=' + Date.now();
    await supabase.from('profiles').update({ avatar_url: avatarUrl }).eq('id', user.id);
    setProfileData(p => p ? { ...p, avatar_url: avatarUrl } : p);
    setAvatarUploading(false);
    toast({ title: 'Profile picture updated!' });
  };

  const toggleStat = (id: string) => {
    setSelectedStats(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Build graph data across all activities
  const graphData: GraphData[] = (() => {
    type G = { label: string; run_km: number; cycle_km: number; swim_km: number; count: number; duration: number; pushups: number[]; situps: number[]; run_seconds: number[] };
    const groups: Record<string, G> = {};
    activities.forEach(a => {
      const d = new Date(a.date);
      const key = graphView === 'week'
        ? (() => { const w = new Date(d); w.setDate(d.getDate() - d.getDay()); return w.toISOString().split('T')[0]; })()
        : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!groups[key]) groups[key] = { label: key, run_km: 0, cycle_km: 0, swim_km: 0, count: 0, duration: 0, pushups: [], situps: [], run_seconds: [] };
      groups[key].count++;
      if (a.type === 'run' && a.distance_km) groups[key].run_km += a.distance_km;
      if (a.type === 'cycle' && a.distance_km) groups[key].cycle_km += a.distance_km;
      if (a.type === 'swim' && a.distance_km) groups[key].swim_km += a.distance_km;
      if (a.duration_minutes) groups[key].duration += a.duration_minutes;
      if (a.pushups) groups[key].pushups.push(a.pushups);
      if (a.situps) groups[key].situps.push(a.situps);
      if (a.run_seconds) groups[key].run_seconds.push(a.run_seconds);
    });
    return Object.values(groups).map(g => ({
      ...g,
      avg_pushups: g.pushups.length ? Math.round(g.pushups.reduce((a, b) => a + b) / g.pushups.length) : null,
      avg_situps:  g.situps.length  ? Math.round(g.situps.reduce((a, b) => a + b)  / g.situps.length)  : null,
      avg_run_sec: g.run_seconds.length ? Math.round(g.run_seconds.reduce((a, b) => a + b) / g.run_seconds.length) : null,
      avg_duration: g.count ? Math.round(g.duration / g.count) : null,
    }));
  })();

  // Available stats based on actual activity data
  const availableStats = STAT_DEFS.filter(s => s.available(activities));
  // Selected stats that are also available
  const visibleStats = STAT_DEFS.filter(s => selectedStats.has(s.id) && s.available(activities));

  const hasAge = profileData?.age != null && profileData.age > 0;
  const hasIpptData = !!(profileData?.ippt_pushups && profileData?.ippt_situps && profileData?.ippt_run_seconds);
  const ippt = hasAge && hasIpptData
    ? calcIppt(profileData!.ippt_pushups!, profileData!.ippt_situps!, profileData!.ippt_run_seconds!, profileData!.age!)
    : null;
  const initials = profileData?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';

  // Derive a single display role label in priority order
  const isAppAdmin = (authProfile as any)?.is_admin === true;
  const teamRoleArr: string[] = Array.isArray(myTeamRole) ? myTeamRole : [];
  const displayRole: { label: string; style: string } = (() => {
    if (isAppAdmin) return { label: 'Admin', style: 'bg-yellow-100 text-yellow-800 border border-yellow-300' };
    if (teamRoleArr.includes('admin')) return { label: 'Admin', style: 'bg-yellow-100 text-yellow-800 border border-yellow-300' };
    if (teamRoleArr.includes('pt_ic')) return { label: 'PTIC', style: 'bg-blue-100 text-blue-800 border border-blue-300' };
    if (teamRoleArr.includes('spartan')) return { label: 'Spartan', style: 'bg-red-100 text-red-800 border border-red-300' };
    return { label: 'Spartan', style: 'bg-muted text-muted-foreground border border-border' };
  })();

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {!isOwnProfile && (
            <button onClick={() => navigate(-1)} className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground">
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <User className="h-7 w-7 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">
            {isOwnProfile ? 'Profile & Statistics' : `${profileData?.full_name ?? 'Profile'}`}
          </h1>
        </div>
        {isOwnProfile && (
          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm"><Pencil className="h-4 w-4 mr-1" /> Edit Profile</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle>Edit Profile</DialogTitle></DialogHeader>
              <div className="space-y-3">
                {/* Avatar upload */}
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={profileData?.avatar_url ?? undefined} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-xl">{initials}</AvatarFallback>
                    </Avatar>
                    <button
                      onClick={() => avatarInputRef.current?.click()}
                      disabled={avatarUploading}
                      className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow hover:bg-primary/90 transition-colors"
                    >
                      <Camera className="h-3 w-3" />
                    </button>
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => { const f = e.target.files?.[0]; if (f) handleAvatarUpload(f); }}
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Profile Picture</p>
                    <p className="text-xs text-muted-foreground">{avatarUploading ? 'Uploading...' : 'Tap camera to change'}</p>
                  </div>
                </div>
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
        )}
      </div>

      {/* Profile card */}
      <Card>
        <CardContent className="flex items-center gap-4 p-5">
          <div className="relative shrink-0">
            <Avatar className="h-16 w-16">
              <AvatarImage src={profileData?.avatar_url ?? undefined} alt={profileData?.full_name ?? ''} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xl">{initials}</AvatarFallback>
            </Avatar>
            {isOwnProfile && (
              <button
                onClick={() => avatarInputRef.current?.click()}
                disabled={avatarUploading}
                className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow hover:bg-primary/90 transition-colors"
                title="Change profile picture"
              >
                <Camera className="h-3 w-3" />
              </button>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-foreground truncate">
                {profileData?.rank && profileData.rank !== 'Other' ? `${profileData.rank} ` : ''}
                {profileData?.full_name || 'User'}
              </h2>
              {ippt && (ippt.award === 'Gold' || ippt.award === 'Silver') && (
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${AWARD_STYLE[ippt.award]}`}>
                  IPPT {ippt.award}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${displayRole.style}`}>
                {displayRole.label}
              </span>
              {(profileData?.age || profileData?.height_cm) && (
                <span className="text-xs text-muted-foreground">
                  {profileData.age ? `Age ${profileData.age}` : ''}
                  {profileData.age && profileData.height_cm ? ' · ' : ''}
                  {profileData.height_cm ? `${profileData.height_cm}cm` : ''}
                </span>
              )}
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
          {!hasAge && (
            <div className="flex items-center gap-2 rounded-lg border border-yellow-300 bg-yellow-50 p-3 mb-4 text-sm text-yellow-800">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>
                {hasIpptData
                  ? <>Add your age in <button className="underline font-medium" onClick={() => setEditOpen(true)}>Edit Profile</button> to calculate your IPPT score — scoring varies by age group.</>
                  : <>Add your age and IPPT results via <button className="underline font-medium" onClick={() => setEditOpen(true)}>Edit Profile</button> to see your score calculated automatically.</>
                }
              </span>
            </div>
          )}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Push-ups',    value: profileData?.ippt_pushups ?? '-',                    pts: ippt?.pu  },
              { label: 'Sit-ups',     value: profileData?.ippt_situps ?? '-',                     pts: ippt?.su  },
              { label: '2.4km Run',   value: fmtTime(profileData?.ippt_run_seconds ?? null),      pts: ippt?.run },
              { label: 'Total Score', value: ippt?.total ?? '-', pts: undefined, award: ippt?.award },
            ].map(s => (
              <div key={s.label} className="text-center rounded-lg border p-3">
                <div className={`text-2xl font-bold ${'award' in s && s.award === 'Gold' ? 'text-yellow-500' : 'award' in s && s.award === 'Fail' ? 'text-red-500' : 'text-foreground'}`}>
                  {s.value}
                </div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
                {s.pts !== undefined && <div className="text-xs text-primary mt-1">{s.pts} pts</div>}
                {'award' in s && s.award && (
                  <div className={`text-xs font-semibold mt-1 px-2 py-0.5 rounded-full inline-block ${AWARD_STYLE[s.award]}`}>{s.award}</div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Activity Statistics */}
      <Card>
        <CardHeader className="pb-3">
          <div className="space-y-3">
            <CardTitle className="text-base">Activity Statistics</CardTitle>
            {activities.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                {/* Week / Month toggle */}
                <div className="flex rounded-lg border overflow-hidden text-sm">
                  <button
                    className={`px-3 py-1.5 font-medium transition-colors ${graphView === 'week' ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground'}`}
                    onClick={() => setGraphView('week')}
                  >
                    Week
                  </button>
                  <button
                    className={`px-3 py-1.5 font-medium transition-colors ${graphView === 'month' ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground'}`}
                    onClick={() => setGraphView('month')}
                  >
                    Month
                  </button>
                </div>
                {/* Select stats */}
                <Dialog open={selectOpen} onOpenChange={setSelectOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 text-xs">
                      <SlidersHorizontal className="h-3.5 w-3.5 mr-1" />
                      Select Stats
                      {selectedStats.size > 0 && (
                        <span className="ml-1.5 bg-primary text-primary-foreground text-[10px] rounded-full px-1.5 py-0.5 leading-none">
                          {selectedStats.size}
                        </span>
                      )}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-sm mx-4">
                    <DialogHeader><DialogTitle>Select Statistics</DialogTitle></DialogHeader>
                    <div className="space-y-2 pt-2 max-h-[60dvh] overflow-y-auto">
                      {availableStats.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">No activities logged yet.</p>
                      ) : (
                        availableStats.map(stat => {
                          const isSelected = selectedStats.has(stat.id);
                          return (
                            <button
                              key={stat.id}
                              onClick={() => toggleStat(stat.id)}
                              className={`w-full flex items-center justify-between rounded-lg border p-3 text-left transition-colors ${
                                isSelected ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'
                              }`}
                            >
                              <div className="min-w-0 flex-1">
                                <div className="text-sm font-medium text-foreground">{stat.label}</div>
                                <div className="text-xs text-muted-foreground truncate">{stat.description}</div>
                              </div>
                              {isSelected && <Check className="h-4 w-4 text-primary shrink-0 ml-2" />}
                            </button>
                          );
                        })
                      )}
                    </div>
                    {selectedStats.size > 0 && (
                      <Button variant="ghost" size="sm" className="w-full mt-2 text-muted-foreground" onClick={() => setSelectedStats(new Set())}>
                        Clear all
                      </Button>
                    )}
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No activities logged yet.</p>
          ) : visibleStats.length === 0 ? (
            <div className="text-center py-8 space-y-3">
              <p className="text-sm text-muted-foreground">No statistics selected.</p>
              <Button variant="outline" size="sm" onClick={() => setSelectOpen(true)}>
                <SlidersHorizontal className="h-4 w-4 mr-1" /> Select Stats to Display
              </Button>
            </div>
          ) : (
            <div className="space-y-8">
              {visibleStats.map(stat => (
                <div key={stat.id}>
                  <p className="text-sm font-medium mb-2">{stat.label}</p>
                  {stat.render(graphData, graphView)}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
