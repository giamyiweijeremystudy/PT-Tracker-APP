import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { Calculator, Save, Trash2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceArea } from 'recharts';

type BmiCategory = 'Underweight' | 'Normal' | 'Overweight' | 'Obese';

const BMI_CATEGORIES: { label:BmiCategory; min:number; max:number; bg:string; text:string; color:string }[] = [
  { label:'Underweight', min:0,    max:18.5, color:'#3b82f6', bg:'bg-blue-100',   text:'text-blue-700'   },
  { label:'Normal',      min:18.5, max:25,   color:'#22c55e', bg:'bg-green-100',  text:'text-green-700'  },
  { label:'Overweight',  min:25,   max:30,   color:'#f97316', bg:'bg-orange-100', text:'text-orange-700' },
  { label:'Obese',       min:30,   max:100,  color:'#ef4444', bg:'bg-red-100',    text:'text-red-700'    },
];

function getCategory(bmi:number){ return BMI_CATEGORIES.find(c=>bmi>=c.min&&bmi<c.max)??BMI_CATEGORIES[3]; }
function bmiToPercent(bmi:number){ return Math.min(100,Math.max(0,((bmi-10)/30)*100)); }

type SavedBmi={ id:string; user_id:string; height_cm:number; weight_kg:number; bmi:number; category:string; created_at:string; };

function SliderField({ label, value, min, max, step=1, unit, onChange }: { label:string;value:number;min:number;max:number;step?:number;unit:string;onChange:(v:number)=>void; }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <span className="text-sm font-bold text-primary tabular-nums">{value} <span className="text-xs font-normal text-muted-foreground">{unit}</span></span>
      </div>
      <Slider min={min} max={max} step={step} value={[value]} onValueChange={([v])=>onChange(v)} className="w-full" />
      <div className="flex justify-between text-xs text-muted-foreground"><span>{min}</span><span>{max}</span></div>
    </div>
  );
}


// ─── DD/MM/YYYY date formatter ───────────────────────────────────────────────
function fmtDate(dateStr: string, opts?: { weekday?: boolean; year?: boolean }): string {
  const [y, m, d] = dateStr.slice(0, 10).split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const dd = String(d).padStart(2,'0'), mm = String(m).padStart(2,'0');
  if (opts?.weekday) {
    const wd = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][date.getDay()];
    const yr = opts?.year !== false ? ` ${y}` : '';
    return `${wd}, ${dd}/${mm}${yr}`;
  }
  if (opts?.year === false) return `${dd}/${mm}`;
  return `${dd}/${mm}/${y}`;
}

