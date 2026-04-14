import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { Calculator, Timer, Apple, Save, Trash2 } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, ReferenceLine, ReferenceArea,
} from 'recharts';

// ─── IPPT Scoring ─────────────────────────────────────────────────────────────

const PUSHUP_RAW = [[60,25,"","","","","","","","","","","","",""],[59,24,25,"","","","","","","","","","","",""],[58,24,24,25,"","","","","","","","","","",""],[57,24,24,24,25,"","","","","","","","","",""],[56,24,24,24,24,25,"","","","","","","","",""],[55,23,24,24,24,24,25,"","","","","","","",""],[54,23,23,24,24,24,24,25,"","","","","","",""],[53,23,23,23,24,24,24,24,25,"","","","","",""],[52,23,23,23,23,24,24,24,24,"","","","","",""],[51,22,23,23,23,23,24,24,24,25,"","","","",""],[50,22,22,23,23,23,23,24,24,24,"","","","",""],[49,22,22,22,23,23,23,23,24,24,25,"","","",""],[48,22,22,22,22,23,23,23,23,24,24,"","","",""],[47,21,22,22,22,22,23,23,23,24,24,25,"","",""],[46,21,21,22,22,22,22,23,23,23,24,24,"","",""],[45,21,21,21,22,22,22,22,23,23,24,24,25,"",""],[44,21,21,21,21,22,22,22,22,23,23,24,24,"",""],[43,20,21,21,21,21,22,22,22,23,23,24,24,25,""],[42,20,20,21,21,21,21,22,22,22,23,23,24,25,""],[41,20,20,20,21,21,21,21,22,22,23,23,24,24,25],[40,20,20,20,20,21,21,21,21,22,22,23,23,24,25],[39,19,20,20,20,20,21,21,21,22,22,23,23,24,24],[38,19,19,20,20,20,20,21,21,21,22,22,23,23,24],[37,19,19,19,20,20,20,20,21,21,22,22,22,23,24],[36,18,19,19,19,20,20,20,20,21,21,22,22,23,23],[35,18,18,19,19,19,20,20,20,21,21,21,22,22,23],[34,18,18,18,19,19,19,20,20,20,21,21,21,22,23],[33,17,18,18,18,19,19,19,20,20,20,21,21,22,22],[32,17,17,18,18,18,19,19,19,20,20,20,21,21,22],[31,17,17,17,18,18,18,19,19,19,20,20,20,21,22],[30,16,17,17,17,18,18,18,19,19,19,20,20,21,21],[29,16,16,17,17,17,18,18,18,19,19,19,20,20,21],[28,16,16,16,17,17,17,18,18,18,19,19,19,20,20],[27,15,16,16,16,17,17,17,18,18,18,19,19,19,20],[26,15,15,16,16,16,17,17,17,18,18,18,19,19,19],[25,14,15,15,16,16,16,17,17,17,18,18,18,19,19],[24,13,14,15,15,16,16,16,17,17,17,18,18,18,19],[23,12,13,14,15,15,16,16,16,17,17,17,18,18,18],[22,11,12,13,14,15,15,16,16,16,17,17,17,18,18],[21,10,11,12,13,14,15,15,16,16,16,17,17,17,18],[20,9,10,11,12,13,14,15,15,16,16,16,17,17,17],[19,8,9,10,11,12,13,14,15,15,16,16,16,17,17],[18,6,8,9,10,11,12,13,14,15,15,16,16,16,17],[17,4,6,8,9,10,11,12,13,14,15,15,16,16,16],[16,2,4,6,8,9,10,11,12,13,14,15,15,16,16],[15,1,2,4,6,8,9,10,11,12,13,14,15,15,16],[14,0,1,2,4,6,8,9,10,11,12,13,14,15,15]];
const SITUP_RAW  = [[60,25,"","","","","","","","","","","","",""],[59,24,25,"","","","","","","","","","","",""],[58,24,24,25,"","","","","","","","","","",""],[57,24,24,24,25,"","","","","","","","","",""],[56,24,24,24,24,25,"","","","","","","","",""],[55,23,24,24,24,24,25,"","","","","","","",""],[54,23,23,24,24,24,24,25,"","","","","","",""],[53,23,23,23,24,24,24,24,25,"","","","","",""],[52,23,23,23,23,24,24,24,24,"","","","","",""],[51,22,23,23,23,23,24,24,24,25,"","","","",""],[50,22,22,23,23,23,23,24,24,24,"","","","",""],[49,22,22,22,23,23,23,23,24,24,25,"","","",""],[48,22,22,22,22,23,23,23,23,24,24,"","","",""],[47,21,22,22,22,22,23,23,23,24,24,25,"","",""],[46,21,21,22,22,22,22,23,23,23,24,24,"","",""],[45,21,21,21,22,22,22,22,23,23,24,24,24,"",""],[44,21,21,21,21,22,22,22,22,23,23,24,24,25,""],[43,20,21,21,21,21,22,22,22,23,23,23,24,24,""],[42,20,20,21,21,21,21,22,22,22,23,23,24,24,25],[41,20,20,20,21,21,21,21,22,22,23,23,23,24,24],[40,20,20,20,20,21,21,21,21,22,22,23,23,24,24],[39,19,20,20,20,20,21,21,21,22,22,22,23,23,24],[38,19,19,20,20,20,20,21,21,21,22,22,23,23,23],[37,18,19,19,20,20,20,20,21,21,22,22,22,23,23],[36,18,18,19,19,20,20,20,20,21,21,22,22,22,23],[35,17,18,18,19,19,20,20,20,21,21,21,22,22,22],[34,16,17,18,18,19,19,20,20,20,21,21,21,22,22],[33,15,16,17,18,18,19,19,20,20,20,21,21,21,22],[32,14,15,16,17,18,18,19,19,20,20,20,21,21,21],[31,14,14,15,16,17,18,18,19,19,20,20,20,21,21],[30,13,14,14,15,16,17,18,18,19,19,20,20,20,21],[29,13,13,14,14,15,16,17,18,18,18,19,20,20,20],[28,12,13,13,14,14,15,16,17,18,18,19,19,20,20],[27,11,12,13,13,14,14,15,16,17,18,18,19,19,20],[26,10,11,12,13,13,14,14,15,16,17,18,18,19,19],[25,9,10,11,12,13,13,14,14,15,16,17,18,18,19],[24,8,9,10,11,12,13,13,14,14,15,16,17,18,18],[23,7,8,9,10,11,12,13,13,14,14,15,16,17,18],[22,7,7,8,9,10,11,12,13,13,14,14,15,16,17],[21,6,7,7,8,9,10,11,12,13,13,14,14,15,16],[20,6,6,7,7,8,9,10,11,12,13,13,14,14,15],[19,5,6,6,7,7,8,9,10,11,12,13,13,14,14],[18,4,5,6,6,7,7,8,9,10,11,12,13,13,14],[17,3,4,5,6,6,7,7,8,9,10,11,12,13,13],[16,2,3,4,5,6,6,7,7,8,9,10,11,12,13],[15,1,2,3,4,5,6,6,7,7,8,9,10,11,12],[14,0,1,2,3,4,5,6,6,7,7,8,9,10,11]];
const RUN_RAW = [["8:30",50],["8:40",49,50],["8:50",48,49,50],["9:00",47,48,49],["9:10",46,47,48,50],["9:20",45,46,47,49,50],["9:30",44,45,46,48,49,50],["9:40",43,44,45,47,48,49,50],["9:50",42,43,44,46,47,48,49,50],["10:00",41,42,43,45,46,47,48,49,50],["10:10",40,41,42,44,45,46,47,48,49,50],["10:20",39,40,41,43,44,45,46,47,48,49,50],["10:30",38,39,40,42,43,44,45,46,47,48,49,50],["10:40",38,38,39,41,42,43,44,45,46,47,48,49,50],["10:50",37,38,38,40,41,42,43,44,45,46,47,48,49,50],["11:00",37,37,38,39,40,41,42,43,44,45,46,47,48,49],["11:10",36,37,37,38,39,40,41,42,43,44,45,46,47,48],["11:20",36,36,37,38,38,39,40,41,42,43,44,45,46,47],["11:30",35,36,36,37,38,38,39,40,41,42,43,44,45,46],["11:40",35,35,36,37,37,38,38,39,40,41,42,43,44,45],["11:50",34,35,35,36,37,37,38,38,39,40,41,42,43,44],["12:00",33,34,35,36,36,37,37,38,38,39,40,41,42,43],["12:10",32,33,34,35,36,36,37,37,38,38,39,40,41,42],["12:20",31,32,33,35,35,36,36,37,37,38,38,39,40,41],["12:30",30,31,32,34,35,35,36,36,37,37,38,38,39,40],["12:40",29,30,31,33,34,35,35,36,36,37,37,38,38,39],["12:50",28,29,30,32,33,34,35,35,36,36,37,37,38,38],["13:00",27,28,29,31,32,33,34,35,35,36,36,37,37,38],["13:10",26,27,28,30,31,32,33,34,35,35,36,36,37,37],["13:20",25,26,27,29,30,31,32,33,34,35,35,36,36,37],["13:30",24,25,26,28,29,30,31,32,33,34,35,35,36,36],["13:40",23,24,25,27,28,29,30,31,32,33,34,35,35,36],["13:50",22,23,24,26,27,28,29,30,31,32,33,34,35,35],["14:00",21,22,23,25,26,27,28,29,30,31,32,33,34,35],["14:10",20,21,22,24,25,26,27,28,29,30,31,32,33,34],["14:20",19,20,21,23,24,25,26,27,28,29,30,31,32,33],["14:30",18,19,20,22,23,24,25,26,27,28,29,30,31,32],["14:40",16,18,19,21,22,23,24,25,26,27,28,29,30,31],["14:50",14,16,18,20,21,22,23,24,25,26,27,28,29,30],["15:00",12,14,16,19,20,21,22,23,24,25,26,27,28,29],["15:10",10,12,14,18,19,20,21,22,23,24,25,26,27,28],["15:20",8,10,12,16,18,19,20,21,22,23,24,25,26,27],["15:30",6,8,10,14,16,18,19,20,21,22,23,24,25,26],["15:40",4,6,8,12,14,16,18,19,20,21,22,23,24,25],["15:50",2,4,6,10,12,14,16,18,19,20,21,22,23,24],["16:00",1,2,4,8,10,12,14,16,18,19,20,21,22,23],["16:10",0,1,2,6,8,10,12,14,16,18,19,20,21,22]];

