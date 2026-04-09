import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Calculator } from 'lucide-react';

function getBmiCategory(bmi: number) {
  if (bmi < 18.5) return { label: 'Underweight', color: 'text-warning' };
  if (bmi < 25) return { label: 'Normal', color: 'text-success' };
  if (bmi < 30) return { label: 'Overweight', color: 'text-warning' };
  return { label: 'Obese', color: 'text-destructive' };
}

export default function BmiCalculator() {
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [bmi, setBmi] = useState<number | null>(null);

  const calculate = () => {
    const h = parseFloat(height) / 100;
    const w = parseFloat(weight);
    if (h > 0 && w > 0) setBmi(w / (h * h));
  };

  const category = bmi ? getBmiCategory(bmi) : null;

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-foreground">BMI Calculator</h1>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Calculator className="h-5 w-5" /> Body Mass Index</CardTitle>
          <CardDescription>Enter your height and weight to calculate your BMI</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Height (cm)</Label>
              <Input type="number" placeholder="170" value={height} onChange={e => setHeight(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Weight (kg)</Label>
              <Input type="number" placeholder="70" value={weight} onChange={e => setWeight(e.target.value)} />
            </div>
          </div>
          <Button onClick={calculate} className="w-full">Calculate BMI</Button>
          {bmi !== null && category && (
            <div className="rounded-lg border p-4 text-center space-y-1">
              <p className="text-3xl font-bold text-foreground">{bmi.toFixed(1)}</p>
              <p className={`text-lg font-semibold ${category.color}`}>{category.label}</p>
              <div className="mt-3 grid grid-cols-4 gap-1 text-xs">
                {[
                  { range: '< 18.5', label: 'Under', active: bmi < 18.5 },
                  { range: '18.5–24.9', label: 'Normal', active: bmi >= 18.5 && bmi < 25 },
                  { range: '25–29.9', label: 'Over', active: bmi >= 25 && bmi < 30 },
                  { range: '30+', label: 'Obese', active: bmi >= 30 },
                ].map(b => (
                  <div key={b.label} className={`rounded p-1.5 ${b.active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                    <div className="font-medium">{b.range}</div>
                    <div>{b.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
