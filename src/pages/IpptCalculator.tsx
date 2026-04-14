import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { Timer, Trophy, Save, Trash2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

const PUSHUP_RAW = [[60,25,"","","","","","","","","","","","",""],[59,24,25,"","","","","","","","","","","",""],[58,24,24,25,"","","","","","","","","","",""],[57,24,24,24,25,"","","","","","","","","",""],[56,24,24,24,24,25,"","","","","","","","",""],[55,23,24,24,24,24,25,"","","","","","","",""],[54,23,23,24,24,24,24,25,"","","","","","",""],[53,23,23,23,24,24,24,24,25,"","","","","",""],[52,23,23,23,23,24,24,24,24,"","","","","",""],[51,22,23,23,23,23,24,24,24,25,"","","","",""],[50,22,22,23,23,23,23,24,24,24,"","","","",""],[49,22,22,22,23,23,23,23,24,24,25,"","","",""],[48,22,22,22,22,23,23,23,23,24,24,"","","",""],[47,21,22,22,22,22,23,23,23,24,24,25,"","",""],[46,21,21,22,22,22,22,23,23,23,24,24,"","",""],[45,21,21,21,22,22,22,22,23,23,24,24,25,"",""],[44,21,21,21,21,22,22,22,22,23,23,24,24,"",""],[43,20,21,21,21,21,22,22,22,23,23,24,24,25,""],[42,20,20,21,21,21,21,22,22,22,23,23,24,25,""],[41,20,20,20,21,21,21,21,22,22,23,23,24,24,25],[40,20,20,20,20,21,21,21,21,22,22,23,23,24,25],[39,19,20,20,20,20,21,21,21,22,22,23,23,24,24],[38,19,19,20,20,20,20,21,21,21,22,22,23,23,24],[37,19,19,19,20,20,20,20,21,21,22,22,22,23,24],[36,18,19,19,19,20,20,20,20,21,21,22,22,23,23],[35,18,18,19,19,19,20,20,20,21,21,21,22,22,23],[34,18,18,18,19,19,19,20,20,20,21,21,21,22,23],[33,17,18,18,18,19,19,19,20,20,20,21,21,22,22],[32,17,17,18,18,18,19,19,19,20,20,20,21,21,22],[31,17,17,17,18,18,18,19,19,19,20,20,20,21,22],[30,16,17,17,17,18,18,18,19,19,19,20,20,21,21],[29,16,16,17,17,17,18,18,18,19,19,19,20,20,21],[28,16,16,16,17,17,17,18,18,18,19,19,19,20,20],[27,15,16,16,16,17,17,17,18,18,18,19,19,19,20],[26,15,15,16,16,16,17,17,17,18,18,18,19,19,19],[25,14,15,15,16,16,16,17,17,17,18,18,18,19,19],[24,13,14,15,15,16,16,16,17,17,17,18,18,18,19],[23,12,13,14,15,15,16,16,16,17,17,17,18,18,18],[22,11,12,13,14,15,15,16,16,16,17,17,17,18,18],[21,10,11,12,13,14,15,15,16,16,16,17,17,17,18],[20,9,10,11,12,13,14,15,15,16,16,16,17,17,17],[19,8,9,10,11,12,13,14,15,15,16,16,16,17,17],[18,6,8,9,10,11,12,13,14,15,15,16,16,16,17],[17,4,6,8,9,10,11,12,13,14,15,15,16,16,16],[16,2,4,6,8,9,10,11,12,13,14,15,15,16,16],[15,1,2,4,6,8,9,10,11,12,13,14,15,15,16],[14,0,1,2,4,6,8,9,10,11,12,13,14,15,15]];
const SITUP_RAW  = [[60,25,"","","","","","","","","","","","",""],[59,24,25,"","","","","","","","","","","",""],[58,24,24,25,"","","","","","","","","","",""],[57,24,24,24,25,"","","","","","","","","",""],[56,24,24,24,24,25,"","","","","","","","",""],[55,23,24,24,24,24,25,"","","","","","","",""],[54,23,23,24,24,24,24,25,"","","","","","",""],[53,23,23,23,24,24,24,24,25,"","","","","",""],[52,23,23,23,23,24,24,24,24,"","","","","",""],[51,22,23,23,23,23,24,24,24,25,"","","","",""],[50,22,22,23,23,23,23,24,24,24,"","","","",""],[49,22,22,22,23,23,23,23,24,24,25,"","","",""],[48,22,22,22,22,23,23,23,23,24,24,"","","",""],[47,21,22,22,22,22,23,23,23,24,24,25,"","",""],[46,21,21,22,22,22,22,23,23,23,24,24,"","",""],[45,21,21,21,22,22,22,22,23,23,24,24,24,"",""],[44,21,21,21,21,22,22,22,22,23,23,24,24,25,""],[43,20,21,21,21,21,22,22,22,23,23,23,24,24,""],[42,20,20,21,21,21,21,22,22,22,23,23,24,24,25],[41,20,20,20,21,21,21,21,22,22,23,23,23,24,24],[40,20,20,20,20,21,21,21,21,22,22,23,23,24,24],[39,19,20,20,20,20,21,21,21,22,22,22,23,23,24],[38,19,19,20,20,20,20,21,21,21,22,22,23,23,23],[37,18,19,19,20,20,20,20,21,21,22,22,22,23,23],[36,18,18,19,19,20,20,20,20,21,21,22,22,22,23],[35,17,18,18,19,19,20,20,20,21,21,21,22,22,22],[34,16,17,18,18,19,19,20,20,20,21,21,21,22,22],[33,15,16,17,18,18,19,19,20,20,20,21,21,21,22],[32,14,15,16,17,18,18,19,19,20,20,20,21,21,21],[31,14,14,15,16,17,18,18,19,19,20,20,20,21,21],[30,13,14,14,15,16,17,18,18,19,19,20,20,20,21],[29,13,13,14,14,15,16,17,18,18,18,19,20,20,20],[28,12,13,13,14,14,15,16,17,18,18,19,19,20,20],[27,11,12,13,13,14,14,15,16,17,18,18,19,19,20],[26,10,11,12,13,13,14,14,15,16,17,18,18,19,19],[25,9,10,11,12,13,13,14,14,15,16,17,18,18,19],[24,8,9,10,11,12,13,13,14,14,15,16,17,18,18],[23,7,8,9,10,11,12,13,13,14,14,15,16,17,18],[22,7,7,8,9,10,11,12,13,13,14,14,15,16,17],[21,6,7,7,8,9,10,11,12,13,13,14,14,15,16],[20,6,6,7,7,8,9,10,11,12,13,13,14,14,15],[19,5,6,6,7,7,8,9,10,11,12,13,13,14,14],[18,4,5,6,6,7,7,8,9,10,11,12,13,13,14],[17,3,4,5,6,6,7,7,8,9,10,11,12,13,13],[16,2,3,4,5,6,6,7,7,8,9,10,11,12,13],[15,1,2,3,4,5,6,6,7,7,8,9,10,11,12],[14,0,1,2,3,4,5,6,6,7,7,8,9,10,11]];
const RUN_RAW_DATA = [["8:30",50],["8:40",49,50],["8:50",48,49,50],["9:00",47,48,49],["9:10",46,47,48,50],["9:20",45,46,47,49,50],["9:30",44,45,46,48,49,50],["9:40",43,44,45,47,48,49,50],["9:50",42,43,44,46,47,48,49,50],["10:00",41,42,43,45,46,47,48,49,50],["10:10",40,41,42,44,45,46,47,48,49,50],["10:20",39,40,41,43,44,45,46,47,48,49,50],["10:30",38,39,40,42,43,44,45,46,47,48,49,50],["10:40",38,38,39,41,42,43,44,45,46,47,48,49,50],["10:50",37,38,38,40,41,42,43,44,45,46,47,48,49,50],["11:00",37,37,38,39,40,41,42,43,44,45,46,47,48,49],["11:10",36,37,37,38,39,40,41,42,43,44,45,46,47,48],["11:20",36,36,37,38,38,39,40,41,42,43,44,45,46,47],["11:30",35,36,36,37,38,38,39,40,41,42,43,44,45,46],["11:40",35,35,36,37,37,38,38,39,40,41,42,43,44,45],["11:50",34,35,35,36,37,37,38,38,39,40,41,42,43,44],["12:00",33,34,35,36,36,37,37,38,38,39,40,41,42,43],["12:10",32,33,34,35,36,36,37,37,38,38,39,40,41,42],["12:20",31,32,33,35,35,36,36,37,37,38,38,39,40,41],["12:30",30,31,32,34,35,35,36,36,37,37,38,38,39,40],["12:40",29,30,31,33,34,35,35,36,36,37,37,38,38,39],["12:50",28,29,30,32,33,34,35,35,36,36,37,37,38,38],["13:00",27,28,29,31,32,33,34,35,35,36,36,37,37,38],["13:10",26,27,28,30,31,32,33,34,35,35,36,36,37,37],["13:20",25,26,27,29,30,31,32,33,34,35,35,36,36,37],["13:30",24,25,26,28,29,30,31,32,33,34,35,35,36,36],["13:40",23,24,25,27,28,29,30,31,32,33,34,35,35,36],["13:50",22,23,24,26,27,28,29,30,31,32,33,34,35,35],["14:00",21,22,23,25,26,27,28,29,30,31,32,33,34,35],["14:10",20,21,22,24,25,26,27,28,29,30,31,32,33,34],["14:20",19,20,21,23,24,25,26,27,28,29,30,31,32,33],["14:30",18,19,20,22,23,24,25,26,27,28,29,30,31,32],["14:40",16,18,19,21,22,23,24,25,26,27,28,29,30,31],["14:50",14,16,18,20,21,22,23,24,25,26,27,28,29,30],["15:00",12,14,16,19,20,21,22,23,24,25,26,27,28,29],["15:10",10,12,14,18,19,20,21,22,23,24,25,26,27,28],["15:20",8,10,12,16,18,19,20,21,22,23,24,25,26,27],["15:30",6,8,10,14,16,18,19,20,21,22,23,24,25,26],["15:40",4,6,8,12,14,16,18,19,20,21,22,23,24,25],["15:50",2,4,6,10,12,14,16,18,19,20,21,22,23,24],["16:00",1,2,4,8,10,12,14,16,18,19,20,21,22,23],["16:10",0,1,2,6,8,10,12,14,16,18,19,20,21,22]];

function getAgeGroupIdx(age: number): number { if(age<22)return 0;if(age<=24)return 1;if(age<=27)return 2;if(age<=30)return 3;if(age<=33)return 4;if(age<=36)return 5;if(age<=39)return 6;if(age<=42)return 7;if(age<=45)return 8;if(age<=48)return 9;if(age<=51)return 10;if(age<=54)return 11;if(age<=57)return 12;return 13; }
function buildMap(raw:(number|string)[][]){const m=new Map<number,number[]>();for(const row of raw){const pts:number[]=[];for(let i=1;i<=14;i++){const v=row[i];pts.push(v===""||v===undefined?25:v as number);}m.set(row[0] as number,pts);}return m;}
const PU_MAP=buildMap(PUSHUP_RAW),SU_MAP=buildMap(SITUP_RAW);
function timeToSec(t:string){const[m,s]=t.split(':').map(Number);return m*60+s;}
const RUN_TABLE:[number,number[]][]=(RUN_RAW_DATA as (string|number)[][]).map(row=>{const pts:number[]=[];for(let i=1;i<=14;i++){const v=row[i];pts.push(v===""||v===undefined?50:v as number);}return[timeToSec(row[0] as string),pts];});
function getPts(map:Map<number,number[]>,reps:number,idx:number){return(map.get(reps)??[])[idx]??0;}
function getRunPts(sec:number,idx:number){const r=Math.ceil(sec/10)*10;for(const[ms,pts]of RUN_TABLE){if(r<=ms)return pts[idx]??0;}return 0;}
function calcIppt(pu:number,su:number,runSec:number,age:number){const idx=getAgeGroupIdx(age);const puP=getPts(PU_MAP,pu,idx),suP=getPts(SU_MAP,su,idx),runP=getRunPts(runSec,idx);const total=puP+suP+runP;let award='Fail';if(puP>=1&&suP>=1&&runP>=1){if(total>=85)award='Gold';else if(total>=75)award='Silver';else if(total>=51)award='Pass';}return{total,award,pu:puP,su:suP,run:runP};}

const AWARD_STYLE:Record<string,{badge:string;text:string}>={Gold:{badge:'bg-yellow-400 text-yellow-900',text:'text-yellow-500'},Silver:{badge:'bg-slate-300 text-slate-800',text:'text-slate-500'},Pass:{badge:'bg-green-100 text-green-800',text:'text-green-600'},Fail:{badge:'bg-red-100 text-red-800',text:'text-red-500'}};
const fmtTime=(sec:number)=>`${Math.floor(sec/60)}:${String(sec%60).padStart(2,'0')}`;
const AGE_GROUPS=[{label:'< 22',min:18,max:21},{label:'22–24',min:22,max:24},{label:'25–27',min:25,max:27},{label:'28–30',min:28,max:30},{label:'31–33',min:31,max:33},{label:'34–36',min:34,max:36},{label:'37–39',min:37,max:39},{label:'40–42',min:40,max:42},{label:'43–45',min:43,max:45},{label:'46–48',min:46,max:48},{label:'49–51',min:49,max:51},{label:'52–54',min:52,max:54},{label:'55–57',min:55,max:57},{label:'58–60',min:58,max:60}];

type SavedResult={id:string;user_id:string;age:number;pushups:number;situps:number;run_seconds:number;pu_pts:number;su_pts:number;run_pts:number;total:number;award:string;created_at:string;};

function SliderField({ label, value, min, max, step=1, onChange, display }: { label:string;value:number;min:number;max:number;step?:number;onChange:(v:number)=>void;display?:string; }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm">{label}</Label>
        <span className="text-sm font-bold text-primary tabular-nums min-w-[3rem] text-right">{display ?? value}</span>
      </div>
      <Slider min={min} max={max} step={step} value={[value]} onValueChange={([v])=>onChange(v)} className="w-full" />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{typeof min === 'number' && step === 10 ? fmtTime(min) : min}</span>
        <span>{typeof max === 'number' && step === 10 ? fmtTime(max) : max}</span>
      </div>
    </div>
  );
}

