// ─── Chat Intent Engine ───────────────────────────────────────────────────────
// Pure keyword-matching, fully client-side. No AI API.

export type ActionType = 'navigate' | 'show_data' | 'tell_more';

export interface IntentAction {
  type:   ActionType;
  label:  string;           // button label shown to user
  route?: string;           // for navigate
  query?: string;           // for show_data — tells the data fetcher what to run
  faq?:   string;           // for tell_more — preset text answer
}

export interface Intent {
  id:       string;
  name:     string;
  keywords: string[][];     // array of keyword groups — a group counts if ANY word in it matches
  response: string;         // short matched response shown in chat
  actions:  IntentAction[];
}

// ─── IPPT FAQ text ────────────────────────────────────────────────────────────
const IPPT_FAQ = `IPPT is scored out of 100 pts: Push-ups (max 25), Sit-ups (max 25), 2.4km Run (max 50).

Awards:
• Gold  — 85+ pts
• Silver — 75–84 pts
• Pass  — 51–74 pts
• Fail  — below 51 (or 0 in any station)

Points vary by age group (18–60). Younger groups need fewer reps/faster times for the same points.`;

const ACTIVITY_FAQ = `Logging an activity records your workout — run, swim, gym, IPPT training and more.

Tips:
• Add distance for runs/swims
• For IPPT Training, log your push-ups, sit-ups and run time
• You can attach a photo and location
• Activities shared to your team appear in the team feed`;

const TEAM_FAQ = `Team features:
• Activities — see what teammates have logged
• Members — view IPPT scores and roles
• Leaderboard — rank by IPPT score, push-ups, sit-ups, run time, or activity count
• Submissions — record PT/SFT attendance with status (Participating, Light Duty, MC, On Leave)
• Schedule — team events added by PT IC appear in your personal calendar automatically`;

const BMI_FAQ = `BMI (Body Mass Index) = weight(kg) ÷ height(m)²

Categories:
• Underweight — below 18.5
• Normal      — 18.5–24.9
• Overweight  — 25–29.9
• Obese       — 30+

Healthy weight for a 170cm person: 53.5–72.0 kg`;

const CALORIE_FAQ = `Daily calorie needs are estimated using the Mifflin-St Jeor equation.

Activity multipliers:
• Sedentary      — ×1.2
• Lightly active — ×1.375
• Moderately     — ×1.55
• Very active    — ×1.725
• Extra active   — ×1.9

To lose ~0.5kg/week: eat 500 cal below your TDEE.
To gain ~0.5kg/week: eat 500 cal above your TDEE.`;

const SCHEDULE_FAQ = `Your personal schedule shows:
• Your own events (Personal, PT, SFT, Other)
• Team events added by your PT IC — synced automatically
• Activities you've logged
• Singapore public holidays

Click any day on the calendar to see events and add new ones.`;