export default function BmiCalculator() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [height, setHeight] = useState(170);
  const [weight, setWeight] = useState(70);
  const [savedResults, setSavedResults] = useState<SavedBmi[]>([]);
  const [saving,   setSaving]   = useState(false);
  const [deleting, setDeleting] = useState<string|null>(null);

  useEffect(()=>{ if(profile?.height_cm) setHeight(Math.min(220,Math.max(100,profile.height_cm))); },[profile]);
  useEffect(()=>{ if(user) fetchSaved(); },[user]);

  const fetchSaved = async () => {
    const { data } = await supabase.from('bmi_results').select('*').eq('user_id',user!.id).order('created_at',{ascending:true});
    if(data) setSavedResults(data as SavedBmi[]);
  };

  const bmi      = weight / ((height/100)**2);
  const category = getCategory(bmi);
  const pct      = bmiToPercent(bmi);

  const saveResult = async () => {
    if(!user) return;
    setSaving(true);
    const { error } = await supabase.from('bmi_results').insert({ user_id:user.id, height_cm:height, weight_kg:weight, bmi:parseFloat(bmi.toFixed(2)), category:category.label });
    setSaving(false);
    if(error){ toast({ title:'Error saving', description:error.message, variant:'destructive' }); }
    else { toast({ title:'BMI saved!' }); fetchSaved(); }
  };

  const deleteResult = async (id:string) => {
    setDeleting(id);
    const { error } = await supabase.from('bmi_results').delete().eq('id',id);
    setDeleting(null);
    if(error){ toast({ title:'Error deleting', description:error.message, variant:'destructive' }); }
    else { toast({ title:'Result deleted' }); fetchSaved(); }
  };

  const graphData = savedResults.map(r=>({ name:fmtDate(r.created_at.slice(0,10), { year: false }), bmi:r.bmi, weight:r.weight_kg }));
  const h = height/100;
  const healthyMin = (18.5*h*h).toFixed(1);
  const healthyMax = (24.9*h*h).toFixed(1);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Calculator className="h-7 w-7 text-primary" />
        <h1 className="text-2xl font-bold">BMI Calculator</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Calculate Your BMI</CardTitle>
          <CardDescription>Drag the sliders — BMI updates live</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">

          <SliderField label="Height" value={height} min={100} max={220} unit="cm" onChange={setHeight} />
          <SliderField label="Weight" value={weight} min={30}  max={200} unit="kg" onChange={setWeight} />

          {/* Live result */}
          <div className="rounded-xl border p-5 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <div className={`text-5xl font-bold ${category.text}`}>{bmi.toFixed(1)}</div>
                <div className="text-sm text-muted-foreground mt-1">kg/m²</div>
              </div>
              <span className={`text-sm font-bold px-4 py-2 rounded-full ${category.bg} ${category.text}`}>{category.label}</span>
            </div>

            {/* Visual scale */}
            <div className="space-y-1">
              <div className="relative h-4 rounded-full overflow-hidden flex">
                <div className="flex-none w-[28.3%] bg-blue-400" />
                <div className="flex-none w-[21.7%] bg-green-400" />
                <div className="flex-none w-[16.7%] bg-orange-400" />
                <div className="flex-1 bg-red-400" />
                <div className="absolute top-0 bottom-0 w-0.5 bg-white shadow-md transition-all" style={{left:`${pct}%`}} />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground px-0.5">
                <span>10</span><span>18.5</span><span>25</span><span>30</span><span>40+</span>
              </div>
            </div>

            {/* Category tiles */}
            <div className="grid grid-cols-4 gap-2 text-xs">
              {BMI_CATEGORIES.map(c=>(
                <div key={c.label} className={`rounded-lg p-2 text-center transition-all ${category.label===c.label?`${c.bg} ${c.text} font-semibold`:'bg-muted text-muted-foreground'}`}>
                  <div className="font-medium">{c.label}</div>
                  <div className="opacity-70">{c.max===100?'≥ 30':`${c.min}–${c.max}`}</div>
                </div>
              ))}
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Healthy weight for {height}cm: <span className="font-medium text-foreground">{healthyMin} – {healthyMax} kg</span>
            </p>

            <Button onClick={saveResult} disabled={saving} variant="outline" className="w-full">
              <Save className="h-4 w-4 mr-2" />{saving?'Saving...':'Save Result'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {savedResults.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Calculator className="h-5 w-5 text-primary" /> BMI History</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {savedResults.length > 1 && (
              <div className="space-y-6">
                <div>
                  <p className="text-sm font-medium mb-2">BMI Over Time</p>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={graphData}>
                      <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" tick={{fontSize:10}} /><YAxis domain={[10,40]} tick={{fontSize:10}} />
                      <Tooltip formatter={(v:number)=>v.toFixed(1)} />
                      <ReferenceArea y1={0}    y2={18.5} fill="#3b82f6" fillOpacity={0.05} />
                      <ReferenceArea y1={18.5} y2={25}   fill="#22c55e" fillOpacity={0.08} />
                      <ReferenceArea y1={25}   y2={30}   fill="#f97316" fillOpacity={0.05} />
                      <ReferenceArea y1={30}   y2={100}  fill="#ef4444" fillOpacity={0.05} />
                      <ReferenceLine y={18.5} stroke="#22c55e" strokeDasharray="4 4" />
                      <ReferenceLine y={25}   stroke="#f97316" strokeDasharray="4 4" />
                      <ReferenceLine y={30}   stroke="#ef4444" strokeDasharray="4 4" />
                      <Line type="monotone" dataKey="bmi" name="BMI" stroke="#3b82f6" strokeWidth={2} dot={{r:4}} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Weight Over Time (kg)</p>
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={graphData}>
                      <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" tick={{fontSize:10}} /><YAxis tick={{fontSize:10}} /><Tooltip />
                      <Line type="monotone" dataKey="weight" name="Weight (kg)" stroke="#8b5cf6" strokeWidth={2} dot={{r:4}} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
            <div className="space-y-2">
              {savedResults.slice().reverse().map(r=>{
                const cat=BMI_CATEGORIES.find(c=>c.label===r.category)??BMI_CATEGORIES[3];
                return (
                  <div key={r.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{fmtDate(r.created_at.slice(0,10))}</span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cat.bg} ${cat.text}`}>{r.category}</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">{r.height_cm}cm · {r.weight_kg}kg</div>
                    </div>
                    <div className="flex items-center gap-3 ml-3">
                      <div className={`text-2xl font-bold ${cat.text}`}>{r.bmi.toFixed(1)}</div>
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
