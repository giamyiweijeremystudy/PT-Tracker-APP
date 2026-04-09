import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User, Trophy, Timer, Dumbbell } from 'lucide-react';

const recentHistory = [
  { date: '2026-04-08', activity: '2.4km Run', result: '9:30', type: 'run' },
  { date: '2026-04-07', activity: 'Push-ups Test', result: '45 reps', type: 'statics' },
  { date: '2026-04-06', activity: 'Swim 1km', result: '22:15', type: 'swim' },
  { date: '2026-04-05', activity: 'IPPT Mock', result: '72 pts (Silver)', type: 'ippt' },
  { date: '2026-04-03', activity: 'Gym Session', result: 'Completed', type: 'gym' },
];

export default function ProfileHistory() {
  const { profile, roles } = useAuth();
  const initials = profile?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <User className="h-7 w-7 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Profile & History</h1>
      </div>

      <Card>
        <CardContent className="flex items-center gap-4 p-6">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="bg-primary text-primary-foreground text-xl">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-xl font-bold text-foreground">{profile?.rank} {profile?.full_name || 'User'}</h2>
            <p className="text-sm text-muted-foreground">{profile?.department} Department</p>
            <div className="flex gap-2 mt-2">
              {roles.map(r => <Badge key={r} variant="secondary">{r}</Badge>)}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Trophy className="h-6 w-6 mx-auto text-yellow-500 mb-1" />
            <div className="text-2xl font-bold text-foreground">Silver</div>
            <div className="text-xs text-muted-foreground">Best IPPT</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Timer className="h-6 w-6 mx-auto text-primary mb-1" />
            <div className="text-2xl font-bold text-foreground">9:30</div>
            <div className="text-xs text-muted-foreground">Best 2.4km</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Dumbbell className="h-6 w-6 mx-auto text-primary mb-1" />
            <div className="text-2xl font-bold text-foreground">45</div>
            <div className="text-xs text-muted-foreground">Best Push-ups</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Training History</CardTitle>
          <CardDescription>Your recent activities and results</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentHistory.map((h, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <div className="font-medium text-sm text-foreground">{h.activity}</div>
                  <div className="text-xs text-muted-foreground">{h.date}</div>
                </div>
                <Badge variant="outline">{h.result}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
