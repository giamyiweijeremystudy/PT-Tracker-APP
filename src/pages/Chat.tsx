import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { MessageSquare, Send, ArrowRight, Loader2, X, Wifi, WifiOff, Sparkles } from 'lucide-react';
import { SUGGESTIONS } from '@/lib/chatIntents';
import { dynamicSearch, fetchFullAppContext } from '@/lib/chatDataFetcher';
import { callGemini, buildSystemPrompt } from '@/lib/geminiClient';
import { loadHistory, saveHistory, clearHistory, type StoredMessage } from '@/lib/chatStorage';
import { supabase } from '@/integrations/supabase/client';

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserMessage  { role: 'user';  text: string; timestamp: number }
interface BotMessage   { role: 'bot';   text: string; timestamp: number; loading?: boolean; navRoute?: string; navLabel?: string; source?: 'gemini' | 'local' }
type ChatMessage = UserMessage | BotMessage;

const WELCOME: BotMessage = {
  role: 'bot',
  text: "Hi! I'm your PT Assistant. Ask me anything about your training — scores, activities, team, schedule, progress and more.",
  timestamp: 0,
  source: 'gemini', // use prose styling for welcome regardless of mode
};

// ─── Route suggestions based on response content ──────────────────────────────

function suggestRoute(text: string): { route: string; label: string } | null {
  if (/ippt|push-up|sit-up|2\.4km/i.test(text))   return { route: '/calculators', label: 'IPPT Calculator' };
  if (/bmi|body mass/i.test(text))                  return { route: '/calculators', label: 'BMI Calculator' };
  if (/activit/i.test(text))                        return { route: '/activities',  label: 'View Activities' };
  if (/team|member|leaderboard|squad/i.test(text))  return { route: '/teams',       label: 'Go to Teams' };
  if (/schedule|event|calendar/i.test(text))        return { route: '/schedule',    label: 'My Schedule' };
  if (/program|training plan|guide/i.test(text))    return { route: '/programs',    label: 'View Programs' };
  if (/progress|tracker/i.test(text))               return { route: '/progress',    label: 'Progress Tracker' };
  if (/profile|stats|statistics/i.test(text))       return { route: '/profile',     label: 'My Profile' };
  return null;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Chat() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const userId = user?.id ?? '';
  const userName = profile?.full_name ?? 'there';

  // Restore history from localStorage on first load
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (!userId) return [WELCOME];
    const stored = loadHistory(userId);
    if (stored.length === 0) return [WELCOME];
    return stored as ChatMessage[];
  });

  const [input, setInput]       = useState('');
  const [thinking, setThinking] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [geminiKey, setGeminiKey] = useState<string>('');
  const [debugStatus, setDebugStatus] = useState<string>('loading...');

  // Cached app context — refreshed once per session
  const appContextRef = useRef<string>('');
  const contextLoadedRef = useRef(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  // Load shared Gemini key from app_config (set once by admin, used by all users)
  useEffect(() => {
    setDebugStatus('fetching key...');
    supabase
      .from('app_config')
      .select('value')
      .eq('key', 'gemini_api_key')
      .single()
      .then(({ data, error }) => {
        if (error) {
          setDebugStatus('db error: ' + error.message);
        } else if (data?.value) {
          setGeminiKey(data.value);
          setDebugStatus('key loaded (' + data.value.slice(0, 8) + '...)');
        } else {
          setDebugStatus('no key found in app_config');
        }
      });
  }, []); // run once on mount — key is global, not user-specific

  // Online/offline listener
  useEffect(() => {
    const onOnline  = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online',  onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  // Pre-fetch app context once user is available
  useEffect(() => {
    if (!userId || contextLoadedRef.current) return;
    contextLoadedRef.current = true;
    fetchFullAppContext(userId).then(ctx => { appContextRef.current = ctx; });
  }, [userId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Persist to localStorage whenever messages change (skip welcome-only state)
  useEffect(() => {
    if (!userId || messages.length <= 1) return;
    saveHistory(userId, messages as StoredMessage[]);
  }, [messages, userId]);

  const addMessage = (msg: ChatMessage) =>
    setMessages(prev => [...prev, msg]);

  const handleSend = useCallback(async (text: string = input.trim()) => {
    if (!text || thinking) return;
    setInput('');

    const userMsg: UserMessage = { role: 'user', text, timestamp: Date.now() };
    addMessage(userMsg);
    setThinking(true);

    // Build conversation history for Gemini (exclude welcome message, exclude loading states)
    const history = messages
      .filter(m => m.timestamp > 0 && !(m.role === 'bot' && (m as BotMessage).loading))
      .map(m => ({ role: m.role, text: m.text }));

    let responseText: string;
    let source: 'gemini' | 'local' = 'local';

    // ── Try Gemini first (if online and key present) ──────────────────────────
    if (isOnline && !!geminiKey) {
      // Refresh context if stale (empty)
      if (!appContextRef.current) {
        appContextRef.current = await fetchFullAppContext(userId);
      }
      const systemPrompt = buildSystemPrompt(appContextRef.current, userName);
      console.log('[Chat] Calling Gemini, key present:', !!geminiKey, 'online:', isOnline);
      const geminiReply = await callGemini(text, history, systemPrompt, geminiKey);

      if (geminiReply && geminiReply.startsWith('__error:')) {
        // Show the error visibly so we can debug without DevTools
        responseText = '⚠️ Gemini error: ' + geminiReply.replace('__error:', '');
        source = 'gemini';
      } else if (geminiReply) {
        responseText = geminiReply;
        source = 'gemini';
      } else {
        // null = offline or no key, fall back silently
        responseText = await dynamicSearch(text, userId);
      }
    } else {
      // ── Offline / no key → local keyword engine ───────────────────────────
      responseText = await dynamicSearch(text, userId);
    }

    setThinking(false);

    const nav = suggestRoute(responseText + ' ' + text);
    const botMsg: BotMessage = {
      role: 'bot',
      text: responseText,
      timestamp: Date.now(),
      navRoute: nav?.route,
      navLabel: nav?.label,
      source,
    };
    addMessage(botMsg);
  }, [input, thinking, messages, isOnline, userId, userName, geminiKey]);

  const handleClear = () => {
    clearHistory(userId);
    setMessages([WELCOME]);
    // Refresh app context on clear so next conversation is fresh
    contextLoadedRef.current = false;
    appContextRef.current = '';
    fetchFullAppContext(userId).then(ctx => {
      appContextRef.current = ctx;
      contextLoadedRef.current = true;
    });
  };

  const aiMode = isOnline && !!geminiKey;

  return (
    <div className="max-w-2xl mx-auto flex flex-col h-[calc(100vh-8rem)]">

      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b mb-4 shrink-0">
        <div className="flex items-center gap-3">
          <MessageSquare className="h-6 w-6 text-primary" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold leading-tight">PT Assistant</h1>
              {aiMode
                ? <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                    <Sparkles className="h-3 w-3" /> Gemini AI
                  </span>
                : <span className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    {isOnline ? '⚡ Local' : <><WifiOff className="h-3 w-3" /> Offline</>}
                  </span>
              }
            </div>
            <p className="text-xs text-muted-foreground">
              {aiMode ? 'Powered by Gemini · reads your app data' : 'Searches your app data locally'}
            </p>
          </div>
        </div>
        {messages.length > 1 && (
          <button onClick={handleClear} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground" title="Clear chat">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Debug banner — remove once Gemini is confirmed working */}
      <div className="text-[10px] text-muted-foreground bg-muted/60 rounded px-2 py-1 mb-1 font-mono">
        status: {debugStatus} | online: {String(isOnline)} | aiMode: {String(aiMode)}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">

        {/* Initial suggestions */}
        {messages.length === 1 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground px-1">Try asking:</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={() => handleSend(s)}
                  className="text-xs px-3 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 transition-colors">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[88%] flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} gap-1.5`}>
              <div className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap
                ${msg.role === 'user'
                  ? 'bg-primary text-primary-foreground rounded-br-sm'
                  : 'bg-card border rounded-bl-sm'
                }`}>
                {msg.text}
              </div>

              {/* Source badge on bot messages */}
              {msg.role === 'bot' && (msg as BotMessage).source === 'gemini' && msg.timestamp > 0 && (
                <span className="text-[10px] text-muted-foreground px-1 flex items-center gap-1">
                  <Sparkles className="h-2.5 w-2.5" /> Gemini
                </span>
              )}

              {/* Navigate button */}
              {msg.role === 'bot' && (msg as BotMessage).navRoute && (
                <button
                  onClick={() => navigate((msg as BotMessage).navRoute!)}
                  className="flex items-center gap-1.5 text-xs text-primary hover:underline px-1">
                  <ArrowRight className="h-3.5 w-3.5" />
                  {(msg as BotMessage).navLabel}
                </button>
              )}
            </div>
          </div>
        ))}

        {/* Thinking indicator */}
        {thinking && (
          <div className="flex justify-start">
            <div className="bg-card border rounded-2xl rounded-bl-sm px-4 py-2.5 flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {aiMode ? 'Thinking...' : 'Searching your data...'}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Scrollable suggestions — shown after first message */}
      {messages.length > 1 && (
        <div className="shrink-0 mt-3 -mx-1">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide px-1 pb-2">
            {SUGGESTIONS.map(s => (
              <button
                key={s}
                onClick={() => handleSend(s)}
                disabled={thinking}
                className="text-xs px-3 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 transition-colors whitespace-nowrap shrink-0 disabled:opacity-40"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="pt-3 border-t mt-1 shrink-0">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder={aiMode ? "Ask me anything..." : "Ask me anything (offline mode)..."}
            disabled={thinking}
            className="flex-1 rounded-xl border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
          />
          <Button onClick={() => handleSend()} disabled={!input.trim() || thinking} size="icon" className="rounded-xl h-10 w-10 shrink-0">
            {thinking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground text-center mt-2">
          {aiMode
            ? 'AI reads your live app data · conversation saved locally'
            : !geminiKey
              ? 'Go to Settings to add your Gemini API key'
              : 'Offline — using local search engine'
          }
        </p>
      </div>
    </div>
  );
}