export default function IpptCalculator() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [age,     setAge]     = useState(22);
  const [pushups, setPushups] = useState(30);
  const [situps,  setSitups]  = useState(30);
  const [runSecs, setRunSecs] = useState(720);
  const [savedResults, setSavedResults] = useState<SavedResult[]>([]);
  const [saving, setSaving]   = useState(false);
  const [deleting, setDeleting] = useState<string|null>(null);

  useEffect(()=>{ if(profile?.age) setAge(Math.min(60,Math.max(18,profile.age))); },[profile]);
  useEffect(()=>{ if(user) fetchSaved(); },[user]);

  const fetchSaved = async () => {
    const { data } = await supabase.from('ippt_results').select('*').eq('user_id',user!.id).order('created_at',{ascending:true});
    if(data) setSavedResults(data as SavedResult[]);
  };

  const result = calcIppt(pushups, situps, runSecs, age);
  const style  = AWARD_STYLE[result.award];

  const saveResult = async () => {
    if(!user) return;
    setSaving(true);
    const { error } = await supabase.from('ippt_results').insert({ user_id:user.id, age, pushups, situps, run_seconds:runSecs, pu_pts:result.pu, su_pts:result.su, run_pts:result.run, total:result.total, award:result.award });
    setSaving(false);
    if(error){ toast({ title:'Error saving', description:error.message, variant:'destructive' }); }
    else { toast({ title:'Result saved!' }); fetchSaved(); }
  };

  const deleteResult = async (id:string) => {
    setDeleting(id);
    const { error } = await supabase.from('ippt_results').delete().eq('id',id);
    setDeleting(null);
    if(error){ toast({ title:'Error deleting', description:error.message, variant:'destructive' }); }
    else { toast({ title:'Result deleted' }); fetchSaved(); }
  };

  const ageLabel = AGE_GROUPS.find(g=>age>=g.min&&age<=g.max)?.label??`Age ${age}`;
  const graphData = savedResults.map((r,i)=>({ name:new Date(r.created_at).toLocaleDateString('en-SG',{day:'numeric',month:'short'}), attempt:i+1, total:r.total, pushups:r.pu_pts, situps:r.su_pts, run:r.run_pts }));

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Timer className="h-7 w-7 text-primary" />
        <h1 className="text-2xl font-bold">IPPT Calculator</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Calculate Your Score</CardTitle>
          <CardDescription>Drag the sliders — score updates live</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">

          {/* Age */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Age</Label>
              <span className="text-sm font-bold text-primary">{age} <span className="text-xs font-normal text-muted-foreground">({ageLabel})</span></span>
            </div>
            <Slider min={18} max={60} step={1} value={[age]} onValueChange={([v])=>setAge(v)} />
            <div className="flex justify-between text-xs text-muted-foreground"><span>18</span><span>60</span></div>
          </div>

          {/* Push-ups */}
          <SliderField label="Push-ups" value={pushups} min={0} max={100} onChange={setPushups} />

          {/* Sit-ups */}
          <SliderField label="Sit-ups" value={situps} min={0} max={100} onChange={setSitups} />

          {/* Run — seconds, displayed as MM:SS */}
          <SliderField label="2.4km Run Time" value={runSecs} min={240} max={2400} step={10} onChange={setRunSecs} display={fmtTime(runSecs)} />

          {/* Live result card */}
          <div className="rounded-xl border p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className={`text-5xl font-bold ${style.text}`}>{result.total}</div>
                <div className="text-sm text-muted-foreground mt-1">out of 100</div>
              </div>
              <span className={`text-sm font-bold px-4 py-2 rounded-full ${style.badge}`}>{result.award}</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label:'Push-ups',  pts:result.pu,  max:25, value:String(pushups) },
                { label:'Sit-ups',   pts:result.su,  max:25, value:String(situps)  },
                { label:'2.4km Run', pts:result.run, max:50, value:fmtTime(runSecs) },
              ].map(s=>(
                <div key={s.label} className="rounded-lg bg-muted p-3 text-center">
                  <div className="text-xs text-muted-foreground mb-1">{s.label}</div>
                  <div className="text-lg font-bold">{s.value}</div>
                  <div className={`text-xs font-semibold mt-1 ${s.pts<1?'text-red-500':'text-primary'}`}>{s.pts} / {s.max} pts</div>
                  <div className="mt-2 h-1.5 rounded-full bg-border overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width:`${(s.pts/s.max)*100}%`, backgroundColor:s.pts<1?'#ef4444':s.pts===s.max?'#eab308':'#3b82f6' }} />
                  </div>
                </div>
              ))}
            </div>
            {result.award!=='Gold'&&result.award!=='Fail'&&(
              <p className="text-xs text-muted-foreground text-center">
                {result.award==='Silver'?`${85-result.total} more pts for Gold`:`${75-result.total} more pts for Silver`}
              </p>
            )}
            {result.award==='Fail'&&(
              <p className="text-xs text-red-500 text-center">
                {result.pu<1||result.su<1||result.run<1?'Must score at least 1 point in every station to pass':`${51-result.total} more pts needed to pass`}
              </p>
            )}
            <Button onClick={saveResult} disabled={saving} variant="outline" className="w-full">
              <Save className="h-4 w-4 mr-2" />{saving?'Saving...':'Save Result'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {savedResults.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Trophy className="h-5 w-5 text-yellow-500" /> Saved Results</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {savedResults.length > 1 && (
              <div className="space-y-6">
                <div>
                  <p className="text-sm font-medium mb-2">Total Score Over Time</p>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={graphData}>
                      <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" tick={{fontSize:10}} /><YAxis domain={[0,100]} tick={{fontSize:10}} /><Tooltip />
                      <ReferenceLine y={85} stroke="#eab308" strokeDasharray="4 4" label={{value:'Gold',fill:'#eab308',fontSize:10}} />
                      <ReferenceLine y={75} stroke="#94a3b8" strokeDasharray="4 4" label={{value:'Silver',fill:'#94a3b8',fontSize:10}} />
                      <ReferenceLine y={51} stroke="#22c55e" strokeDasharray="4 4" label={{value:'Pass',fill:'#22c55e',fontSize:10}} />
                      <Line type="monotone" dataKey="total" name="Total" stroke="#3b82f6" strokeWidth={2} dot={{r:4}} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Station Scores Over Time</p>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={graphData}>
                      <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" tick={{fontSize:10}} /><YAxis tick={{fontSize:10}} /><Tooltip /><Legend />
                      <Line type="monotone" dataKey="pushups" name="Push-ups" stroke="#8b5cf6" strokeWidth={2} dot={{r:3}} />
                      <Line type="monotone" dataKey="situps"  name="Sit-ups"  stroke="#10b981" strokeWidth={2} dot={{r:3}} />
                      <Line type="monotone" dataKey="run"     name="2.4km Run" stroke="#f97316" strokeWidth={2} dot={{r:3}} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
            <div className="space-y-2">
              {savedResults.slice().reverse().map(r=>{
                const s=AWARD_STYLE[r.award]??AWARD_STYLE['Fail'];
                return (
                  <div key={r.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{new Date(r.created_at).toLocaleDateString('en-SG',{day:'numeric',month:'short',year:'numeric'})}</span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${s.badge}`}>{r.award}</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">Age {r.age} · PU: {r.pushups} ({r.pu_pts}pts) · SU: {r.situps} ({r.su_pts}pts) · Run: {fmtTime(r.run_seconds)} ({r.run_pts}pts)</div>
                    </div>
                    <div className="flex items-center gap-3 ml-3">
                      <div className={`text-2xl font-bold ${s.text}`}>{r.total}</div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" disabled={deleting===r.id} onClick={()=>deleteResult(r.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
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
