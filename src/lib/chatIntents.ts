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
  "Who's inactive in my team?",
  "What are my upcoming events?",
  "Show team leaderboard",
  "What training programs are available?",
  "Show my attendance submissions",
  "How is my BMI?",
];