function getAgeGroupIdx(age: number): number {
  if (age < 22) return 0; if (age <= 24) return 1; if (age <= 27) return 2;
  if (age <= 30) return 3; if (age <= 33) return 4; if (age <= 36) return 5;
  if (age <= 39) return 6; if (age <= 42) return 7; if (age <= 45) return 8;
  if (age <= 48) return 9; if (age <= 51) return 10; if (age <= 54) return 11;
  if (age <= 57) return 12; return 13;
}
function buildMap(raw: (number|string)[][]): Map<number,number[]> {
  const m = new Map<number,number[]>();
  for (const row of raw) { const pts: number[] = []; for (let i=1;i<=14;i++){const v=row[i];pts.push(v===""||v===undefined?25:v as number);} m.set(row[0] as number,pts); }
  return m;
}
const PU_MAP = buildMap(PUSHUP_RAW);
const SU_MAP = buildMap(SITUP_RAW);
function timeToSec(t: string){const[m,s]=t.split(':').map(Number);return m*60+s;}
const RUN_TABLE:[number,number[]][] = (RUN_RAW as (string|number)[][]).map(row=>{const pts:number[]=[];for(let i=1;i<=14;i++){const v=row[i];pts.push(v===""||v===undefined?50:v as number);}return[timeToSec(row[0] as string),pts];});
function getPts(map:Map<number,number[]>,reps:number,idx:number){return(map.get(reps)??[])[idx]??0;}
function getRunPts(sec:number,idx:number){const r=Math.ceil(sec/10)*10;for(const[ms,pts]of RUN_TABLE){if(r<=ms)return pts[idx]??0;}return 0;}
function calcIppt(pu:number,su:number,runSec:number,age:number){
  const idx=getAgeGroupIdx(age);
  const puP=getPts(PU_MAP,pu,idx),suP=getPts(SU_MAP,su,idx),runP=getRunPts(runSec,idx);
  const total=puP+suP+runP;
  let award='Fail';
  if(puP>=1&&suP>=1&&runP>=1){if(total>=85)award='Gold';else if(total>=75)award='Silver';else if(total>=51)award='Pass';}
  return{total,award,pu:puP,su:suP,run:runP};
}

