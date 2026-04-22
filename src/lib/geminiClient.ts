// ─── Gemini Client ────────────────────────────────────────────────────────────
// Calls Google AI Studio (Gemini) with the full app data context.
// Returns null if offline, API key missing, or request fails —
// caller should fall back to the local keyword engine.

export interface GeminiMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

// Build the system prompt injected with live app context
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
- If asked about IPPT scores, BMI, activities, schedule, team, or progress — refer to the data above.
- Keep responses concise and actionable. Use bullet points where helpful.
- If data is missing (shown as "No X yet"), encourage the user to log it.
- You can suggest navigating to specific pages: Activities, Progress Tracker, Calculators, Schedule, Teams.
- Do NOT make up data. If something isn't in the context, say so honestly.
- Today's date is ${new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.`;
}

// Convert our internal message format to Gemini's content format
export function toGeminiHistory(
  messages: { role: 'user' | 'bot'; text: string }[]
): GeminiMessage[] {
  // Gemini requires alternating user/model turns — filter out consecutive same-role messages
  const history: GeminiMessage[] = [];
  for (const msg of messages) {
    const geminiRole = msg.role === 'user' ? 'user' : 'model';
    // Skip if last message has same role (Gemini strict alternation)
    if (history.length > 0 && history[history.length - 1].role === geminiRole) continue;
    history.push({ role: geminiRole, parts: [{ text: msg.text }] });
  }
  return history;
}

export async function callGemini(
  userMessage: string,
  conversationHistory: { role: 'user' | 'bot'; text: string }[],
  systemPrompt: string,
  apiKey: string,
): Promise<string | null> {
  if (!apiKey) return null; // no key → use local fallback

  // Check online status
  if (!navigator.onLine) return null;

  const geminiHistory = toGeminiHistory(conversationHistory);

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  const body = {
    system_instruction: {
      parts: [{ text: systemPrompt }],
    },
    contents: [
      ...geminiHistory,
      { role: 'user', parts: [{ text: userMessage }] },
    ],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 512,
    },
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT',        threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_HATE_SPEECH',       threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
    ],
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000), // 15s timeout
    });

    if (!res.ok) {
      console.warn('[Gemini] API error:', res.status, await res.text());
      return null;
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return text ?? null;
  } catch (err) {
    console.warn('[Gemini] Request failed:', err);
    return null; // network error or timeout → fall back
  }
}
