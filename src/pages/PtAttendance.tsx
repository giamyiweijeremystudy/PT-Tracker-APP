import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ClipboardCheck, Check, X } from 'lucide-react';

const mockAttendance = [
  { date: '2026-04-09', session: 'Morning PT', status: 'present' as const },
  { date: '2026-04-08', session: 'IPPT Training', status: 'present' as const },
  { date: '2026-04-07', session: 'Morning PT', status: 'absent' as const },
  { date: '2026-04-04', session: 'Swim Training', status: 'present' as const },
  { date: '2026-04-03', session: 'Morning PT', status: 'present' as const },
  { date: '2026-04-02', session: 'Run Session', status: 'excused' as const },
  { date: '2026-04-01', session: 'Morning PT', status: 'present' as const },
];

const statusConfig = {
  present: { label: 'Present', className: 'bg-success/20 text-success' },
  absent: { label: 'Absent', className: 'bg-destructive/20 text-destructive' },
  excused: { label: 'Excused', className: 'bg-warning/20 text-warning' },
};

export default function PtAttendance() {
  const total = mockAttendance.length;
  const present = mockAttendance.filter(a => a.status === 'present').length;
  const rate = Math.round((present / total) * 100);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ClipboardCheck className="h-7 w-7 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">PT Attendance</h1>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-foreground">{rate}%</div>
            <div className="text-xs text-muted-foreground">Attendance Rate</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-success">{present}</div>
            <div className="text-xs text-muted-foreground">Present</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-destructive">{total - present}</div>
            <div className="text-xs text-muted-foreground">Missed</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Attendance Record</CardTitle>
          <CardDescription>Your PT session attendance history</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Session</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockAttendance.map((a, i) => (
                <TableRow key={i}>
                  <TableCell className="text-muted-foreground">{a.date}</TableCell>
                  <TableCell className="font-medium">{a.session}</TableCell>
                  <TableCell>
                    <Badge className={statusConfig[a.status].className}>{statusConfig[a.status].label}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
