import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dumbbell, Waves, Timer as RunIcon, Target } from 'lucide-react';

const programmes = {
  ippt: [
    { week: '1-2', focus: 'Base Building', details: ['3x 2km easy runs', '3x20 push-ups, 3x20 sit-ups', '1x interval session (400m x 6)'] },
    { week: '3-4', focus: 'Progressive Overload', details: ['2x 3km runs', '4x25 push-ups, 4x25 sit-ups', '2x interval sessions (800m x 4)'] },
    { week: '5-6', focus: 'Speed Work', details: ['1x 5km run', '5x30 push-ups, 5x30 sit-ups', '2x tempo runs (2.4km pace)'] },
    { week: '7-8', focus: 'Peak & Taper', details: ['2.4km time trials', 'Max rep push-up/sit-up tests', 'Active recovery + stretching'] },
  ],
  sft: [
    { week: '1-2', focus: 'Foundation', details: ['Plank holds 3x45s', 'Bodyweight squats 3x20', 'Pull-up negatives 3x5', 'Shuttle run practice'] },
    { week: '3-4', focus: 'Strength Build', details: ['Plank 3x60s', 'Lunges 3x15 each leg', 'Pull-ups 3x max', 'Agility drills 2x/week'] },
    { week: '5-6', focus: 'Power Phase', details: ['Plank 3x90s', 'Jump squats 3x15', 'Weighted pull-ups 3x5', 'Sprint intervals'] },
  ],
  ift: [
    { week: '1-4', focus: 'Aerobic Base', details: ['4x 30min easy runs (Zone 2)', '2x swim 500m steady', 'Core circuit 3x/week'] },
    { week: '5-8', focus: 'Threshold Training', details: ['2x tempo runs (20min)', '2x swim intervals (100m x 8)', 'Strength training 2x/week'] },
    { week: '9-12', focus: 'Race Prep', details: ['Long run 8-10km weekly', 'Swim 1km time trial', 'Brick sessions (run + swim)'] },
  ],
  home: [
    { week: 'Push Day', focus: 'Chest, Shoulders, Triceps', details: ['Push-ups 4x max', 'Diamond push-ups 3x15', 'Pike push-ups 3x12', 'Tricep dips 3x15', 'Plank shoulder taps 3x20'] },
    { week: 'Pull Day', focus: 'Back, Biceps', details: ['Pull-ups/chin-ups 4x max', 'Inverted rows 3x15', 'Towel curls 3x15', 'Superman holds 3x30s'] },
    { week: 'Leg Day', focus: 'Quads, Hamstrings, Glutes', details: ['Squats 4x20', 'Lunges 3x15 each', 'Glute bridges 3x20', 'Calf raises 3x25', 'Wall sits 3x45s'] },
    { week: 'Cardio', focus: 'Endurance & HIIT', details: ['Burpees 4x15', 'Mountain climbers 3x30', 'High knees 3x30s', 'Jump squats 3x15', '30min run/jog'] },
  ],
};

function ProgrammeCard({ items }: { items: typeof programmes.ippt }) {
  return (
    <div className="space-y-4">
      {items.map((item, i) => (
        <Card key={i}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{item.focus}</CardTitle>
              <Badge variant="outline">{item.week}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {item.details.map((d, j) => <li key={j} className="flex items-start gap-2"><span className="text-primary mt-1">•</span>{d}</li>)}
            </ul>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function TrainingProgrammes() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Dumbbell className="h-7 w-7 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Training Programmes</h1>
      </div>
      <p className="text-sm text-muted-foreground">Structured programmes for SFT, IFT, IPPT prep, and home workouts. Follow these to improve your fitness scores.</p>

      <Tabs defaultValue="ippt">
        <TabsList className="flex-wrap">
          <TabsTrigger value="ippt"><RunIcon className="h-3 w-3 mr-1" />IPPT Prep</TabsTrigger>
          <TabsTrigger value="sft"><Target className="h-3 w-3 mr-1" />SFT</TabsTrigger>
          <TabsTrigger value="ift"><Waves className="h-3 w-3 mr-1" />IFT</TabsTrigger>
          <TabsTrigger value="home"><Dumbbell className="h-3 w-3 mr-1" />Home/Camp</TabsTrigger>
        </TabsList>
        <TabsContent value="ippt"><ProgrammeCard items={programmes.ippt} /></TabsContent>
        <TabsContent value="sft"><ProgrammeCard items={programmes.sft} /></TabsContent>
        <TabsContent value="ift"><ProgrammeCard items={programmes.ift} /></TabsContent>
        <TabsContent value="home"><ProgrammeCard items={programmes.home} /></TabsContent>
      </Tabs>
    </div>
  );
}
