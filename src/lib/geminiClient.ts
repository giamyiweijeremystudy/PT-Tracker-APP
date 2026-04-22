// ─── Gemini Client ────────────────────────────────────────────────────────────

export interface GeminiMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export function buildSystemPrompt(appContext: string, userName: string): string {
  return `You are a PT (Physical Training) Assistant embedded in a fitness tracking app used by military personnel.
Your name is PT Assistant. You are helpful, concise, and motivating.

The user's name is ${userName}.

Here is the user's current app data (fetched live from the database):
─────────────────────────────────
${appContext}
─────────────────────────────────

Guidelines:
- Use the app data above to give personalised, accurate answers.
- Keep responses concise and actionable. Use bullet points where helpful.
- If data is missing (shown as "No X yet"), encourage the user to log it.
- You can suggest navigating to: Activities, Progress Tracker, Calculators, Schedule, Teams.
- Do NOT make up data. If something is not in the context, say so honestly.
- Today's date is ${new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.`;
}

export function toGeminiHistory(
  messages: { role: 'user' | 'bot'; text: string }[]
): GeminiMessage[] {
  const history: GeminiMessage[] = [];
  for (const msg of messages) {
    const geminiRole = msg.role === 'user' ? 'user' : 'model';
    if (history.length > 0 && history[history.length - 1].role === geminiRole) continue;
    history.push({ role: geminiRole, parts: [{ text: msg.text }] });
  }
  return history;
}

// Returns AI text, or a string starting with "__error:" for visible debugging
export async function callGemini(
  userMessage: string,
  conversationHistory: { role: 'user' | 'bot'; text: string }[],
  systemPrompt: string,
  apiKey: string,
): Promise<string | null> {
  if (!apiKey) return '__error:No API key';
  if (!navigator.onLine) return null;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;

  const body = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: [
      ...toGeminiHistory(conversationHistory),
      { role: 'user', parts: [{ text: userMessage }] },
    ],
    generationConfig: { temperature: 0.7, maxOutputTokens: 512 },
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30000),
    });

    const data = await res.json();

    if (!res.ok) {
      const msg = data?.error?.message ?? `HTTP ${res.status}`;
      return `__error:${msg}`;
    }

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return `__error:Empty response — ${JSON.stringify(data).slice(0, 300)}`;
    return text;
  } catch (err: any) {
    return `__error:${err?.message ?? 'fetch failed'}`;
  }
}
