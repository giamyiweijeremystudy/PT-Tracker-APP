import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const sampleEvents: Record<string, { title: string; type: string }[]> = {
  '2026-04-07': [{ title: 'IPPT Training', type: 'run' }],
  '2026-04-08': [{ title: 'Upper Body', type: 'gym' }],
  '2026-04-09': [{ title: 'Swim 1km', type: 'swim' }, { title: 'Core Workout', type: 'gym' }],
  '2026-04-10': [{ title: '5km Run', type: 'run' }],
  '2026-04-11': [{ title: 'Rest Day', type: 'rest' }],
  '2026-04-12': [{ title: 'Spartan Prep', type: 'gym' }],
  '2026-04-14': [{ title: '2.4km Time Trial', type: 'run' }],
  '2026-04-16': [{ title: 'Swim Drills', type: 'swim' }],
};

const typeColors: Record<string, string> = {
  run: 'bg-blue-500/20 text-blue-700',
  swim: 'bg-cyan-500/20 text-cyan-700',
  gym: 'bg-orange-500/20 text-orange-700',
  rest: 'bg-muted text-muted-foreground',
};

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1; // Monday start
}

export default function TrainingSchedule() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const prev = () => setCurrentDate(new Date(year, month - 1, 1));
  const next = () => setCurrentDate(new Date(year, month + 1, 1));

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <CalendarDays className="h-7 w-7 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Training Schedule</h1>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={prev}><ChevronLeft className="h-4 w-4" /></Button>
            <CardTitle>{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</CardTitle>
            <Button variant="ghost" size="icon" onClick={next}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1">
            {DAYS.map(d => (
              <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>
            ))}
            {cells.map((day, i) => {
              const dateStr = day ? `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` : '';
              const events = dateStr ? sampleEvents[dateStr] || [] : [];
              const isToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();
              return (
                <div
                  key={i}
                  className={`min-h-[80px] rounded border p-1 text-xs ${day ? 'bg-card' : 'bg-transparent border-transparent'} ${isToday ? 'ring-2 ring-primary' : ''}`}
                >
                  {day && <div className={`font-medium mb-0.5 ${isToday ? 'text-primary' : 'text-foreground'}`}>{day}</div>}
                  {events.map((e, j) => (
                    <div key={j} className={`rounded px-1 py-0.5 mb-0.5 truncate ${typeColors[e.type] || 'bg-muted'}`}>
                      {e.title}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
          <div className="flex gap-3 mt-4 text-xs">
            <Badge className="bg-blue-500/20 text-blue-700">Run</Badge>
            <Badge className="bg-cyan-500/20 text-cyan-700">Swim</Badge>
            <Badge className="bg-orange-500/20 text-orange-700">Gym</Badge>
            <Badge className="bg-muted text-muted-foreground">Rest</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
