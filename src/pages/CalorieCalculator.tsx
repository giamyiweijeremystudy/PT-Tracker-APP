import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Apple } from 'lucide-react';

const ACTIVITY_LEVELS = [
  { value: '1.2', label: 'Sedentary (office job)' },
  { value: '1.375', label: 'Lightly Active (1-3 days/week)' },
  { value: '1.55', label: 'Moderately Active (3-5 days/week)' },
  { value: '1.725', label: 'Very Active (6-7 days/week)' },
  { value: '1.9', label: 'Extra Active (physical job + training)' },
];

export default function CalorieCalculator() {
  const [gender, setGender] = useState('male');
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [activity, setActivity] = useState('1.55');
  const [goal, setGoal] = useState('maintain');
  const [result, setResult] = useState<{ bmr: number; tdee: number; target: number } | null>(null);

  const calculate = () => {
    const a = parseInt(age) || 0, h = parseFloat(height) || 0, w = parseFloat(weight) || 0;
    const bmr = gender === 'male'
      ? 10 * w + 6.25 * h - 5 * a + 5
      : 10 * w + 6.25 * h - 5 * a - 161;
    const tdee = bmr * parseFloat(activity);
    const target = goal === 'lose' ? tdee - 500 : goal === 'gain' ? tdee + 500 : tdee;
    setResult({ bmr: Math.round(bmr), tdee: Math.round(tdee), target: Math.round(target) });
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Calorie Calculator</h1>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Apple className="h-5 w-5" /> TDEE & Calories</CardTitle>
          <CardDescription>Calculate your daily calorie needs for weight loss, gain, or maintenance</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Gender</Label>
              <Select value={gender} onValueChange={setGender}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Age</Label>
              <Input type="number" placeholder="25" value={age} onChange={e => setAge(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Height (cm)</Label>
              <Input type="number" placeholder="175" value={height} onChange={e => setHeight(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Weight (kg)</Label>
              <Input type="number" placeholder="70" value={weight} onChange={e => setWeight(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Activity Level</Label>
            <Select value={activity} onValueChange={setActivity}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ACTIVITY_LEVELS.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Goal</Label>
            <Select value={goal} onValueChange={setGoal}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="lose">Lose Weight (-500 cal/day)</SelectItem>
                <SelectItem value="maintain">Maintain Weight</SelectItem>
                <SelectItem value="gain">Gain Weight (+500 cal/day)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={calculate} className="w-full">Calculate</Button>
          {result && (
            <div className="rounded-lg border p-4 space-y-3">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded bg-muted p-3"><div className="text-xs text-muted-foreground">BMR</div><div className="text-lg font-bold">{result.bmr}</div></div>
                <div className="rounded bg-muted p-3"><div className="text-xs text-muted-foreground">TDEE</div><div className="text-lg font-bold">{result.tdee}</div></div>
                <div className="rounded bg-primary/10 p-3"><div className="text-xs text-muted-foreground">Target</div><div className="text-lg font-bold text-primary">{result.target}</div></div>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                {goal === 'lose' ? 'Eat ~500 cal below TDEE to lose ~0.5kg/week' : goal === 'gain' ? 'Eat ~500 cal above TDEE to gain ~0.5kg/week' : 'Eat at TDEE to maintain current weight'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
