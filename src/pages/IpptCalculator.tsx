import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Timer } from 'lucide-react';

const AGE_GROUPS = ['< 22', '22–24', '25–27', '28–30', '31–33', '34–36', '37–39', '40–42', '43–45', '46–48', '49–51', '52–54', '55–57', '58–60'];

function calcPushupScore(reps: number) { return Math.min(25, Math.max(0, Math.round(reps * 25 / 60))); }
function calcSitupScore(reps: number) { return Math.min(25, Math.max(0, Math.round(reps * 25 / 60))); }
function calcRunScore(minutes: number, seconds: number) {
  const totalSec = minutes * 60 + seconds;
  if (totalSec <= 510) return 50;
  if (totalSec >= 1020) return 0;
  return Math.max(0, Math.round(50 - ((totalSec - 510) / (1020 - 510)) * 50));
}

function getAward(score: number) {
  if (score >= 90) return { label: 'Gold', color: 'text-yellow-500' };
  if (score >= 75) return { label: 'Silver', color: 'text-muted-foreground' };
  if (score >= 61) return { label: 'Pass with Incentive', color: 'text-primary' };
  if (score >= 51) return { label: 'Pass', color: 'text-success' };
  return { label: 'Fail', color: 'text-destructive' };
}

export default function IpptCalculator() {
  const [ageGroup, setAgeGroup] = useState('< 22');
  const [pushups, setPushups] = useState('');
  const [situps, setSitups] = useState('');
  const [runMin, setRunMin] = useState('');
  const [runSec, setRunSec] = useState('');
  const [result, setResult] = useState<{ pushup: number; situp: number; run: number; total: number } | null>(null);

  const calculate = () => {
    const pu = calcPushupScore(parseInt(pushups) || 0);
    const su = calcSitupScore(parseInt(situps) || 0);
    const ru = calcRunScore(parseInt(runMin) || 0, parseInt(runSec) || 0);
    setResult({ pushup: pu, situp: su, run: ru, total: pu + su + ru });
  };

  const award = result ? getAward(result.total) : null;

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-foreground">IPPT Calculator</h1>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Timer className="h-5 w-5" /> IPPT Score</CardTitle>
          <CardDescription>Calculate your Individual Physical Proficiency Test score</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Age Group</Label>
            <Select value={ageGroup} onValueChange={setAgeGroup}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {AGE_GROUPS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Push-ups (reps)</Label>
              <Input type="number" placeholder="40" value={pushups} onChange={e => setPushups(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Sit-ups (reps)</Label>
              <Input type="number" placeholder="40" value={situps} onChange={e => setSitups(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>2.4km Run (min)</Label>
              <Input type="number" placeholder="10" value={runMin} onChange={e => setRunMin(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>2.4km Run (sec)</Label>
              <Input type="number" placeholder="30" value={runSec} onChange={e => setRunSec(e.target.value)} />
            </div>
          </div>
          <Button onClick={calculate} className="w-full">Calculate Score</Button>
          {result && award && (
            <div className="rounded-lg border p-4 text-center space-y-2">
              <p className="text-4xl font-bold text-foreground">{result.total}</p>
              <p className={`text-lg font-semibold ${award.color}`}>{award.label}</p>
              <div className="grid grid-cols-3 gap-2 text-sm mt-2">
                <div className="rounded bg-muted p-2"><div className="text-muted-foreground">Push-ups</div><div className="font-bold">{result.pushup}/25</div></div>
                <div className="rounded bg-muted p-2"><div className="text-muted-foreground">Sit-ups</div><div className="font-bold">{result.situp}/25</div></div>
                <div className="rounded bg-muted p-2"><div className="text-muted-foreground">2.4km Run</div><div className="font-bold">{result.run}/50</div></div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
