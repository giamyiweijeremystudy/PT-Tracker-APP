import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Calendar, Plus, Trash2, Users, User, AlertCircle, X } from 'lucide-react';

// ─── Local date helper (respects device timezone, e.g. UTC+8) ─────────────────
function localDateStr(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}


// ─── Singapore Public Holidays ────────────────────────────────────────────────
const SG_HOLIDAYS: Record<string, string> = {
  '2025-01-01':"New Year's Day",'2025-01-29':'Chinese New Year','2025-01-30':'Chinese New Year',
  '2025-03-31':'Hari Raya Puasa','2025-04-18':'Good Friday','2025-05-01':'Labour Day',
  '2025-05-12':'Vesak Day','2025-06-07':'Hari Raya Haji','2025-08-09':'National Day',
  '2025-10-20':'Deepavali','2025-12-25':'Christmas Day',
  '2026-01-01':"New Year's Day",'2026-02-17':'Chinese New Year','2026-02-18':'Chinese New Year',
  '2026-03-20':'Hari Raya Puasa','2026-04-03':'Good Friday','2026-05-01':'Labour Day',
  '2026-05-31':'Vesak Day','2026-05-27':'Hari Raya Haji','2026-08-09':'National Day',
  '2026-11-08':'Deepavali','2026-12-25':'Christmas Day',
  '2024-01-01':"New Year's Day",'2024-02-10':'Chinese New Year','2024-02-11':'Chinese New Year',
  '2024-04-10':'Hari Raya Puasa','2024-03-29':'Good Friday','2024-05-01':'Labour Day',
  '2024-05-22':'Vesak Day','2024-06-17':'Hari Raya Haji','2024-08-09':'National Day',
  '2024-10-31':'Deepavali','2024-12-25':'Christmas Day',
};

// ─── Calendar helpers ─────────────────────────────────────────────────────────
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
function getDaysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate(); }
function getFirstDayOfWeek(y: number, m: number) { return new Date(y, m, 1).getDay(); }

// ─── Types ────────────────────────────────────────────────────────────────────
type PersonalEvent = {
  id: string; user_id: string;
  title: string; description: string;
  event_date: string; event_type: string;
  source: 'personal' | 'team';
  team_event_id: string | null;
  created_at: string;
};

