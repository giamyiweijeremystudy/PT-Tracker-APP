import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Thermometer, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

function getWbgtCategory(temp: number) {
  if (temp < 30) return { label: 'White – Low Risk', color: 'bg-card border', textColor: 'text-foreground' };
  if (temp < 31) return { label: 'Green – Moderate Risk', color: 'bg-green-500/20', textColor: 'text-green-700' };
  if (temp < 32) return { label: 'Yellow – High Risk', color: 'bg-yellow-500/20', textColor: 'text-yellow-700' };
  if (temp < 33) return { label: 'Red – Very High Risk', color: 'bg-red-500/20', textColor: 'text-red-700' };
  return { label: 'Black – Extreme Risk', color: 'bg-gray-900/20', textColor: 'text-foreground' };
}

const IFT_OPTIONS = ['IFT 1 – Easy Pace', 'IFT 2 – Moderate Pace', 'IFT 3 – Hard Pace', 'IFT 4 – Max Effort', 'No IFT (Rest Day)'];

export default function TemperatureIft() {
  const [wbgt, setWbgt] = useState('');
  const [ift, setIft] = useState('IFT 2 – Moderate Pace');
  const [notes, setNotes] = useState('');
  const { toast } = useToast();

  const category = wbgt ? getWbgtCategory(parseFloat(wbgt)) : null;

  const handleSave = () => {
    toast({ title: 'Settings saved', description: `WBGT: ${wbgt}°C, IFT: ${ift}` });
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Thermometer className="h-7 w-7 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Temperature & IFT</h1>
      </div>
      <p className="text-sm text-muted-foreground">PT IC: Input current weather conditions and set IFT training preference for the session.</p>

      <Card>
        <CardHeader>
          <CardTitle>Weather & Training Input</CardTitle>
          <CardDescription>Set the current WBGT temperature and IFT level</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>WBGT Temperature (°C)</Label>
            <Input type="number" step="0.1" placeholder="29.5" value={wbgt} onChange={e => setWbgt(e.target.value)} />
            {category && (
              <div className={`rounded-lg p-3 flex items-center gap-2 ${category.color}`}>
                {parseFloat(wbgt) >= 32 && <AlertTriangle className="h-4 w-4 text-destructive" />}
                <span className={`text-sm font-medium ${category.textColor}`}>{category.label}</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>IFT Preference</Label>
            <Select value={ift} onValueChange={setIft}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {IFT_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Additional Notes</Label>
            <Input placeholder="e.g. Reduced intensity due to heat" value={notes} onChange={e => setNotes(e.target.value)} />
          </div>

          <Button onClick={handleSave} className="w-full">Save for Today's Session</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">WBGT Heat Stress Guide</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            {[
              { range: '< 30°C', label: 'White', desc: 'Normal training' },
              { range: '30–30.9°C', label: 'Green', desc: 'Caution, increase water intake' },
              { range: '31–31.9°C', label: 'Yellow', desc: 'Reduce intensity, frequent rest' },
              { range: '32–32.9°C', label: 'Red', desc: 'Strenuous activity limited' },
              { range: '≥ 33°C', label: 'Black', desc: 'All outdoor activities suspended' },
            ].map(h => (
              <div key={h.label} className="flex items-center gap-3">
                <Badge variant="outline" className="w-20 justify-center">{h.label}</Badge>
                <span className="text-muted-foreground">{h.range} — {h.desc}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
