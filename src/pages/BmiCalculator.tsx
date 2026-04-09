import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Calculator, Save } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, ReferenceArea,
} from 'recharts';

// ─── BMI logic ────────────────────────────────────────────────────────────────

type BmiCategory = 'Underweight' | 'Normal' | 'Overweight' | 'Obese';

const BMI_CATEGORIES: { label: BmiCategory; min: number; max: number; color: string; bg: string; text: string }[] = [
  { label: 'Underweight', min: 0,    max: 18.5, color: '#3b82f6', bg: 'bg-blue-100',   text: 'text-blue-700'  },
  { label: 'Normal',      min: 18.5, max: 25,   color: '#22c55e', bg: 'bg-green-100',  text: 'text-green-700' },
  { label: 'Overweight',  min: 25,   max: 30,   color: '#f97316', bg: 'bg-orange-100', text: 'text-orange-700'},
  { label: 'Obese',       min: 30,   max: 100,  color: '#ef4444', bg: 'bg-red-100',    text: 'text-red-700'   },
];

function getCategory(bmi: number) {
  return BMI_CATEGORIES.find(c => bmi >= c.min && bmi < c.max) ?? BMI_CATEGORIES[3];
}

// BMI scale position (0–100%) for the needle indicator
function bmiToPercent(bmi: number): number {
  // Scale: 10 → 0%, 40 → 100%
  return Math.min(100, Math.max(0, ((bmi - 10) / 30) * 100));
}

// ─── Types ────────────────────────────────────────────────────────────────────

