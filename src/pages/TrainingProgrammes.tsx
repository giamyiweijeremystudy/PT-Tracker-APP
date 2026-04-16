import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dumbbell, Waves, Timer, Target, ChevronDown, ChevronUp,
  Flame, Clock, BarChart2, Zap, Heart, Shield, Trophy,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced';
type Category   = 'Running' | 'IPPT' | 'Strength' | 'Swimming' | 'Home' | 'SFT';

interface Module {
  label: string;        // e.g. "Week 1–2"
  focus: string;
  sessions: Session[];
  tips?: string[];
}

interface Session {
  name: string;
  exercises: string[];
}

interface Program {
  id: string;
  title: string;
  subtitle: string;
  category: Category;
  difficulty: Difficulty;
  duration: string;       // e.g. "8 weeks"
  frequency: string;      // e.g. "3×/week"
  goal: string;
  icon: typeof Dumbbell;
  color: string;          // tailwind bg class for accent
  textColor: string;
  modules: Module[];
}

// ─── Program Data ─────────────────────────────────────────────────────────────

const PROGRAMS: Program[] = [

  // ── IPPT PROGRAMS ──────────────────────────────────────────────────────────

  {
    id: 'ippt-beginner',
    title: 'IPPT Beginner',
    subtitle: 'Build your base from scratch',
    category: 'IPPT',
    difficulty: 'Beginner',
    duration: '8 weeks',
    frequency: '4×/week',
    goal: 'Achieve IPPT Pass (51 pts)',
    icon: Target,
    color: 'bg-green-500',
    textColor: 'text-green-600',
    modules: [
      {
        label: 'Weeks 1–2',
        focus: 'Foundation & Form',
        sessions: [
          { name: 'Push-up Day', exercises: ['3×10 knee push-ups', '3×10 incline push-ups', 'Plank 3×20s', 'Rest 90s between sets'] },
          { name: 'Sit-up Day', exercises: ['3×15 crunches', '3×10 partial sit-ups', 'Leg raises 3×10', 'Hollow hold 3×15s'] },
          { name: 'Run Day', exercises: ['Walk/run 20 min (1 min run : 2 min walk)', 'Focus on breathing rhythm', 'Cool-down walk 5 min'] },
        ],
        tips: ['Focus on full range of motion, not reps', 'Sleep 7–8 hrs — recovery is training'],
      },
      {
        label: 'Weeks 3–4',
        focus: 'Building Volume',
        sessions: [
          { name: 'Push-up Day', exercises: ['4×15 standard push-ups', 'Wide push-ups 3×12', 'Plank 3×30s', 'Wall push-ups cool-down'] },
          { name: 'Sit-up Day', exercises: ['4×20 sit-ups (IPPT form)', 'Bicycle crunches 3×20', 'Flutter kicks 3×20s'] },
          { name: 'Run Day', exercises: ['Continuous jog 25 min', 'Target easy pace (no gasping)', '2× strides at end'] },
        ],
        tips: ['IPPT sit-up: arms crossed on chest, full sit-up each rep', 'Hydrate well before run sessions'],
      },
      {
        label: 'Weeks 5–6',
        focus: 'Increasing Intensity',
        sessions: [
          { name: 'Push-up Day', exercises: ['5×20 push-ups', 'Tempo push-ups 3×10 (3s down)', 'Diamond push-ups 3×8', 'Max set to finish'] },
          { name: 'Sit-up Day', exercises: ['5×25 sit-ups', 'V-ups 3×15', 'Ab wheel / plank 3×45s'] },
          { name: 'Run Day', exercises: ['30 min run at moderate pace', '4× 200m pick-ups at end', 'Target sub-16:00 for 2.4km'] },
          { name: 'Combo Day', exercises: ['3 rounds: 20 push-ups + 20 sit-ups + 800m run', 'Rest 3 min between rounds'] },
        ],
        tips: ['Track your 2.4km time this week as a benchmark'],
      },
      {
        label: 'Weeks 7–8',
        focus: 'Peak & Taper',
        sessions: [
          { name: 'Push-up Day', exercises: ['Max rep test (rest 2 min), then 3×80% of max', 'Practice IPPT pacing (2 min count)'] },
          { name: 'Sit-up Day', exercises: ['Max rep test, then 3×80% of max', 'Core cool-down 10 min'] },
          { name: 'Run Day', exercises: ['2.4km time trial', 'Light 20 min jog mid-week', 'Rest 3 days before IPPT'] },
        ],
        tips: ['Taper volume in week 8 — trust your training', 'Race-day breakfast: carbs 2 hrs before'],
      },
    ],
  },

  {
    id: 'ippt-intermediate',
    title: 'IPPT Intermediate',
    subtitle: 'Push from Pass to Silver',
    category: 'IPPT',
    difficulty: 'Intermediate',
    duration: '8 weeks',
    frequency: '5×/week',
    goal: 'Achieve IPPT Silver (75+ pts)',
    icon: Target,
    color: 'bg-blue-500',
    textColor: 'text-blue-600',
    modules: [
      {
        label: 'Weeks 1–2',
        focus: 'Reassess & Rebuild',
        sessions: [
          { name: 'Push-up Block', exercises: ['5×25 push-ups (2 min rest)', 'Narrow push-ups 3×15', 'Pike push-ups 3×12', 'Band pull-aparts 3×15 (shoulder health)'] },
          { name: 'Sit-up Block', exercises: ['5×30 sit-ups', 'L-sit hold 3×10s', 'Weighted crunch 3×15'] },
          { name: 'Speed Intervals', exercises: ['Warm-up 1km', '6× 400m @ 5K pace, 90s rest', 'Cool-down 1km'] },
        ],
        tips: ['Your 2.4km pace for Silver: aim for sub-12:00 (age 22–24)'],
      },
      {
        label: 'Weeks 3–4',
        focus: 'Threshold Work',
        sessions: [
          { name: 'Push Strength', exercises: ['3×max push-ups (2 min rest)', 'Incline push-ups weighted 3×20', 'Tricep dips 3×15'] },
          { name: 'Core Power', exercises: ['4×35 sit-ups', 'Dragon flag negatives 3×5', 'Ab circuit 3 rounds: 20 flutter + 20 crunch + 10 V-up'] },
          { name: 'Tempo Run', exercises: ['2km warm-up', '3× 1km @ target 2.4km pace, 2 min rest', '1km cool-down'] },
          { name: 'Long Run', exercises: ['Easy 6–8km', 'Conversational pace', 'Focus on form: tall posture, midfoot strike'] },
        ],
      },
      {
        label: 'Weeks 5–6',
        focus: 'Specificity Phase',
        sessions: [
          { name: 'IPPT Sim', exercises: ['Full test simulation (timed)', 'Push-ups → 10 min rest → Sit-ups → 10 min rest → 2.4km', 'Log all scores'] },
          { name: 'Accessory', exercises: ['Bench dips 4×20', 'Hollow body holds 3×30s', 'Band rows 3×15', 'Hamstring stretches 10 min'] },
          { name: 'Speed Day', exercises: ['8× 200m sprints @ near-max, 60s rest', '2km easy recovery run'] },
        ],
        tips: ['Simulate race conditions: same shoes, same time of day'],
      },
      {
        label: 'Weeks 7–8',
        focus: 'Peak Performance',
        sessions: [
          { name: 'Power Sets', exercises: ['Explosive push-ups 5×15 (fast up, controlled down)', 'Kipping sit-ups 4×30', '400m time trial'] },
          { name: 'Final Taper', exercises: ['50% volume reduction', '2× 2.4km at goal pace', 'Mobility & stretching daily'] },
        ],
        tips: ['No new exercises in week 8', 'Pre-IPPT: light jog + 10 min stretch the day before'],
      },
    ],
  },

  {
    id: 'ippt-gold',
    title: 'IPPT Gold Chase',
    subtitle: 'Elite performance program',
    category: 'IPPT',
    difficulty: 'Advanced',
    duration: '10 weeks',
    frequency: '6×/week',
    goal: 'Achieve IPPT Gold (85+ pts)',
    icon: Trophy,
    color: 'bg-yellow-500',
    textColor: 'text-yellow-600',
    modules: [
      {
        label: 'Weeks 1–3',
        focus: 'Volume Accumulation',
        sessions: [
          { name: 'Push Volume', exercises: ['100 push-ups total (break as needed)', 'Ring push-ups 3×15', 'Archer push-ups 3×8 each side'] },
          { name: 'Sit-up Volume', exercises: ['100 sit-ups total', 'Weighted sit-ups 4×20 (5kg plate)', 'Toes-to-bar 3×10'] },
          { name: 'Run', exercises: ['10km easy Mon + Fri', '8× 400m Tue, 90s rest', 'Tempo 5km Thu @ 2.4km race pace +15s'] },
        ],
      },
      {
        label: 'Weeks 4–6',
        focus: 'Intensity & Speed',
        sessions: [
          { name: 'Max Strength', exercises: ['5×max push-ups to failure', 'Weighted push-ups 3×20 (+10kg plate)', 'One-arm negatives 3×5 each'] },
          { name: 'Power Core', exercises: ['5×max sit-ups to failure', 'Decline sit-ups 4×25', 'Med ball slams 3×15'] },
          { name: 'Speed', exercises: ['12× 200m @ 800m race pace, 45s rest', 'Mile time trial Friday'] },
          { name: 'Long Run', exercises: ['12km steady @ easy pace'] },
        ],
        tips: ['Gold 2.4km target: sub-9:30 (age <22), sub-10:10 (age 22–24)'],
      },
      {
        label: 'Weeks 7–9',
        focus: 'Race-Specific Sharpening',
        sessions: [
          { name: 'IPPT Full Sim', exercises: ['Full test 2×/week (Mon & Thu)', 'Track all scores and improvement', 'Target: 60 PU / 60 SU / sub-10:00'] },
          { name: 'Speed Endurance', exercises: ['3× 800m @ target pace, 3 min rest', '4× 400m faster, 2 min rest'] },
        ],
      },
      {
        label: 'Week 10',
        focus: 'Race Week',
        sessions: [
          { name: 'Monday', exercises: ['20 min easy jog', '10 min mobility'] },
          { name: 'Tuesday', exercises: ['4× 200m strides', '10 min stretch'] },
          { name: 'Wed–Thu', exercises: ['Complete rest or light walk'] },
          { name: 'Race Day', exercises: ['Warm-up: 5 min jog + 4 strides', 'Push-ups: pace yourself (don\'t max out rep 1)', 'Sit-ups: steady rhythm', '2.4km: go out controlled, negative split if possible'] },
        ],
      },
    ],
  },

  // ── RUNNING PROGRAMS ───────────────────────────────────────────────────────

  {
    id: 'run-beginner',
    title: 'Beginner Running',
    subtitle: 'From couch to continuous 5K',
    category: 'Running',
    difficulty: 'Beginner',
    duration: '6 weeks',
    frequency: '3×/week',
    goal: 'Run 5km without stopping',
    icon: Timer,
    color: 'bg-emerald-500',
    textColor: 'text-emerald-600',
    modules: [
      {
        label: 'Weeks 1–2',
        focus: 'Run-Walk Intervals',
        sessions: [
          { name: 'Session A (×3/week)', exercises: ['5 min brisk walk warm-up', '8× (1 min run / 2 min walk)', '5 min cool-down walk', 'Total ~30 min'] },
        ],
        tips: ['Run at a conversational pace — if you can\'t speak, slow down', 'Wear proper running shoes to prevent injury'],
      },
      {
        label: 'Weeks 3–4',
        focus: 'Extending Run Intervals',
        sessions: [
          { name: 'Session A', exercises: ['5× (3 min run / 1.5 min walk)', 'Total ~25 min running'] },
          { name: 'Session B', exercises: ['3× (5 min run / 2 min walk)', 'Total ~25 min running'] },
          { name: 'Session C', exercises: ['Continuous jog 20 min — very easy pace'] },
        ],
        tips: ['Slow down if you need to — finishing matters more than pace'],
      },
      {
        label: 'Weeks 5–6',
        focus: 'Continuous Running',
        sessions: [
          { name: 'Session A', exercises: ['25 min continuous easy run'] },
          { name: 'Session B', exercises: ['30 min continuous run', 'Include 1 gentle hill if available'] },
          { name: 'Session C (Week 6)', exercises: ['5km run — your first!', 'Any pace, no walking', 'Celebrate 🎉'] },
        ],
      },
    ],
  },

  {
    id: 'run-intermediate',
    title: 'Intermediate Running',
    subtitle: 'Build speed and endurance',
    category: 'Running',
    difficulty: 'Intermediate',
    duration: '8 weeks',
    frequency: '4×/week',
    goal: 'Run 10km & improve 2.4km time',
    icon: Timer,
    color: 'bg-teal-500',
    textColor: 'text-teal-600',
    modules: [
      {
        label: 'Weeks 1–2',
        focus: 'Easy Base',
        sessions: [
          { name: 'Mon — Easy', exercises: ['4km easy run (conversational pace)'] },
          { name: 'Wed — Intervals', exercises: ['2km warm-up', '6× 400m @ hard effort, 90s jog recovery', '1km cool-down'] },
          { name: 'Fri — Tempo', exercises: ['1km warm-up', '3km @ comfortably hard pace', '1km cool-down'] },
          { name: 'Sun — Long Run', exercises: ['7km easy, even pace'] },
        ],
      },
      {
        label: 'Weeks 3–5',
        focus: 'Building Mileage',
        sessions: [
          { name: 'Easy Runs', exercises: ['2× 5km easy runs per week'] },
          { name: 'Speed Session', exercises: ['8× 400m @ 5K race effort, 75s rest'] },
          { name: 'Tempo', exercises: ['4km tempo (pushing but controlled)'] },
          { name: 'Long Run', exercises: ['Week 3: 8km', 'Week 4: 9km', 'Week 5: 10km'] },
        ],
        tips: ['80% of your runs should feel easy', 'Only 20% hard — more is not better'],
      },
      {
        label: 'Weeks 6–8',
        focus: 'Speed & Race Prep',
        sessions: [
          { name: 'Track Session', exercises: ['1200m + 800m + 400m @ race pace, equal rest'] },
          { name: '2.4km Time Trial', exercises: ['Full warm-up 2km', 'All-out 2.4km effort', 'Log time and compare to week 1'] },
          { name: 'Long Run', exercises: ['10km steady state'] },
        ],
      },
    ],
  },

  // ── STRENGTH PROGRAMS ──────────────────────────────────────────────────────

  {
    id: 'strength-home',
    title: 'Home / Camp Strength',
    subtitle: 'No equipment needed',
    category: 'Strength',
    difficulty: 'Beginner',
    duration: '4 weeks',
    frequency: '4×/week',
    goal: 'Full-body strength with bodyweight',
    icon: Dumbbell,
    color: 'bg-orange-500',
    textColor: 'text-orange-600',
    modules: [
      {
        label: 'Push Day (Mon & Thu)',
        focus: 'Chest, Shoulders, Triceps',
        sessions: [
          { name: 'Circuit (3 rounds)', exercises: ['Push-ups ×max', 'Wide push-ups ×15', 'Diamond push-ups ×10', 'Pike push-ups ×12', 'Plank shoulder taps ×20', 'Rest 90s between rounds'] },
        ],
        tips: ['Keep core tight throughout — no sagging hips'],
      },
      {
        label: 'Pull Day (Tue & Fri)',
        focus: 'Back, Biceps, Rear Delts',
        sessions: [
          { name: 'Circuit (3 rounds)', exercises: ['Pull-ups ×max (or towel rows)', 'Inverted rows ×15', 'Superman holds ×20', 'Face pulls with band ×15', 'Reverse snow angels ×15'] },
        ],
      },
      {
        label: 'Leg Day (Wed)',
        focus: 'Quads, Hamstrings, Glutes',
        sessions: [
          { name: 'Circuit (3 rounds)', exercises: ['Squats ×25', 'Reverse lunges ×15 each', 'Glute bridges ×20', 'Wall sit ×45s', 'Calf raises ×30', 'Jump squats ×10 (power)'] },
        ],
      },
      {
        label: 'Weekend Cardio',
        focus: 'Conditioning & Endurance',
        sessions: [
          { name: 'HIIT Circuit (4 rounds)', exercises: ['Burpees ×15', 'Mountain climbers ×30', 'High knees ×30s', 'Jumping jacks ×40', 'Rest 60s'] },
        ],
        tips: ['HIIT should leave you breathing hard — that\'s the point'],
      },
    ],
  },

  {
    id: 'strength-intermediate',
    title: 'Calisthenics Strength',
    subtitle: 'Master advanced bodyweight',
    category: 'Strength',
    difficulty: 'Intermediate',
    duration: '6 weeks',
    frequency: '5×/week',
    goal: 'Muscle-up, pistol squat, planche lean',
    icon: Dumbbell,
    color: 'bg-rose-500',
    textColor: 'text-rose-600',
    modules: [
      {
        label: 'Weeks 1–2',
        focus: 'Strength Foundations',
        sessions: [
          { name: 'Upper Push', exercises: ['5×5 pseudo planche push-ups', 'Archer push-ups 4×6 each', 'Pike push-ups 4×10'] },
          { name: 'Upper Pull', exercises: ['5×5 weighted pull-ups (+5kg)', 'L-sit pull-ups 3×5', 'Tuck front lever rows 3×8'] },
          { name: 'Lower', exercises: ['Bulgarian split squats 4×8 each', 'Nordic curl negatives 3×5', 'Shrimp squat progression 3×6 each'] },
        ],
      },
      {
        label: 'Weeks 3–4',
        focus: 'Skill Development',
        sessions: [
          { name: 'Muscle-up Prep', exercises: ['Bar dips 5×10 (weighted)', 'High pull-ups 4×6 (chin above bar)', 'False grip hangs 3×20s', 'Transition practice ×10'] },
          { name: 'Planche Progression', exercises: ['Planche lean 5×30s', 'Tuck planche 3×15s', 'Advanced tuck planche 3×8s'] },
        ],
      },
      {
        label: 'Weeks 5–6',
        focus: 'Integration & Strength Tests',
        sessions: [
          { name: 'Full Session', exercises: ['Muscle-up attempts ×5 sets', 'Handstand push-up negatives 4×5', 'One-arm push-up progression 3×5 each', 'Pistol squat practice 4×5 each'] },
        ],
        tips: ['Film yourself to check form on muscle-up transition'],
      },
    ],
  },

  // ── SWIMMING PROGRAMS ──────────────────────────────────────────────────────

  {
    id: 'swim-beginner',
    title: 'Beginner Swimming',
    subtitle: 'Build comfort and technique',
    category: 'Swimming',
    difficulty: 'Beginner',
    duration: '4 weeks',
    frequency: '3×/week',
    goal: 'Swim 500m continuously',
    icon: Waves,
    color: 'bg-cyan-500',
    textColor: 'text-cyan-600',
    modules: [
      {
        label: 'Week 1',
        focus: 'Water Comfort & Breathing',
        sessions: [
          { name: 'Pool Session', exercises: ['4× 25m freestyle (rest 60s)', 'Kicking drills 4× 25m (board)', 'Breathing drill: exhale underwater', 'Total ~400m'] },
        ],
        tips: ['Bilateral breathing: breathe every 3 strokes', 'Relax — tension makes you sink'],
      },
      {
        label: 'Week 2',
        focus: 'Technique',
        sessions: [
          { name: 'Drills + Distance', exercises: ['Catch-up drill 4× 25m', 'Fingertip drag drill 4× 25m', '4× 50m steady freestyle (rest 60s)'] },
        ],
      },
      {
        label: 'Weeks 3–4',
        focus: 'Building Distance',
        sessions: [
          { name: 'Week 3', exercises: ['8× 50m (30s rest)', '2× 100m (90s rest)'] },
          { name: 'Week 4', exercises: ['4× 100m (45s rest)', '1× 200m continuous', '1× 500m attempt'] },
        ],
      },
    ],
  },

  // ── SFT PROGRAM ────────────────────────────────────────────────────────────

  {
    id: 'sft-prep',
    title: 'SFT Preparation',
    subtitle: 'Sport-specific conditioning',
    category: 'SFT',
    difficulty: 'Intermediate',
    duration: '6 weeks',
    frequency: '4×/week',
    goal: 'Peak performance in SFT events',
    icon: Shield,
    color: 'bg-violet-500',
    textColor: 'text-violet-600',
    modules: [
      {
        label: 'Weeks 1–2',
        focus: 'Athleticism Base',
        sessions: [
          { name: 'Agility', exercises: ['Ladder drills 15 min', 'T-drill 6×', '5-10-5 shuttle 6×', 'Box jumps 4×8'] },
          { name: 'Strength', exercises: ['Squats 4×12', 'Deadlifts 4×8', 'Pull-ups 4×max', 'Plank circuit 10 min'] },
          { name: 'Cardio Base', exercises: ['3km easy run', '6× 100m sprints', 'Jump rope 5 min'] },
        ],
        tips: ['SFT scores on technique AND fitness — practice sport skills separately'],
      },
      {
        label: 'Weeks 3–4',
        focus: 'Sport-Specific Power',
        sessions: [
          { name: 'Power Circuit', exercises: ['3 rounds: 10 box jumps + 10 power cleans + 200m sprint', 'Rest 3 min between rounds'] },
          { name: 'Game Day Simulation', exercises: ['30 min of your SFT sport', 'Focus on competitive effort', 'Cool-down + stretching 15 min'] },
        ],
      },
      {
        label: 'Weeks 5–6',
        focus: 'Peak & Taper',
        sessions: [
          { name: 'Full Simulation', exercises: ['Complete SFT event simulation at competition intensity', 'Rest 48 hrs after each simulation'] },
          { name: 'Active Recovery', exercises: ['Light swim or jog 20 min', 'Mobility work 20 min', 'Full rest 2 days before SFT'] },
        ],
      },
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CATEGORIES: { id: Category | 'All'; label: string }[] = [
  { id: 'All',      label: 'All' },
  { id: 'IPPT',     label: 'IPPT' },
  { id: 'Running',  label: 'Running' },
  { id: 'Strength', label: 'Strength' },
  { id: 'Swimming', label: 'Swimming' },
  { id: 'SFT',      label: 'SFT' },
];

const DIFF_STYLE: Record<Difficulty, string> = {
  Beginner:     'bg-green-100 text-green-700 border-green-200',
  Intermediate: 'bg-blue-100 text-blue-700 border-blue-200',
  Advanced:     'bg-red-100 text-red-700 border-red-200',
};

const DIFF_ICON: Record<Difficulty, typeof Flame> = {
  Beginner:     Heart,
  Intermediate: Zap,
  Advanced:     Flame,
};

// ─── ProgramCard ──────────────────────────────────────────────────────────────

function ProgramCard({ prog, onOpen }: { prog: Program; onOpen: () => void }) {
  const DiffIcon = DIFF_ICON[prog.difficulty];
  const Icon = prog.icon;
  return (
    <div
      onClick={onOpen}
      className="group rounded-2xl border bg-card shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden"
    >
      {/* Accent bar */}
      <div className={`h-1.5 w-full ${prog.color}`} />
      <div className="p-4 space-y-3">
        <div className="flex items-start gap-3">
          <div className={`h-10 w-10 rounded-xl ${prog.color} flex items-center justify-center shrink-0`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-sm leading-tight">{prog.title}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{prog.subtitle}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium ${DIFF_STYLE[prog.difficulty]}`}>
            <DiffIcon className="h-3 w-3" />{prog.difficulty}
          </span>
          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
            <Clock className="h-3 w-3" />{prog.duration}
          </span>
          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
            <BarChart2 className="h-3 w-3" />{prog.frequency}
          </span>
        </div>

        <p className="text-xs text-muted-foreground border-t pt-2">
          <span className="font-medium text-foreground">Goal:</span> {prog.goal}
        </p>
      </div>
    </div>
  );
}

// ─── ModuleBlock ──────────────────────────────────────────────────────────────

function ModuleBlock({ mod }: { mod: Module }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border overflow-hidden">
      <button
        onClick={() => setOpen((o: boolean) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-muted/40 hover:bg-muted/70 transition-colors text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-primary">{mod.label}</span>
            <span className="text-sm font-semibold">{mod.focus}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{mod.sessions.length} session{mod.sessions.length !== 1 ? 's' : ''}</p>
        </div>
        {open ? <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />}
      </button>

      {open && (
        <div className="px-4 py-3 space-y-4 bg-card">
          {mod.sessions.map((sess, i) => (
            <div key={i}>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">{sess.name}</p>
              <ul className="space-y-1">
                {sess.exercises.map((ex, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm">
                    <span className="text-primary font-bold mt-0.5">·</span>
                    <span>{ex}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {mod.tips && mod.tips.length > 0 && (
            <div className="rounded-lg bg-primary/5 border border-primary/20 px-3 py-2 space-y-1">
              <p className="text-xs font-semibold text-primary">Coach Tips</p>
              {mod.tips.map((tip, i) => (
                <p key={i} className="text-xs text-muted-foreground">💡 {tip}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── ProgramDetail ────────────────────────────────────────────────────────────

function ProgramDetail({ prog, onBack }: { prog: Program; onBack: () => void }) {
  const DiffIcon = DIFF_ICON[prog.difficulty];
  const Icon = prog.icon;
  return (
    <div className="space-y-5">
      {/* Back */}
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        ← Back to Programs
      </button>

      {/* Header */}
      <div className="rounded-2xl border bg-card overflow-hidden shadow-sm">
        <div className={`h-2 w-full ${prog.color}`} />
        <div className="p-5">
          <div className="flex items-start gap-4">
            <div className={`h-12 w-12 rounded-xl ${prog.color} flex items-center justify-center shrink-0`}>
              <Icon className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold">{prog.title}</h2>
              <p className="text-sm text-muted-foreground mt-0.5">{prog.subtitle}</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'Level', value: prog.difficulty, icon: DiffIcon },
              { label: 'Duration', value: prog.duration, icon: Clock },
              { label: 'Frequency', value: prog.frequency, icon: BarChart2 },
              { label: 'Category', value: prog.category, icon: Zap },
            ].map(({ label, value, icon: I }) => (
              <div key={label} className="rounded-lg bg-muted/50 px-3 py-2 text-center">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-sm font-semibold mt-0.5">{value}</p>
              </div>
            ))}
          </div>

          <div className="mt-3 rounded-lg bg-primary/5 border border-primary/20 px-3 py-2">
            <p className="text-xs text-muted-foreground"><span className="font-semibold text-primary">Goal:</span> {prog.goal}</p>
          </div>
        </div>
      </div>

      {/* Modules */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1">
          Program Modules — tap to expand
        </p>
        {prog.modules.map((mod, i) => (
          <ModuleBlock key={i} mod={mod} />
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TrainingProgrammes() {
  const [activeCategory, setActiveCategory] = useState<Category | 'All'>('All');
  const [selected, setSelected] = useState<Program | null>(null);

  const filtered = activeCategory === 'All'
    ? PROGRAMS
    : PROGRAMS.filter(p => p.category === activeCategory);

  if (selected) {
    return (
      <div className="max-w-2xl mx-auto pb-10">
        <ProgramDetail prog={selected} onBack={() => setSelected(null)} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Dumbbell className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Training Programs</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{PROGRAMS.length} programs across {CATEGORIES.length - 1} categories</p>
        </div>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold border transition-colors
              ${activeCategory === cat.id
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background text-muted-foreground border-border hover:bg-muted'
              }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Program grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filtered.map(prog => (
          <ProgramCard key={prog.id} prog={prog} onOpen={() => setSelected(prog)} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Dumbbell className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No programs in this category yet.</p>
        </div>
      )}
    </div>
  );
}
