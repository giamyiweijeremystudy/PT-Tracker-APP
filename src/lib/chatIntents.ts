// ─── Chat Intent Engine ───────────────────────────────────────────────────────
// Keyword extraction + dynamic topic routing. No hardcoded responses.

export type ActionType = 'navigate' | 'show_data' | 'tell_more';

export interface IntentAction {
  type:   ActionType;
  label:  string;
  route?: string;
  query?: string;
  faq?:   string;
}

export interface Intent {
  id:       string;
  name:     string;
  keywords: string[][];
  response: string;
  actions:  IntentAction[];
}

// ─── Topic detection ──────────────────────────────────────────────────────────
// Returns a set of detected topics from free text — used by the dynamic fetcher

export type Topic =
  | 'ippt' | 'bmi' | 'calories' | 'activities' | 'profile'
  | 'team' | 'members' | 'leaderboard' | 'at_risk'
  | 'schedule' | 'submissions' | 'programs' | 'chat';

const TOPIC_KEYWORDS: Record<Topic, string[]> = {
  ippt:        ['ippt', 'push-up', 'pushup', 'sit-up', 'situp', 'run', 'running', '2.4', '2.4km', 'gold', 'silver', 'pass', 'fail', 'award', 'pts', 'points', 'score', 'station'],
  bmi:         ['bmi', 'body', 'weight', 'height', 'overweight', 'underweight', 'obese', 'mass', 'index'],
  calories:    ['calorie', 'calories', 'kcal', 'tdee', 'bmr', 'diet', 'nutrition', 'intake', 'food', 'eat'],
  activities:  ['activit', 'workout', 'training', 'exercise', 'gym', 'swim', 'cycling', 'jog', 'log', 'logged', 'upload'],
  profile:     ['profile', 'stats', 'statistics', 'my stats', 'overview', 'progress', 'history', 'rank', 'age'],
  team:        ['team', 'squad', 'group', 'unit', 'members', 'teammate'],
  members:     ['member', 'members', 'teammate', 'who', 'list', 'people'],
  leaderboard: ['leaderboard', 'ranking', 'rank', 'top', 'best', 'compare', 'versus', 'standings', 'position'],
  at_risk:     ['at-risk', 'risk', 'inactive', 'failing', 'struggling', 'weak', 'poor', 'attendance'],
  schedule:    ['schedule', 'calendar', 'event', 'events', 'upcoming', 'today', 'week', 'plan', 'timetable', 'next'],
  submissions: ['submission', 'submissions', 'attendance', 'parade', 'mc', 'leave', 'light duty', 'sft', 'clock', 'check in'],
  programs:    ['program', 'programmes', 'programme', 'training plan', 'guide', 'workout plan', 'beginner', 'intermediate', 'advanced'],
  chat:        ['help', 'what can you', 'can you', 'commands', 'features'],
};

export function detectTopics(input: string): Topic[] {
  const lower = input.toLowerCase();
  const detected: Topic[] = [];
  for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS) as [Topic, string[]][]) {
    if (keywords.some(kw => lower.includes(kw))) {
      detected.push(topic);
    }
  }
  return detected.length > 0 ? detected : ['profile']; // default to profile summary
}

// ─── Intents (for navigation buttons only) ───────────────────────────────────

export const INTENTS: Intent[] = [
  {
    id: 'log_activity', name: 'Log Activity',
    keywords: [['log', 'add', 'record', 'upload', 'post', 'new'], ['activity', 'workout', 'run', 'swim', 'gym', 'exercise', 'training']],
    response: "Ready to log a new activity?",
    actions: [{ type: 'navigate', label: 'Go to Activities', route: '/activities' }],
  },
  {
    id: 'calculators', name: 'Calculators',
    keywords: [['calculate', 'calculator', 'compute', 'work out']],
    response: "I can open the calculators for you:",
    actions: [{ type: 'navigate', label: 'Open Calculators', route: '/calculators' }],
  },
];

// ─── Matching (for explicit navigation requests) ──────────────────────────────

export function matchIntent(input: string): { intent: Intent; score: number } | null {
  const tokens = input.toLowerCase().replace(/[^a-z0-9\s-]/g, '').split(/\s+/);
  let best: { intent: Intent; score: number } | null = null;
  for (const intent of INTENTS) {
    const primaryGroup = intent.keywords[0];
    const primaryHit = primaryGroup.some(kw =>
      tokens.some(t => t === kw || t.includes(kw) || (kw.includes(t) && kw.length > 3))
    );
    if (!primaryHit) continue;
    let score = primaryGroup.filter(kw => tokens.some(t => t === kw || t.includes(kw))).length;
    for (let i = 1; i < intent.keywords.length; i++) {
      const hit = intent.keywords[i].some(kw => tokens.some(t => t === kw || (t.includes(kw) && kw.length > 3)));
      if (hit) score += 0.5;
    }
    if (!best || score > best.score) best = { intent, score };
  }
  return best;
}

