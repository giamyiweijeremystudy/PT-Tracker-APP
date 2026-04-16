import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { MessageSquare, Send, ArrowRight, Loader2, X, RefreshCw } from 'lucide-react';
import { SUGGESTIONS } from '@/lib/chatIntents';
import { fetchChatData } from '@/lib/chatDataFetcher';

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserMessage  { role: 'user'; text: string }
interface BotMessage   { role: 'bot'; text: string; loading?: boolean; navRoute?: string; navLabel?: string }
type ChatMessage = UserMessage | BotMessage;

// ─── Route suggestions based on response content ──────────────────────────────

function suggestRoute(text: string): { route: string; label: string } | null {
  if (/ippt|push-up|sit-up|2\.4km/i.test(text))    return { route: '/calculators', label: 'IPPT Calculator' };
  if (/bmi|body mass/i.test(text))                   return { route: '/calculators', label: 'BMI Calculator' };
  if (/activit/i.test(text))                         return { route: '/activities',  label: 'View Activities' };
  if (/team|member|leaderboard|squad/i.test(text))   return { route: '/teams',       label: 'Go to Teams' };
  if (/schedule|event|calendar/i.test(text))         return { route: '/schedule',    label: 'My Schedule' };
  if (/program|training plan|guide/i.test(text))     return { route: '/programs',    label: 'View Programs' };
  if (/submission|attendance|parade/i.test(text))    return { route: '/teams',       label: 'Submissions' };
  if (/profile|stats|statistics/i.test(text))        return { route: '/profile',     label: 'My Profile' };
  return null;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Chat() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [messages, setMessages] = useState<ChatMessage[]>([{
    role: 'bot',
    text: "Hi! Ask me anything about your training — scores, activities, team, schedule, programs and more.",
  }]);
  const [input, setInput]     = useState('');
  const [thinking, setThinking] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMessage = (msg: ChatMessage) =>
    setMessages((prev: ChatMessage[]) => [...prev, msg]);

  const handleSend = async (text: string = input.trim()) => {
    if (!text || thinking) return;
    setInput('');

    addMessage({ role: 'user', text });
    setThinking(true);

    // Dynamic search across all app data
    const result = await fetchChatData(text, user!.id);

    setThinking(false);

    const nav = suggestRoute(result + ' ' + text);
    addMessage({
      role: 'bot',
      text: result,
      navRoute: nav?.route,
      navLabel: nav?.label,
    });
  };

  const clearChat = () => setMessages([{
    role: 'bot',
    text: "Hi! Ask me anything about your training — scores, activities, team, schedule, programs and more.",
  }]);

  return (
    <div className="max-w-2xl mx-auto flex flex-col h-[calc(100vh-8rem)]">

      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b mb-4 shrink-0">
        <div className="flex items-center gap-3">
          <MessageSquare className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-lg font-bold leading-tight">PT Assistant</h1>
            <p className="text-xs text-muted-foreground">Searches your app data in real time</p>
          </div>
        </div>
        {messages.length > 1 && (
          <button onClick={clearChat} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground" title="Clear chat">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">

        {/* Suggestions */}
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

        {messages.map((msg: ChatMessage, i: number) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[88%] flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} gap-1.5`}>
              <div className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap
                ${msg.role === 'user'
                  ? 'bg-primary text-primary-foreground rounded-br-sm'
                  : 'bg-card border rounded-bl-sm font-mono text-xs'
                }`}>
                {msg.text}
              </div>

              {/* Navigate button on bot messages */}
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
              Searching your data...
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="pt-4 border-t mt-4 shrink-0">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Ask me anything..."
            disabled={thinking}
            className="flex-1 rounded-xl border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
          />
          <Button onClick={() => handleSend()} disabled={!input.trim() || thinking} size="icon" className="rounded-xl h-10 w-10 shrink-0">
            {thinking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground text-center mt-2">
          Queries your live app data — no AI, fully private
        </p>
      </div>
    </div>
  );
}