// ─── Intents ──────────────────────────────────────────────────────────────────
export const INTENTS: Intent[] = [
  // ── Log activity ──────────────────────────────────────────────────────────
  {
    id: 'log_activity',
    name: 'Log Activity',
    keywords: [
      ['log', 'add', 'record', 'upload', 'post', 'new', 'create', 'submit'],
      ['activity', 'workout', 'run', 'swim', 'gym', 'exercise', 'training', 'pt', 'ippt'],
    ],
    response: "Ready to log a new activity?",
    actions: [
      { type: 'navigate',  label: 'Take me there',    route: '/activities' },
      { type: 'tell_more', label: 'How does it work', faq: ACTIVITY_FAQ },
    ],
  },

  // ── View IPPT score ────────────────────────────────────────────────────────
  {
    id: 'ippt_score',
    name: 'IPPT Score',
    keywords: [
      ['ippt', 'score', 'result', 'award', 'gold', 'silver', 'pass', 'fail', 'points', 'pts'],
      ['my', 'check', 'see', 'view', 'what', 'how'],
    ],
    response: "Here's what I can do with your IPPT data:",
    actions: [
      { type: 'navigate',  label: 'IPPT Calculator',  route: '/calculators' },
      { type: 'show_data', label: 'Show my score',     query: 'ippt_latest' },
      { type: 'tell_more', label: 'How scoring works', faq: IPPT_FAQ },
    ],
  },

  // ── IPPT FAQ only ──────────────────────────────────────────────────────────
  {
    id: 'ippt_faq',
    name: 'IPPT Info',
    keywords: [
      ['ippt', 'scoring', 'standard', 'requirement', 'criteria', 'passing', 'table'],
      ['what', 'explain', 'how', 'tell', 'info', 'help'],
    ],
    response: "I can explain the IPPT scoring system:",
    actions: [
      { type: 'tell_more', label: 'Explain IPPT scoring', faq: IPPT_FAQ },
      { type: 'navigate',  label: 'Try the calculator',   route: '/calculators' },
    ],
  },

  // ── Training history ───────────────────────────────────────────────────────
  {
    id: 'training_history',
    name: 'Training History',
    keywords: [
      ['history', 'past', 'previous', 'recent', 'last', 'activities', 'log', 'logs'],
      ['training', 'workout', 'exercise', 'activity', 'run', 'swim', 'gym'],
    ],
    response: "Want to review your training history?",
    actions: [
      { type: 'navigate',  label: 'See my activities',  route: '/activities' },
      { type: 'show_data', label: 'Quick summary',       query: 'activity_summary' },
    ],
  },

  // ── Profile / stats ────────────────────────────────────────────────────────
  {
    id: 'my_stats',
    name: 'My Stats',
    keywords: [
      ['my', 'profile', 'stats', 'statistics', 'progress', 'overview', 'dashboard'],
      ['score', 'result', 'bmi', 'weight', 'height', 'fitness', 'performance'],
    ],
    response: "Here's how to access your stats:",
    actions: [
      { type: 'navigate',  label: 'My profile',      route: '/profile' },
      { type: 'show_data', label: 'Show my numbers', query: 'profile_summary' },
    ],
  },

  // ── BMI ───────────────────────────────────────────────────────────────────
  {
    id: 'bmi',
    name: 'BMI',
    keywords: [
      ['bmi', 'body', 'weight', 'overweight', 'underweight', 'obese', 'mass', 'index'],
    ],
    response: "I can help with BMI:",
    actions: [
      { type: 'navigate',  label: 'BMI Calculator',  route: '/calculators' },
      { type: 'show_data', label: 'Show my BMI',     query: 'bmi_latest' },
      { type: 'tell_more', label: 'What is BMI?',    faq: BMI_FAQ },
    ],
  },

  // ── Calories ──────────────────────────────────────────────────────────────
  {
    id: 'calories',
    name: 'Calories',
    keywords: [
      ['calorie', 'calories', 'kcal', 'tdee', 'bmr', 'diet', 'nutrition', 'food', 'eat', 'intake'],
    ],
    response: "Here's what I can help with on calories:",
    actions: [
      { type: 'navigate',  label: 'Calorie Calculator', route: '/calculators' },
      { type: 'tell_more', label: 'How it works',        faq: CALORIE_FAQ },
    ],
  },

  // ── Team ─────────────────────────────────────────────────────────────────
  {
    id: 'team',
    name: 'Team',
    keywords: [
      ['team', 'squad', 'group', 'members', 'teammate', 'unit'],
    ],
    response: "Here's what I can show about your team:",
    actions: [
      { type: 'navigate',  label: 'Go to Teams',         route: '/teams' },
      { type: 'show_data', label: 'Team activity count', query: 'team_summary' },
      { type: 'tell_more', label: 'What can teams do?',  faq: TEAM_FAQ },
    ],
  },

  // ── Leaderboard ───────────────────────────────────────────────────────────
  {
    id: 'leaderboard',
    name: 'Leaderboard',
    keywords: [
      ['leaderboard', 'ranking', 'rank', 'top', 'best', 'compare', 'versus', 'vs', 'standings'],
    ],
    response: "Want to see how you stack up against your team?",
    actions: [
      { type: 'navigate',  label: 'See leaderboard', route: '/teams' },
      { type: 'show_data', label: 'My rank',         query: 'my_rank' },
    ],
  },

  // ── At-risk members (manager) ─────────────────────────────────────────────
  {
    id: 'at_risk',
    name: 'At-Risk Members',
    keywords: [
      ['at-risk', 'risk', 'fail', 'failing', 'struggling', 'poor', 'weak', 'inactive', 'no activity'],
      ['member', 'members', 'team', 'who', 'which'],
    ],
    response: "I can check which team members may need attention:",
    actions: [
      { type: 'show_data', label: 'Show at-risk members', query: 'at_risk_members' },
      { type: 'navigate',  label: 'Go to Teams',          route: '/teams' },
    ],
  },

  // ── Schedule ──────────────────────────────────────────────────────────────
  {
    id: 'schedule',
    name: 'Schedule',
    keywords: [
      ['schedule', 'calendar', 'event', 'events', 'upcoming', 'today', 'week', 'plan', 'timetable'],
    ],
    response: "Let me help with your schedule:",
    actions: [
      { type: 'navigate',  label: 'My schedule',        route: '/schedule' },
      { type: 'show_data', label: 'Upcoming events',    query: 'upcoming_events' },
      { type: 'tell_more', label: 'How schedule works', faq: SCHEDULE_FAQ },
    ],
  },

  // ── Submissions / attendance ──────────────────────────────────────────────
  {
    id: 'attendance',
    name: 'Attendance',
    keywords: [
      ['attendance', 'submit', 'parade', 'mc', 'leave', 'light duty', 'sft', 'clock', 'check in'],
    ],
    response: "Need to submit your attendance?",
    actions: [
      { type: 'navigate',  label: 'Submit attendance', route: '/teams' },
      { type: 'show_data', label: 'My submissions',    query: 'my_submissions' },
    ],
  },
];

// ─── Matching engine ──────────────────────────────────────────────────────────
export function matchIntent(input: string): { intent: Intent; score: number } | null {
  const tokens = input.toLowerCase().replace(/[^a-z0-9\s-]/g, '').split(/\s+/);
  const MIN_SCORE = 1;

  let best: { intent: Intent; score: number } | null = null;

  for (const intent of INTENTS) {
    let score = 0;
    for (const group of intent.keywords) {
      // A group contributes 1 point if ANY token in that group appears in the input
      const hit = group.some(kw => tokens.some(t => t.includes(kw) || kw.includes(t)));
      if (hit) score++;
    }
    // Bonus: full keyword exact match
    for (const group of intent.keywords) {
      for (const kw of group) {
        if (tokens.includes(kw)) score += 0.5;
      }
    }
    if (score >= MIN_SCORE && (!best || score > best.score)) {
      best = { intent, score };
    }
  }

  return best;
}
