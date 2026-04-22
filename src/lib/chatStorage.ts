// ─── Chat Storage ─────────────────────────────────────────────────────────────
// Persists conversation history in localStorage, keyed per user.
// Keeps the last N messages to avoid unbounded growth.

const MAX_STORED_MESSAGES = 40;

export interface StoredMessage {
  role: 'user' | 'bot';
  text: string;
  navRoute?: string;
  navLabel?: string;
  timestamp: number;
}

function storageKey(userId: string) {
  return `pt_chat_history_${userId}`;
}

export function loadHistory(userId: string): StoredMessage[] {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return [];
    return JSON.parse(raw) as StoredMessage[];
  } catch {
    return [];
  }
}

export function saveHistory(userId: string, messages: StoredMessage[]): void {
  try {
    const trimmed = messages.slice(-MAX_STORED_MESSAGES);
    localStorage.setItem(storageKey(userId), JSON.stringify(trimmed));
  } catch {
    // localStorage full or unavailable — fail silently
  }
}

export function clearHistory(userId: string): void {
  try {
    localStorage.removeItem(storageKey(userId));
  } catch {
    // ignore
  }
}