const IPPT_STYLE:Record<string,{badge:string;text:string}>={
  Gold:{badge:'bg-yellow-400 text-yellow-900',text:'text-yellow-500'},
  Silver:{badge:'bg-slate-300 text-slate-800',text:'text-slate-500'},
  Pass:{badge:'bg-green-100 text-green-800',text:'text-green-600'},
  Fail:{badge:'bg-red-100 text-red-800',text:'text-red-500'},
};
const AGE_GROUPS=[{label:'< 22',min:18,max:21},{label:'22–24',min:22,max:24},{label:'25–27',min:25,max:27},{label:'28–30',min:28,max:30},{label:'31–33',min:31,max:33},{label:'34–36',min:34,max:36},{label:'37–39',min:37,max:39},{label:'40–42',min:40,max:42},{label:'43–45',min:43,max:45},{label:'46–48',min:46,max:48},{label:'49–51',min:49,max:51},{label:'52–54',min:52,max:54},{label:'55–57',min:55,max:57},{label:'58–60',min:58,max:60}];
const fmtTime=(sec:number)=>`${Math.floor(sec/60)}:${String(sec%60).padStart(2,'0')}`;

// ─── BMI ──────────────────────────────────────────────────────────────────────

const BMI_CATS=[
  {label:'Underweight',min:0,   max:18.5,color:'#3b82f6',bg:'bg-blue-100',  text:'text-blue-700'  },
  {label:'Normal',     min:18.5,max:25,  color:'#22c55e',bg:'bg-green-100', text:'text-green-700' },
  {label:'Overweight', min:25,  max:30,  color:'#f97316',bg:'bg-orange-100',text:'text-orange-700'},
  {label:'Obese',      min:30,  max:100, color:'#ef4444',bg:'bg-red-100',   text:'text-red-700'   },
];
function getBmiCat(bmi:number){return BMI_CATS.find(c=>bmi>=c.min&&bmi<c.max)??BMI_CATS[3];}

// ─── Calorie ──────────────────────────────────────────────────────────────────

const ACTIVITY_LEVELS=[
  {value:'1.2',  label:'Sedentary (office job)'},
  {value:'1.375',label:'Lightly Active (1–3 days/week)'},
  {value:'1.55', label:'Moderately Active (3–5 days/week)'},
  {value:'1.725',label:'Very Active (6–7 days/week)'},
  {value:'1.9',  label:'Extra Active (physical job + training)'},
];

// ─── Types ────────────────────────────────────────────────────────────────────

