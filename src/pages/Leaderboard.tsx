import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trophy, Medal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const runData = [
  { rank: 1, name: 'SGT Tan Wei Ming', time: '8:45', distance: '2.4km', date: '2026-04-01' },
  { rank: 2, name: 'CPL Lee Jun Hao', time: '9:12', distance: '2.4km', date: '2026-04-03' },
  { rank: 3, name: 'PFC Ahmad Bin Ismail', time: '9:30', distance: '2.4km', date: '2026-04-02' },
  { rank: 4, name: 'SPC David Lim', time: '9:55', distance: '2.4km', date: '2026-03-28' },
  { rank: 5, name: 'PVT Ravi Kumar', time: '10:20', distance: '2.4km', date: '2026-04-05' },
];

const staticsData = [
  { rank: 1, name: 'SSG Chen Kai', pushups: 62, situps: 58, score: 48 },
  { rank: 2, name: 'SGT Tan Wei Ming', pushups: 55, situps: 55, score: 45 },
  { rank: 3, name: 'CPL Lee Jun Hao', pushups: 50, situps: 52, score: 42 },
  { rank: 4, name: 'PFC Ahmad Bin Ismail', pushups: 48, situps: 50, score: 40 },
  { rank: 5, name: 'SPC David Lim', pushups: 45, situps: 45, score: 37 },
];

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <Badge className="bg-yellow-500 text-yellow-950">🥇 1st</Badge>;
  if (rank === 2) return <Badge className="bg-gray-300 text-gray-800">🥈 2nd</Badge>;
  if (rank === 3) return <Badge className="bg-amber-600 text-white">🥉 3rd</Badge>;
  return <Badge variant="outline">{rank}th</Badge>;
}

export default function Leaderboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Trophy className="h-7 w-7 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Leaderboard</h1>
      </div>
      <p className="text-sm text-muted-foreground">Rankings based on Strava submissions and PT records. Submit your runs via Strava to appear here.</p>

      <Tabs defaultValue="run">
        <TabsList>
          <TabsTrigger value="run">2.4km Run</TabsTrigger>
          <TabsTrigger value="statics">Statics</TabsTrigger>
        </TabsList>
        <TabsContent value="run">
          <Card>
            <CardHeader>
              <CardTitle>Run Leaderboard</CardTitle>
              <CardDescription>Best 2.4km run times from Strava submissions</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">Rank</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {runData.map(r => (
                    <TableRow key={r.rank}>
                      <TableCell><RankBadge rank={r.rank} /></TableCell>
                      <TableCell className="font-medium">{r.name}</TableCell>
                      <TableCell>{r.time}</TableCell>
                      <TableCell className="text-muted-foreground">{r.date}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="statics">
          <Card>
            <CardHeader>
              <CardTitle>Statics Leaderboard</CardTitle>
              <CardDescription>Best push-up and sit-up scores</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">Rank</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Push-ups</TableHead>
                    <TableHead>Sit-ups</TableHead>
                    <TableHead>Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staticsData.map(r => (
                    <TableRow key={r.rank}>
                      <TableCell><RankBadge rank={r.rank} /></TableCell>
                      <TableCell className="font-medium">{r.name}</TableCell>
                      <TableCell>{r.pushups}</TableCell>
                      <TableCell>{r.situps}</TableCell>
                      <TableCell className="font-bold">{r.score}/50</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