const EVENT_TYPE_STYLE: Record<string, string> = {
  PT:       'bg-blue-100 text-blue-700 border-blue-200',
  SFT:      'bg-green-100 text-green-700 border-green-200',
  Personal: 'bg-purple-100 text-purple-700 border-purple-200',
  Other:    'bg-muted text-muted-foreground border-border',
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function Schedule() {
  const { user } = useAuth();
  const { toast } = useToast();

  const today      = new Date();
  const todayStr   = localDateStr(today);

  const [events, setEvents]         = useState<PersonalEvent[]>([]);
  const [calYear, setCalYear]       = useState(today.getFullYear());
  const [calMonth, setCalMonth]     = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(today.getDate());

  // Add event form
  const [showForm, setShowForm]     = useState(false);
  const [evtTitle, setEvtTitle]     = useState('');
  const [evtDesc, setEvtDesc]       = useState('');
  const [evtDate, setEvtDate]       = useState(todayStr);
  const [evtType, setEvtType]       = useState<'PT'|'SFT'|'Personal'|'Other'>('Personal');
  const [saving, setSaving]         = useState(false);
  const [deleting, setDeleting]     = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('personal_events')
      .select('*')
      .eq('user_id', user.id)
      .order('event_date', { ascending: true });
    if (data) setEvents(data as PersonalEvent[]);
  }, [user]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const dateKey = (y: number, m: number, d: number) =>
    `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

  const eventsOnDay  = (d: number) => events.filter(e => e.event_date === dateKey(calYear, calMonth, d));
  const holidayOnDay = (d: number) => SG_HOLIDAYS[dateKey(calYear, calMonth, d)];
  const isToday      = (d: number) => dateKey(calYear, calMonth, d) === todayStr;

  const selectedDateKey    = selectedDay ? dateKey(calYear, calMonth, selectedDay) : '';
  const selectedDayEvents  = selectedDay ? eventsOnDay(selectedDay) : [];
  const selectedHoliday    = selectedDay ? holidayOnDay(selectedDay) : null;

  const prevMonth = () => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); } else setCalMonth(m => m - 1); setSelectedDay(null); };
  const nextMonth = () => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); } else setCalMonth(m => m + 1); setSelectedDay(null); };

  const handleAdd = async () => {
    if (!evtTitle.trim() || !evtDate) { toast({ title: 'Enter a title and date', variant: 'destructive' }); return; }
    setSaving(true);
    const { error } = await supabase.from('personal_events').insert({
      user_id: user!.id,
      title: evtTitle.trim(),
      description: evtDesc.trim(),
      event_date: evtDate,
      event_type: evtType,
      source: 'personal',
    });
    setSaving(false);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Event added!' });

    // ── Trigger notifications ──────────────────────────────────────────────
    // Fire-and-forget: send immediately if event is today and it's past 07:00,
    // otherwise the scheduled edge function (cron) sends it at 07:00.
    try {
      const now        = new Date();
      const eventIsToday = evtDate === todayStr;
      const isPast7am  = now.getHours() >= 7;
      if (eventIsToday && isPast7am) {
        const typeLabel = evtType === 'PT' ? '🪖 PT' : evtType === 'SFT' ? '🏃 SFT' : evtType === 'Personal' ? '📌 Personal' : '📅';
        supabase.functions.invoke('send-notifications', {
          body: {
            user_id:  user!.id,
            title:    `${typeLabel}: ${evtTitle.trim()}`,
            body:     evtDesc.trim()
              ? `Today — ${evtDesc.trim()}`
              : `You have a ${evtType} event scheduled for today.`,
            url:      '/schedule',
            channels: ['push', 'email'],
          },
        }).catch(() => {}); // non-blocking
      }
    } catch (_) { /* notifications are best-effort */ }

    setEvtTitle(''); setEvtDesc(''); setEvtType('Personal');
    setShowForm(false);
    fetchEvents();
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    await supabase.from('personal_events').delete().eq('id', id);
    setDeleting(null);
    fetchEvents();
    toast({ title: 'Event removed' });
  };

  // Upcoming events (next 30 days)
  const upcomingEnd = new Date(today); upcomingEnd.setDate(upcomingEnd.getDate() + 30);
  const upcomingEndStr = localDateStr(upcomingEnd);
  const upcomingEvents = events.filter(e => e.event_date >= todayStr && e.event_date <= upcomingEndStr)
    .sort((a, b) => a.event_date.localeCompare(b.event_date));

  const daysInMonth    = getDaysInMonth(calYear, calMonth);
  const firstDayOfWeek = getFirstDayOfWeek(calYear, calMonth);

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="h-7 w-7 text-primary" />
          <h1 className="text-2xl font-bold">My Schedule</h1>
        </div>
        <Button size="sm" onClick={() => { setEvtDate(selectedDateKey || todayStr); setShowForm(true); }}>
          <Plus className="h-4 w-4 mr-1" /> Add Event
        </Button>
      </div>

      {/* Add event form */}
      {showForm && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">New Event</CardTitle>
              <button onClick={() => setShowForm(false)} className="p-1 rounded hover:bg-muted text-muted-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input placeholder="e.g. Morning run" value={evtTitle} onChange={e => setEvtTitle(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Date</Label>
                <Input type="date" value={evtDate} onChange={e => setEvtDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={evtType} onValueChange={v => setEvtType(v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Personal">Personal</SelectItem>
                    <SelectItem value="PT">PT</SelectItem>
                    <SelectItem value="SFT">SFT</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Description <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Textarea placeholder="Details..." value={evtDesc} onChange={e => setEvtDesc(e.target.value)} rows={2} />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAdd} disabled={saving} className="flex-1">
                {saving ? 'Saving...' : 'Save Event'}
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Calendar */}
      <Card>
        <CardContent className="pt-4 px-3 pb-3">
          <div className="flex items-center justify-between mb-3 px-1">
            <button onClick={prevMonth} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">‹</button>
            <span className="text-sm font-semibold">{MONTHS[calMonth]} {calYear}</span>
            <button onClick={nextMonth} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">›</button>
          </div>

          <div className="grid grid-cols-7 mb-1">
            {DAYS.map(d => <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">{d}</div>)}
          </div>

          <div className="grid grid-cols-7 gap-y-1">
            {Array.from({ length: firstDayOfWeek }).map((_, i) => <div key={`e-${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const d          = i + 1;
              const isSelected  = selectedDay === d;
              const todayMark   = isToday(d);
              const dayEvts     = eventsOnDay(d);
              const isHoliday   = !!holidayOnDay(d);
              const hasPersonal = dayEvts.some(e => e.source === 'personal');
              const hasTeam     = dayEvts.some(e => e.source === 'team');
              // Build ring segments: holiday=red, team=green-500, personal=purple
              const segments: string[] = [];
              if (isHoliday)   segments.push('#f87171');
              if (hasTeam)     segments.push('#22c55e');
              if (hasPersonal) segments.push('#a855f7');
              // Ring always shows when segments exist — including on selected/today days
              // Use r=19 so the arc sits OUTSIDE the 18px filled circle (h-9 w-9 = 36px, radius=18)
              const showRing = segments.length > 0;
              const rRing = 19, circRing = 2 * Math.PI * rRing;
              const gap = 2;
              const n = segments.length;
              const segLen = (circRing - n * gap) / n;
              return (
                <button key={d} onClick={() => setSelectedDay(isSelected ? null : d)}
                  className={`relative mx-auto flex items-center justify-center text-sm transition-colors rounded-full
                    ${showRing ? 'h-10 w-10' : 'h-9 w-9'}
                    ${isSelected ? 'bg-primary text-primary-foreground font-semibold' : ''}
                    ${todayMark && !isSelected ? 'text-primary font-semibold' : ''}
                    ${isHoliday && !isSelected && !todayMark ? 'text-red-500' : ''}
                    ${!isSelected && !todayMark && !isHoliday ? 'hover:bg-muted text-foreground' : ''}`}>
                  {/* Today indicator — solid ring drawn inside the button */}
                  {todayMark && !isSelected && (
                    <span className="absolute rounded-full border-2 border-primary pointer-events-none"
                      style={{ inset: showRing ? '3px' : '0' }} />
                  )}
                  {/* Event rings — drawn outside, always on top */}
                  {showRing && (
                    <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
                      viewBox="0 0 40 40" style={{ transform: 'rotate(-90deg)' }}>
                      {segments.map((color, si) => {
                        const offset = si * (segLen + gap);
                        return (
                          <circle key={si}
                            cx="20" cy="20" r={rRing}
                            fill="none"
                            stroke={color}
                            strokeWidth="2.5"
                            strokeDasharray={`${segLen} ${circRing - segLen}`}
                            strokeDashoffset={-offset}
                            strokeLinecap="round"
                          />
                        );
                      })}
                    </svg>
                  )}
                  {d}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-3 mt-3 pt-2 border-t justify-center flex-wrap">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><span className="h-2 w-2 rounded-full bg-red-400 inline-block" /> Holiday</div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><span className="h-2 w-2 rounded-full bg-green-500 inline-block" /> Team</div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><span className="h-2 w-2 rounded-full bg-purple-500 inline-block" /> Personal</div>
          </div>
        </CardContent>
      </Card>

      {/* Selected day detail */}
      {selectedDay && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{selectedDay} {MONTHS[calMonth]} {calYear}</CardTitle>
              <Button variant="ghost" size="sm" className="h-7 text-xs"
                onClick={() => { setEvtDate(selectedDateKey); setShowForm(true); }}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Add
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {selectedHoliday && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 px-3 py-2">
                <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                <span className="text-sm font-medium text-red-700 dark:text-red-300">{selectedHoliday}</span>
                <Badge variant="outline" className="ml-auto text-xs border-red-300 text-red-600">Public Holiday</Badge>
              </div>
            )}

            {selectedDayEvents.length === 0 && !selectedHoliday && (
              <div className="text-center py-6 text-muted-foreground">
                <Calendar className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No events on this day</p>
              </div>
            )}

            {selectedDayEvents.map(e => (
              <div key={e.id} className="rounded-lg border bg-card p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold">{e.title}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${EVENT_TYPE_STYLE[e.event_type] ?? EVENT_TYPE_STYLE['Other']}`}>
                        {e.event_type}
                      </span>
                      {e.source === 'team'
                        ? <span className="flex items-center gap-1 text-xs text-blue-600"><Users className="h-3 w-3" /> Team</span>
                        : <span className="flex items-center gap-1 text-xs text-muted-foreground"><User className="h-3 w-3" /> Personal</span>
                      }
                    </div>
                    {e.description && <p className="text-xs text-muted-foreground mt-0.5">{e.description}</p>}
                  </div>
                  {/* Can only delete personal events */}
                  {e.source === 'personal' && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button disabled={deleting === e.id} className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-destructive transition-colors shrink-0">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remove event?</AlertDialogTitle>
                          <AlertDialogDescription>"{e.title}" will be permanently removed from your schedule.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(e.id)} className="bg-destructive text-destructive-foreground">Remove</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Upcoming 30 days */}
      {upcomingEvents.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1">Upcoming (next 30 days)</p>
          {upcomingEvents.map(e => {
            const d = new Date(e.event_date);
            const isEventToday = e.event_date === todayStr;
            return (
              <div key={e.id}
                className={`rounded-xl border bg-card p-3 flex items-center gap-3 cursor-pointer hover:bg-muted/40 transition-colors ${isEventToday ? 'border-primary' : ''}`}
                onClick={() => {
                  const parts = e.event_date.split('-');
                  setCalYear(parseInt(parts[0])); setCalMonth(parseInt(parts[1]) - 1); setSelectedDay(parseInt(parts[2]));
                }}>
                <div className={`text-center shrink-0 w-10 ${isEventToday ? 'text-primary' : 'text-muted-foreground'}`}>
                  <p className="text-xs font-medium">{MONTHS[d.getUTCMonth()].slice(0, 3).toUpperCase()}</p>
                  <p className="text-xl font-bold leading-none">{d.getUTCDate()}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold">{e.title}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${EVENT_TYPE_STYLE[e.event_type] ?? EVENT_TYPE_STYLE['Other']}`}>
                      {e.event_type}
                    </span>
                    {e.source === 'team' && <span className="flex items-center gap-1 text-xs text-blue-600"><Users className="h-3 w-3" /> Team</span>}
                  </div>
                  {e.description && <p className="text-xs text-muted-foreground mt-0.5 truncate">{e.description}</p>}
                </div>
                {isEventToday && <Badge className="shrink-0 text-xs">Today</Badge>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