// ─── Suggestions ──────────────────────────────────────────────────────────────

export const SUGGESTIONS = [
  "What's my IPPT score?",
  "Show my recent activities",
  "What are my upcoming events?",
  "Show my attendance submissions",
  "How is my BMI?",
  "How am I progressing?",
];

// ─── FAQ Presets ───────────────────────────────────────────────────────────────
// These are answered offline without calling Gemini — saves API quota.

export interface FaqPreset {
  id: string;
  question: string;
  category: 'ippt' | 'training' | 'app' | 'bmi';
  answer: string;
}

export const FAQ_PRESETS: FaqPreset[] = [
  // IPPT
  {
    id: 'ippt_passing',
    category: 'ippt',
    question: 'What is the IPPT passing score?',
    answer: `IPPT Scoring (all ages):\n• Pass — 51 to 74 points\n• Silver — 75 to 84 points\n• Gold — 85 points and above\n• Fail — Below 51 points\n\nThe 3 stations are Push-ups, Sit-ups, and 2.4km Run. Points for each station vary by age group.`,
  },
  {
    id: 'ippt_stations',
    category: 'ippt',
    question: 'What are the IPPT stations?',
    answer: `IPPT has 3 stations:\n1. Push-ups (max 25 pts) — 1 minute\n2. Sit-ups (max 25 pts) — 1 minute\n3. 2.4km Run (max 50 pts) — timed run\n\nTotal maximum = 100 points. Use the IPPT Calculator in the app to compute your score.`,
  },
  {
    id: 'ippt_tips',
    category: 'ippt',
    question: 'How do I improve my IPPT score?',
    answer: `Tips to improve IPPT:\n\nPush-ups & Sit-ups:\n• Train 3–4x per week with progressive overload\n• Focus on full range of motion\n• Rest at least 1 day between sessions\n\n2.4km Run:\n• Include interval runs (e.g. 400m repeats)\n• Build a weekly long slow run for base fitness\n• Aim to improve pace by 5–10 sec/km per month\n\nLog your sessions in Activities to track progress.`,
  },
  // BMI
  {
    id: 'bmi_categories',
    category: 'bmi',
    question: 'What do the BMI categories mean?',
    answer: `BMI Categories:\n• Below 18.5 — Underweight\n• 18.5 to 22.9 — Normal (healthy)\n• 23.0 to 27.4 — Overweight\n• 27.5 and above — Obese\n\nNote: BMI is a screening tool, not a definitive health measure. Muscle mass can raise BMI without indicating poor health. Use the BMI Calculator in the app to check yours.`,
  },
  // Training
  {
    id: 'training_frequency',
    category: 'training',
    question: 'How often should I train?',
    answer: `General training guidelines:\n• 3–5 sessions per week is ideal for most people\n• Allow 48 hours rest for the same muscle group\n• Include at least 1 full rest day per week\n\nFor IPPT prep specifically:\n• 2x cardio runs per week (one interval, one easy)\n• 2x calisthenics (push-ups + sit-ups)\n• 1x active recovery (walk, swim, or light gym)\n\nLog your sessions in Activities to build consistency.`,
  },
  {
    id: 'training_programs',
    category: 'training',
    question: 'What training programs are available?',
    answer: `The app has training programs under the Programs section. These include beginner, intermediate, and advanced plans covering:\n• IPPT preparation\n• Running improvement\n• Strength and calisthenics\n\nGo to Programs in the sidebar to browse and follow a plan.`,
  },
  // App
  {
    id: 'app_log_activity',
    category: 'app',
    question: 'How do I log an activity?',
    answer: `To log an activity:\n1. Go to Activities in the sidebar\n2. Tap "Log Activity"\n3. Select the activity type (Running, Gym, Swimming, etc.)\n4. Fill in duration, distance, or reps as relevant\n5. Optionally add a photo, location, and notes\n6. Tap "Post Activity"\n\nYou can also sync any logged activity to your Progress Tracker using the sync button (⟳) on the activity card.`,
  },
  {
    id: 'app_progress_tracker',
    category: 'app',
    question: 'How does the Progress Tracker work?',
    answer: `The Progress Tracker lets you monitor improvement over time:\n1. Go to Progress Tracker in the sidebar\n2. Tap "Add Exercise" and choose a type (Running, Gym, etc.)\n3. Log entries with your metrics (distance, weight, reps, etc.)\n4. The tracker charts your progress over time\n\nYou can also auto-sync from Activities — tap the ⟳ button on any posted activity to send it to the tracker.`,
  },
  {
    id: 'app_attendance',
    category: 'app',
    question: 'How do I submit my attendance?',
    answer: `To submit attendance:\n1. Go to Teams in the sidebar\n2. Find the "Submit Attendance" card\n3. Select PT or SFT, your attendance status, and temperature\n4. Tap Submit\n\nYour submission will appear in the team's Attendance view for that day. Admins can view and export the full attendance state.`,
  },
];
