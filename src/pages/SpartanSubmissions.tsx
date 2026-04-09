import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Sword, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const RACE_TYPES = ['Sprint (5km)', 'Super (10km)', 'Beast (21km)', 'Ultra (50km)'];

const mockSubmissions = [
  { id: '1', name: 'SGT Tan', race: 'Sprint (5km)', time: '0:45:30', obstacles: 20, date: '2026-03-15' },
  { id: '2', name: 'CPL Lee', race: 'Super (10km)', time: '1:32:00', obstacles: 25, date: '2026-02-20' },
  { id: '3', name: 'PFC Ahmad', race: 'Beast (21km)', time: '3:15:45', obstacles: 30, date: '2026-01-10' },
];

export default function SpartanSubmissions() {
  const [showForm, setShowForm] = useState(false);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({ title: 'Submission recorded!' });
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Sword className="h-7 w-7 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Spartan Submissions</h1>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-1" /> New Submission
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Submit Race Result</CardTitle>
            <CardDescription>Record your Spartan race completion</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Race Type</Label>
                  <Select defaultValue="Sprint (5km)">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {RACE_TYPES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Completion Time (H:MM:SS)</Label>
                  <Input placeholder="1:30:00" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Obstacles Completed</Label>
                  <Input type="number" placeholder="20" required />
                </div>
                <div className="space-y-2">
                  <Label>Race Date</Label>
                  <Input type="date" required />
                </div>
              </div>
              <Button type="submit" className="w-full">Submit</Button>
            </CardContent>
          </form>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Recent Submissions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Race</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Obstacles</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockSubmissions.map(s => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell><Badge variant="outline">{s.race}</Badge></TableCell>
                  <TableCell>{s.time}</TableCell>
                  <TableCell>{s.obstacles}</TableCell>
                  <TableCell className="text-muted-foreground">{s.date}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