type SavedBmi = {
  id: string;
  user_id: string;
  height_cm: number;
  weight_kg: number;
  bmi: number;
  category: string;
  created_at: string;
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function BmiCalculator() {
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [bmi, setBmi] = useState<number | null>(null);
  const [savedResults, setSavedResults] = useState<SavedBmi[]>([]);
  const [saving, setSaving] = useState(false);

  // Pre-fill height from profile
  useEffect(() => {
    if (profile?.height_cm) setHeight(String(profile.height_cm));
  }, [profile]);

  useEffect(() => {
    if (user) fetchSaved();
  }, [user]);

  const fetchSaved = async () => {
    const { data } = await supabase
      .from('bmi_results')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: true });
    if (data) setSavedResults(data as SavedBmi[]);
  };

  const calculate = () => {
    const h = parseFloat(height);
    const w = parseFloat(weight);
    if (!h || !w || h <= 0 || w <= 0) {
      toast({ title: 'Enter valid height and weight', variant: 'destructive' });
      return;
    }
    setBmi(w / ((h / 100) ** 2));
  };

  const saveResult = async () => {
    if (!bmi || !user) return;
    const h = parseFloat(height);
    const w = parseFloat(weight);
    const cat = getCategory(bmi);
    setSaving(true);
    const { error } = await supabase.from('bmi_results').insert({
      user_id:   user.id,
      height_cm: h,
      weight_kg: w,
      bmi:       parseFloat(bmi.toFixed(2)),
      category:  cat.label,
    });
    setSaving(false);
    if (error) { toast({ title: 'Error saving', description: error.message, variant: 'destructive' }); }
    else { toast({ title: 'BMI saved!' }); fetchSaved(); }
  };

  const category = bmi !== null ? getCategory(bmi) : null;
  const pct = bmi !== null ? bmiToPercent(bmi) : null;

  const graphData = savedResults.map(r => ({
    name: new Date(r.created_at).toLocaleDateString('en-SG', { day: 'numeric', month: 'short' }),
    bmi:  r.bmi,
    weight: r.weight_kg,
  }));

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      <div className="flex items-center gap-3">
        <Calculator className="h-7 w-7 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">BMI Calculator</h1>
      </div>

      {/* Input card */}
      <Card>
        <CardHeader>
          <CardTitle>Calculate Your BMI</CardTitle>
          <CardDescription>Body Mass Index — a measure of body fat based on height and weight</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Height (cm)</Label>
              <Input
                type="number" placeholder="e.g. 170"
                value={height} onChange={e => { setHeight(e.target.value); setBmi(null); }}
              />
            </div>
            <div className="space-y-2">
              <Label>Weight (kg)</Label>
              <Input
                type="number" placeholder="e.g. 70"
                value={weight} onChange={e => { setWeight(e.target.value); setBmi(null); }}
              />
            </div>
          </div>

          <Button onClick={calculate} className="w-full">Calculate BMI</Button>

          {/* Result */}
          {bmi !== null && category && pct !== null && (
            <div className="rounded-xl border p-5 space-y-5">

              {/* Score + category */}
              <div className="flex items-center justify-between">
                <div>
                  <div className={`text-5xl font-bold ${category.text}`}>{bmi.toFixed(1)}</div>
                  <div className="text-sm text-muted-foreground mt-1">kg/m²</div>
                </div>
                <span className={`text-sm font-bold px-4 py-2 rounded-full ${category.bg} ${category.text}`}>
                  {category.label}
                </span>
              </div>

              {/* Visual scale bar */}
              <div className="space-y-1">
                <div className="relative h-4 rounded-full overflow-hidden flex">
                  <div className="flex-none w-[28.3%] bg-blue-400" />   {/* <18.5 / 30 */}
                  <div className="flex-none w-[21.7%] bg-green-400" />  {/* 18.5–25 / 30 */}
                  <div className="flex-none w-[16.7%] bg-orange-400" />{/* 25–30 / 30 */}
                  <div className="flex-1        bg-red-400" />          {/* 30+ */}
                  {/* Needle */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-white shadow-md transition-all"
                    style={{ left: `${pct}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground px-0.5">
                  <span>10</span>
                  <span>18.5</span>
                  <span>25</span>
                  <span>30</span>
                  <span>40+</span>
                </div>
              </div>

              {/* Category tiles */}
              <div className="grid grid-cols-4 gap-2 text-xs">
                {BMI_CATEGORIES.map(c => (
                  <div
                    key={c.label}
                    className={`rounded-lg p-2 text-center transition-all ${
                      category.label === c.label
                        ? `${c.bg} ${c.text} font-semibold ring-2 ring-offset-1`
                        : 'bg-muted text-muted-foreground'
                    }`}
                    style={category.label === c.label ? { ringColor: c.color } : {}}
                  >
                    <div className="font-medium">{c.label}</div>
                    <div className="opacity-70">
                      {c.max === 100 ? '≥ 30' : `${c.min}–${c.max}`}
                    </div>
                  </div>
                ))}
              </div>

              {/* Ideal weight range */}
              {height && parseFloat(height) > 0 && (() => {
                const h = parseFloat(height) / 100;
                const minW = (18.5 * h * h).toFixed(1);
                const maxW = (24.9 * h * h).toFixed(1);
                return (
                  <p className="text-xs text-muted-foreground text-center">
                    Healthy weight range for {height}cm: <span className="font-medium text-foreground">{minW} – {maxW} kg</span>
                  </p>
                );
              })()}

              <Button onClick={saveResult} disabled={saving} variant="outline" className="w-full">
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Result'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Saved results */}
      {savedResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-primary" /> BMI History
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">

            {/* Graphs — only if more than one result */}
            {savedResults.length > 1 && (
              <div className="space-y-6">
                <div>
                  <p className="text-sm font-medium mb-2">BMI Over Time</p>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={graphData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis domain={[10, 40]} tick={{ fontSize: 10 }} />
                      <Tooltip formatter={(v: number) => v.toFixed(1)} />
                      {/* Reference bands */}
                      <ReferenceArea y1={0}    y2={18.5} fill="#3b82f6" fillOpacity={0.05} />
                      <ReferenceArea y1={18.5} y2={25}   fill="#22c55e" fillOpacity={0.08} />
                      <ReferenceArea y1={25}   y2={30}   fill="#f97316" fillOpacity={0.05} />
                      <ReferenceArea y1={30}   y2={100}  fill="#ef4444" fillOpacity={0.05} />
                      <ReferenceLine y={18.5} stroke="#22c55e" strokeDasharray="4 4" />
                      <ReferenceLine y={25}   stroke="#f97316" strokeDasharray="4 4" />
                      <ReferenceLine y={30}   stroke="#ef4444" strokeDasharray="4 4" />
                      <Line type="monotone" dataKey="bmi" name="BMI" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">Weight Over Time (kg)</p>
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={graphData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="weight" name="Weight (kg)" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Results list */}
            <div className="space-y-2">
              {savedResults.slice().reverse().map(r => {
                const cat = BMI_CATEGORIES.find(c => c.label === r.category) ?? BMI_CATEGORIES[3];
                return (
                  <div key={r.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">
                          {new Date(r.created_at).toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cat.bg} ${cat.text}`}>
                          {r.category}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {r.height_cm}cm · {r.weight_kg}kg
                      </div>
                    </div>
                    <div className={`text-2xl font-bold ${cat.text}`}>{r.bmi.toFixed(1)}</div>
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