type IpptResult={id:string;user_id:string;age:number;pushups:number;situps:number;run_seconds:number;pu_pts:number;su_pts:number;run_pts:number;total:number;award:string;created_at:string;};
type BmiResult={id:string;user_id:string;height_cm:number;weight_kg:number;bmi:number;category:string;created_at:string;};

type Tab = 'ippt' | 'bmi' | 'calorie';

// ─── Component ────────────────────────────────────────────────────────────────

export default function Calculators() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>('ippt');

  // ── IPPT state ───────────────────────────────────────────────────────────────
  const [ipptAge, setIpptAge] = useState(22);
  const [pushups, setPushups] = useState(30);
  const [situps, setSitups]   = useState(30);
  const [runSecs, setRunSecs] = useState(720); // seconds, 4:00–40:00
  const [ipptSaved, setIpptSaved] = useState<IpptResult[]>([]);
  const [ipptSaving, setIpptSaving] = useState(false);
  const [ipptDeleting, setIpptDeleting] = useState<string|null>(null);

  // ── BMI state ────────────────────────────────────────────────────────────────
  const [height, setHeight] = useState(170);
  const [weight, setWeight] = useState(70.0);
  const [bmiSaved, setBmiSaved] = useState<BmiResult[]>([]);
  const [bmiSaving, setBmiSaving] = useState(false);
  const [bmiDeleting, setBmiDeleting] = useState<string|null>(null);

  // ── Calorie state ────────────────────────────────────────────────────────────
  const [calGender, setCalGender] = useState('male');
  const [calAge, setCalAge] = useState('');
  const [calHeight, setCalHeight] = useState('');
  const [calWeight, setCalWeight] = useState('');
  const [calActivity, setCalActivity] = useState('1.55');
  const [calGoal, setCalGoal] = useState('maintain');
  const [calResult, setCalResult] = useState<{bmr:number;tdee:number;target:number}|null>(null);

  // Pre-fill from profile
  useEffect(() => {
    if (profile?.age) { setIpptAge(Math.min(60,Math.max(18,profile.age))); setCalAge(String(profile.age)); }
    if (profile?.height_cm) { setHeight(Math.min(220,Math.max(100,profile.height_cm))); setCalHeight(String(profile.height_cm)); }
  }, [profile]);

  useEffect(() => { if (user) { fetchIpptSaved(); fetchBmiSaved(); } }, [user]);

  const fetchIpptSaved = async () => {
    const { data } = await supabase.from('ippt_results').select('*').eq('user_id', user!.id).order('created_at', { ascending: true });
    if (data) setIpptSaved(data as IpptResult[]);
  };
  const fetchBmiSaved = async () => {
    const { data } = await supabase.from('bmi_results').select('*').eq('user_id', user!.id).order('created_at', { ascending: true });
    if (data) setBmiSaved(data as BmiResult[]);
  };

  // ── IPPT handlers ─────────────────────────────────────────────────────────────
  // Live IPPT result — no calculate button needed
  const ipptResult = calcIppt(pushups, situps, runSecs, ipptAge);
  const saveIppt = async () => {
    if(!user)return;
    setIpptSaving(true);
    const{error}=await supabase.from('ippt_results').insert({user_id:user.id,age:ipptAge,pushups,situps,run_seconds:runSecs,pu_pts:ipptResult.pu,su_pts:ipptResult.su,run_pts:ipptResult.run,total:ipptResult.total,award:ipptResult.award});
    setIpptSaving(false);
    if(error){toast({title:'Error saving',description:error.message,variant:'destructive'});}
    else{toast({title:'Result saved!'});fetchIpptSaved();}
  };
  const deleteIppt = async (id:string) => {
    setIpptDeleting(id);
    const{error}=await supabase.from('ippt_results').delete().eq('id',id);
    setIpptDeleting(null);
    if(error){toast({title:'Error deleting',description:error.message,variant:'destructive'});}
    else{toast({title:'Deleted'});fetchIpptSaved();}
  };

  // ── BMI handlers ──────────────────────────────────────────────────────────────
  // Live BMI
  const bmi = weight / ((height/100)**2);
  const saveBmi = async () => {
    if(!user)return;
    const cat=getBmiCat(bmi);
    setBmiSaving(true);
    const{error}=await supabase.from('bmi_results').insert({user_id:user.id,height_cm:height,weight_kg:weight,bmi:parseFloat(bmi.toFixed(2)),category:cat.label});
    setBmiSaving(false);
    if(error){toast({title:'Error saving',description:error.message,variant:'destructive'});}
    else{toast({title:'BMI saved!'});fetchBmiSaved();}
  };
  const deleteBmi = async (id:string) => {
    setBmiDeleting(id);
    const{error}=await supabase.from('bmi_results').delete().eq('id',id);
    setBmiDeleting(null);
    if(error){toast({title:'Error deleting',description:error.message,variant:'destructive'});}
    else{toast({title:'Deleted'});fetchBmiSaved();}
  };

  // ── Calorie handler ───────────────────────────────────────────────────────────
  const calculateCalories = () => {
    const a=parseInt(calAge)||0,h=parseFloat(calHeight)||0,w=parseFloat(calWeight)||0;
    if(!a||!h||!w){toast({title:'Fill in all fields',variant:'destructive'});return;}
    const bmr=calGender==='male'?10*w+6.25*h-5*a+5:10*w+6.25*h-5*a-161;
    const tdee=bmr*parseFloat(calActivity);
    const target=calGoal==='lose'?tdee-500:calGoal==='gain'?tdee+500:tdee;
    setCalResult({bmr:Math.round(bmr),tdee:Math.round(tdee),target:Math.round(target)});
  };

  // ── Graph data ────────────────────────────────────────────────────────────────
  const ipptGraph = ipptSaved.map((r,i)=>({name:new Date(r.created_at).toLocaleDateString('en-SG',{day:'numeric',month:'short'}),attempt:i+1,total:r.total,pushups:r.pu_pts,situps:r.su_pts,run:r.run_pts}));
  const bmiGraph  = bmiSaved.map(r=>({name:new Date(r.created_at).toLocaleDateString('en-SG',{day:'numeric',month:'short'}),bmi:r.bmi,weight:r.weight_kg}));

  const bmiCat = getBmiCat(bmi);
  const bmiPct = Math.min(100,Math.max(0,((bmi-10)/30)*100));
  const fmtRunTime=(s:number)=>`${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;
  const ageGroupLabel=(a:number)=>AGE_GROUPS.find(g=>a>=g.min&&a<=g.max)?.label??`Age ${a}`;

  const TABS: {id: Tab; label: string; icon: React.ReactNode}[] = [
    { id: 'ippt',    label: 'IPPT',    icon: <Timer className="h-4 w-4" /> },
    { id: 'bmi',     label: 'BMI',     icon: <Calculator className="h-4 w-4" /> },
    { id: 'calorie', label: 'Calorie', icon: <Apple className="h-4 w-4" /> },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center gap-3">
        <Calculator className="h-7 w-7 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Calculators</h1>
      </div>

      {/* Tab switcher */}
      <div className="flex rounded-xl border overflow-hidden">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors ${
              tab === t.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-background text-muted-foreground hover:bg-muted'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* ── IPPT TAB ─────────────────────────────────────────────────────────── */}
      {tab === 'ippt' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>IPPT Score Calculator</CardTitle>
              <CardDescription>Official SAF scoring — results vary by age group</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Age */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <Label>Age <span className="text-xs font-normal text-muted-foreground">({ageGroupLabel(ipptAge)})</span></Label>
                  <input type="number" min={18} max={60} value={ipptAge}
                    onChange={e=>setIpptAge(Math.min(60,Math.max(18,parseInt(e.target.value)||18)))}
                    className="w-20 rounded-md border border-input bg-background px-2 py-1 text-sm text-right font-bold tabular-nums focus:outline-none focus:ring-1 focus:ring-ring" />
                </div>
                <Slider min={18} max={60} step={1} value={[ipptAge]} onValueChange={([v])=>setIpptAge(v)} />
                <div className="flex justify-between text-xs text-muted-foreground"><span>18</span><span>60</span></div>
              </div>
              {/* Push-ups */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <Label>Push-ups <span className="text-xs font-normal text-muted-foreground">(max 25 pts)</span></Label>
                  <input type="number" min={0} max={100} value={pushups}
                    onChange={e=>setPushups(Math.min(100,Math.max(0,parseInt(e.target.value)||0)))}
                    className="w-20 rounded-md border border-input bg-background px-2 py-1 text-sm text-right font-bold tabular-nums focus:outline-none focus:ring-1 focus:ring-ring" />
                </div>
                <Slider min={0} max={100} step={1} value={[pushups]} onValueChange={([v])=>setPushups(v)} />
                <div className="flex justify-between text-xs text-muted-foreground"><span>0</span><span>100</span></div>
              </div>
              {/* Sit-ups */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <Label>Sit-ups <span className="text-xs font-normal text-muted-foreground">(max 25 pts)</span></Label>
                  <input type="number" min={0} max={100} value={situps}
                    onChange={e=>setSitups(Math.min(100,Math.max(0,parseInt(e.target.value)||0)))}
                    className="w-20 rounded-md border border-input bg-background px-2 py-1 text-sm text-right font-bold tabular-nums focus:outline-none focus:ring-1 focus:ring-ring" />
                </div>
                <Slider min={0} max={100} step={1} value={[situps]} onValueChange={([v])=>setSitups(v)} />
                <div className="flex justify-between text-xs text-muted-foreground"><span>0</span><span>100</span></div>
              </div>
              {/* Run — type MM:SS, slider in seconds per-second */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <Label>2.4km Run <span className="text-xs font-normal text-muted-foreground">(max 50 pts)</span></Label>
                  <div className="flex items-center gap-1">
                    <input type="number" min={0} max={39} value={Math.floor(runSecs/60)}
                      onChange={e=>{const m=Math.min(39,Math.max(0,parseInt(e.target.value)||0));setRunSecs(Math.min(2400,Math.max(240,m*60+(runSecs%60))));}}
                      className="w-14 rounded-md border border-input bg-background px-2 py-1 text-sm text-right font-bold tabular-nums focus:outline-none focus:ring-1 focus:ring-ring" />
                    <span className="text-muted-foreground font-bold">:</span>
                    <input type="number" min={0} max={59} value={String(runSecs%60).padStart(2,'0')}
                      onChange={e=>{const s=Math.min(59,Math.max(0,parseInt(e.target.value)||0));setRunSecs(Math.min(2400,Math.max(240,Math.floor(runSecs/60)*60+s)));}}
                      className="w-14 rounded-md border border-input bg-background px-2 py-1 text-sm text-right font-bold tabular-nums focus:outline-none focus:ring-1 focus:ring-ring" />
                    <span className="text-xs text-muted-foreground">mm:ss</span>
                  </div>
                </div>
                <Slider min={240} max={2400} step={1} value={[runSecs]} onValueChange={([v])=>setRunSecs(v)} />
                <div className="flex justify-between text-xs text-muted-foreground"><span>4:00 (fastest)</span><span>40:00 (slowest)</span></div>
              </div>

              {/* Live result — always shown */}
              {(() => {
                const style=IPPT_STYLE[ipptResult.award];
                return (
                  <div className="rounded-xl border p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className={`text-5xl font-bold ${style.text}`}>{ipptResult.total}</div>
                        <div className="text-sm text-muted-foreground mt-1">out of 100</div>
                      </div>
                      <span className={`text-sm font-bold px-4 py-2 rounded-full ${style.badge}`}>{ipptResult.award}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        {label:'Push-ups',pts:ipptResult.pu,max:25,value:pushups},
                        {label:'Sit-ups', pts:ipptResult.su,max:25,value:situps},
                        {label:'2.4km Run',pts:ipptResult.run,max:50,value:fmtRunTime(runSecs)},
                      ].map(s=>(
                        <div key={s.label} className="rounded-lg bg-muted p-3 text-center">
                          <div className="text-xs text-muted-foreground mb-1">{s.label}</div>
                          <div className="text-lg font-bold">{s.value}</div>
                          <div className={`text-xs font-semibold mt-1 ${s.pts<1?'text-red-500':'text-primary'}`}>{s.pts}/{s.max} pts</div>
                          <div className="mt-2 h-1.5 rounded-full bg-border overflow-hidden">
                            <div className="h-full rounded-full" style={{width:`${(s.pts/s.max)*100}%`,backgroundColor:s.pts<1?'#ef4444':s.pts===s.max?'#eab308':'#3b82f6'}} />
                          </div>
                        </div>
                      ))}
                    </div>
                    {ipptResult.award!=='Gold'&&ipptResult.award!=='Fail'&&(
                      <p className="text-xs text-muted-foreground text-center">{ipptResult.award==='Silver'?`${85-ipptResult.total} more pts for Gold`:`${75-ipptResult.total} more pts for Silver`}</p>
                    )}
                    {ipptResult.award==='Fail'&&(
                      <p className="text-xs text-red-500 text-center">{ipptResult.pu<1||ipptResult.su<1||ipptResult.run<1?'Must score at least 1 point in every station to pass':`${51-ipptResult.total} more pts needed to pass`}</p>
                    )}
                    <Button onClick={saveIppt} disabled={ipptSaving} variant="outline" className="w-full">
                      <Save className="h-4 w-4 mr-2"/>{ipptSaving?'Saving...':'Save Result'}
                    </Button>
                  </div>
                );
              })()
            }
            </CardContent>
          </Card>

          {ipptSaved.length>0&&(
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Timer className="h-5 w-5 text-primary"/>Saved Results</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {ipptSaved.length>1&&(
                  <div className="space-y-6">
                    <div>
                      <p className="text-sm font-medium mb-2">Total Score Over Time</p>
                      <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={ipptGraph}>
                          <CartesianGrid strokeDasharray="3 3"/>
                          <XAxis dataKey="name" tick={{fontSize:10}}/>
                          <YAxis domain={[0,100]} tick={{fontSize:10}}/>
                          <Tooltip/>
                          <ReferenceLine y={85} stroke="#eab308" strokeDasharray="4 4" label={{value:'Gold',fill:'#eab308',fontSize:10}}/>
                          <ReferenceLine y={75} stroke="#94a3b8" strokeDasharray="4 4" label={{value:'Silver',fill:'#94a3b8',fontSize:10}}/>
                          <ReferenceLine y={51} stroke="#22c55e" strokeDasharray="4 4" label={{value:'Pass',fill:'#22c55e',fontSize:10}}/>
                          <Line type="monotone" dataKey="total" name="Total" stroke="#3b82f6" strokeWidth={2} dot={{r:4}}/>
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-2">Station Scores Over Time</p>
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={ipptGraph}>
                          <CartesianGrid strokeDasharray="3 3"/>
                          <XAxis dataKey="name" tick={{fontSize:10}}/>
                          <YAxis tick={{fontSize:10}}/>
                          <Tooltip/><Legend/>
                          <Line type="monotone" dataKey="pushups" name="Push-ups" stroke="#8b5cf6" strokeWidth={2} dot={{r:3}}/>
                          <Line type="monotone" dataKey="situps"  name="Sit-ups"  stroke="#10b981" strokeWidth={2} dot={{r:3}}/>
                          <Line type="monotone" dataKey="run"     name="2.4km Run" stroke="#f97316" strokeWidth={2} dot={{r:3}}/>
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  {ipptSaved.slice().reverse().map(r=>{
                    const style=IPPT_STYLE[r.award]??IPPT_STYLE['Fail'];
                    return(
                      <div key={r.id} className="flex items-center justify-between rounded-lg border p-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold">{new Date(r.created_at).toLocaleDateString('en-SG',{day:'numeric',month:'short',year:'numeric'})}</span>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${style.badge}`}>{r.award}</span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">Age {r.age} · PU:{r.pushups}({r.pu_pts}pts) · SU:{r.situps}({r.su_pts}pts) · Run:{fmtTime(r.run_seconds)}({r.run_pts}pts)</div>
                        </div>
                        <div className="flex items-center gap-3 ml-3">
                          <div className={`text-2xl font-bold ${style.text}`}>{r.total}</div>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" disabled={ipptDeleting===r.id} onClick={()=>deleteIppt(r.id)}>
                            <Trash2 className="h-4 w-4"/>
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ── BMI TAB ──────────────────────────────────────────────────────────── */}
      {tab === 'bmi' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>BMI Calculator</CardTitle>
              <CardDescription>Body Mass Index based on height and weight</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Height */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <Label>Height</Label>
                  <div className="flex items-center gap-1">
                    <input type="number" min={100} max={220} value={height}
                      onChange={e=>setHeight(Math.min(220,Math.max(100,parseInt(e.target.value)||100)))}
                      className="w-20 rounded-md border border-input bg-background px-2 py-1 text-sm text-right font-bold tabular-nums focus:outline-none focus:ring-1 focus:ring-ring" />
                    <span className="text-xs text-muted-foreground">cm</span>
                  </div>
                </div>
                <Slider min={100} max={220} step={1} value={[height]} onValueChange={([v])=>setHeight(v)} />
                <div className="flex justify-between text-xs text-muted-foreground"><span>100</span><span>220</span></div>
              </div>
              {/* Weight */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <Label>Weight</Label>
                  <div className="flex items-center gap-1">
                    <input type="number" min={30} max={200} step={0.1} value={weight}
                      onChange={e=>setWeight(Math.min(200,Math.max(30,parseFloat(e.target.value)||30)))}
                      className="w-20 rounded-md border border-input bg-background px-2 py-1 text-sm text-right font-bold tabular-nums focus:outline-none focus:ring-1 focus:ring-ring" />
                    <span className="text-xs text-muted-foreground">kg</span>
                  </div>
                </div>
                <Slider min={30} max={200} step={0.1} value={[weight]} onValueChange={([v])=>setWeight(parseFloat(v.toFixed(1)))} />
                <div className="flex justify-between text-xs text-muted-foreground"><span>30</span><span>200</span></div>
              </div>

              {(
                <div className="rounded-xl border p-5 space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className={`text-5xl font-bold ${bmiCat.text}`}>{bmi.toFixed(1)}</div>
                      <div className="text-sm text-muted-foreground mt-1">kg/m²</div>
                    </div>
                    <span className={`text-sm font-bold px-4 py-2 rounded-full ${bmiCat.bg} ${bmiCat.text}`}>{bmiCat.label}</span>
                  </div>
                  <div className="space-y-1">
                    <div className="relative h-4 rounded-full overflow-hidden flex">
                      <div className="flex-none w-[28.3%] bg-blue-400"/>
                      <div className="flex-none w-[21.7%] bg-green-400"/>
                      <div className="flex-none w-[16.7%] bg-orange-400"/>
                      <div className="flex-1 bg-red-400"/>
                      <div className="absolute top-0 bottom-0 w-0.5 bg-white shadow-md" style={{left:`${bmiPct}%`}}/>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground px-0.5">
                      <span>10</span><span>18.5</span><span>25</span><span>30</span><span>40+</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-xs">
                    {BMI_CATS.map(c=>(
                      <div key={c.label} className={`rounded-lg p-2 text-center ${bmiCat.label===c.label?`${c.bg} ${c.text} font-semibold`:'bg-muted text-muted-foreground'}`}>
                        <div className="font-medium">{c.label}</div>
                        <div className="opacity-70">{c.max===100?'≥ 30':`${c.min}–${c.max}`}</div>
                      </div>
                    ))}
                  </div>
                  {(()=>{const h=height/100;return(<p className="text-xs text-muted-foreground text-center">Healthy weight for {height}cm: <span className="font-medium text-foreground">{(18.5*h*h).toFixed(1)} – {(24.9*h*h).toFixed(1)} kg</span></p>);})()}
                  <Button onClick={saveBmi} disabled={bmiSaving} variant="outline" className="w-full">
                    <Save className="h-4 w-4 mr-2"/>{bmiSaving?'Saving...':'Save Result'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {bmiSaved.length>0&&(
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Calculator className="h-5 w-5 text-primary"/>BMI History</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {bmiSaved.length>1&&(
                  <div className="space-y-6">
                    <div>
                      <p className="text-sm font-medium mb-2">BMI Over Time</p>
                      <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={bmiGraph}>
                          <CartesianGrid strokeDasharray="3 3"/>
                          <XAxis dataKey="name" tick={{fontSize:10}}/>
                          <YAxis domain={[10,40]} tick={{fontSize:10}}/>
                          <Tooltip formatter={(v:number)=>v.toFixed(1)}/>
                          <ReferenceArea y1={0}    y2={18.5} fill="#3b82f6" fillOpacity={0.05}/>
                          <ReferenceArea y1={18.5} y2={25}   fill="#22c55e" fillOpacity={0.08}/>
                          <ReferenceArea y1={25}   y2={30}   fill="#f97316" fillOpacity={0.05}/>
                          <ReferenceArea y1={30}   y2={100}  fill="#ef4444" fillOpacity={0.05}/>
                          <ReferenceLine y={18.5} stroke="#22c55e" strokeDasharray="4 4"/>
                          <ReferenceLine y={25}   stroke="#f97316" strokeDasharray="4 4"/>
                          <ReferenceLine y={30}   stroke="#ef4444" strokeDasharray="4 4"/>
                          <Line type="monotone" dataKey="bmi" name="BMI" stroke="#3b82f6" strokeWidth={2} dot={{r:4}}/>
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-2">Weight Over Time (kg)</p>
                      <ResponsiveContainer width="100%" height={180}>
                        <LineChart data={bmiGraph}>
                          <CartesianGrid strokeDasharray="3 3"/>
                          <XAxis dataKey="name" tick={{fontSize:10}}/>
                          <YAxis tick={{fontSize:10}}/>
                          <Tooltip/>
                          <Line type="monotone" dataKey="weight" name="Weight (kg)" stroke="#8b5cf6" strokeWidth={2} dot={{r:4}}/>
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  {bmiSaved.slice().reverse().map(r=>{
                    const cat=BMI_CATS.find(c=>c.label===r.category)??BMI_CATS[3];
                    return(
                      <div key={r.id} className="flex items-center justify-between rounded-lg border p-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold">{new Date(r.created_at).toLocaleDateString('en-SG',{day:'numeric',month:'short',year:'numeric'})}</span>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cat.bg} ${cat.text}`}>{r.category}</span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">{r.height_cm}cm · {r.weight_kg}kg</div>
                        </div>
                        <div className="flex items-center gap-3 ml-3">
                          <div className={`text-2xl font-bold ${cat.text}`}>{r.bmi.toFixed(1)}</div>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" disabled={bmiDeleting===r.id} onClick={()=>deleteBmi(r.id)}>
                            <Trash2 className="h-4 w-4"/>
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ── CALORIE TAB ───────────────────────────────────────────────────────── */}
      {tab === 'calorie' && (
        <Card>
          <CardHeader>
            <CardTitle>Calorie Calculator</CardTitle>
            <CardDescription>Calculate your daily calorie needs using the Mifflin-St Jeor equation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Gender</Label>
                <Select value={calGender} onValueChange={setCalGender}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Age</Label>
                <Input type="number" placeholder="25" value={calAge} onChange={e=>setCalAge(e.target.value)}/>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Height (cm)</Label>
                <Input type="number" placeholder="175" value={calHeight} onChange={e=>setCalHeight(e.target.value)}/>
              </div>
              <div className="space-y-2">
                <Label>Weight (kg)</Label>
                <Input type="number" placeholder="70" value={calWeight} onChange={e=>setCalWeight(e.target.value)}/>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Activity Level</Label>
              <Select value={calActivity} onValueChange={setCalActivity}>
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent>
                  {ACTIVITY_LEVELS.map(l=><SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Goal</Label>
              <Select value={calGoal} onValueChange={setCalGoal}>
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="lose">Lose Weight (−500 cal/day)</SelectItem>
                  <SelectItem value="maintain">Maintain Weight</SelectItem>
                  <SelectItem value="gain">Gain Weight (+500 cal/day)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={calculateCalories} className="w-full">Calculate</Button>
            {calResult&&(
              <div className="rounded-xl border p-5 space-y-4">
                <div className="grid grid-cols-3 gap-3 text-center">
                  {[
                    {label:'BMR',value:calResult.bmr,sub:'Base metabolic rate',color:'text-foreground'},
                    {label:'TDEE',value:calResult.tdee,sub:'Total daily energy',color:'text-foreground'},
                    {label:'Target',value:calResult.target,sub:calGoal==='lose'?'To lose weight':calGoal==='gain'?'To gain weight':'To maintain',color:'text-primary'},
                  ].map(s=>(
                    <div key={s.label} className="rounded-lg bg-muted p-3">
                      <div className="text-xs text-muted-foreground mb-1">{s.label}</div>
                      <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                      <div className="text-xs text-muted-foreground mt-1">{s.sub}</div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  {calGoal==='lose'?'Eating ~500 cal below TDEE leads to ~0.5kg loss per week':calGoal==='gain'?'Eating ~500 cal above TDEE leads to ~0.5kg gain per week':'Eating at TDEE maintains your current weight'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
