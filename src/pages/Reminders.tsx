import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Bell, Dumbbell, Droplets, Moon } from 'lucide-react';

interface Reminder {
  id: string;
  icon: React.ElementType;
  title: string;
  description: string;
  enabled: boolean;
  time: string;
}

export default function Reminders() {
  const [reminders, setReminders] = useState<Reminder[]>([
    { id: 'workout', icon: Dumbbell, title: 'Workout Reminder', description: 'Daily reminder to complete your workout', enabled: true, time: '06:30' },
    { id: 'hydration', icon: Droplets, title: 'Hydration Reminder', description: 'Reminders to drink water throughout the day', enabled: true, time: '08:00' },
    { id: 'sleep', icon: Moon, title: 'Sleep Reminder', description: 'Wind-down reminder for quality sleep', enabled: false, time: '22:00' },
  ]);

  const toggle = (id: string) => {
    setReminders(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  };

  const updateTime = (id: string, time: string) => {
    setReminders(prev => prev.map(r => r.id === id ? { ...r, time } : r));
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Bell className="h-7 w-7 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Reminders</h1>
      </div>

      <div className="space-y-4">
        {reminders.map(r => (
          <Card key={r.id} className={r.enabled ? '' : 'opacity-60'}>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <r.icon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-foreground">{r.title}</div>
                <div className="text-xs text-muted-foreground">{r.description}</div>
                <div className="mt-2">
                  <Input
                    type="time"
                    value={r.time}
                    onChange={e => updateTime(r.id, e.target.value)}
                    className="w-32 h-8 text-sm"
                    disabled={!r.enabled}
                  />
                </div>
              </div>
              <Switch checked={r.enabled} onCheckedChange={() => toggle(r.id)} />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
