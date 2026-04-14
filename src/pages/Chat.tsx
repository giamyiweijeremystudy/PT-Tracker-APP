import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { MessageSquare, Send, ArrowRight, BarChart2, BookOpen, Loader2, X } from 'lucide-react';
import { matchIntent, INTENTS, type IntentAction } from '@/lib/chatIntents';
import { fetchChatData } from '@/lib/chatDataFetcher';

// ─── Types ────────────────────────────────────────────────────────────────────

type MessageRole = 'user' | 'bot';

interface BotMessage {
  role: 'bot';
  text: string;
  actions?: IntentAction[];
  loading?: boolean;
}

interface UserMessage {
  role: 'user';
  text: string;
}

interface DataMessage {
  role: 'bot';
  text: string;
  isData: true;
}

type ChatMessage = UserMessage | BotMessage | DataMessage;

// ─── Suggestions shown at start ───────────────────────────────────────────────

const SUGGESTIONS = [
  "What's my IPPT score?",
  "Log a new activity",
  "Show my upcoming events",
  "How does IPPT scoring work?",
  "Who's inactive in my team?",
  "Show my BMI",
];

// ─── Action icon ──────────────────────────────────────────────────────────────

function actionIcon(type: string) {
  if (type === 'navigate')  return <ArrowRight className="h-3.5 w-3.5" />;
  if (type === 'show_data') return <BarChart2 className="h-3.5 w-3.5" />;
  return <BookOpen className="h-3.5 w-3.5" />;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Chat() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'bot',
      text: "Hi! I can help you navigate the app, check your stats, or answer PT questions. What do you need?",
      actions: [],
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState<string | null>(null); // action key being loaded
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMessage = (msg: ChatMessage) => setMessages((prev: ChatMessage[]) => [...prev, msg]);

  const handleSend = (text: string = input.trim()) => {
    if (!text) return;
    setInput('');

    // Add user message
    addMessage({ role: 'user', text });

    // Match intent
    const match = matchIntent(text);

    if (!match) {
      const suggestions = INTENTS.slice(0, 4).map(i => i.name).join(', ');
      addMessage({
        role: 'bot',
        text: `I didn't quite get that. I can help with: ${suggestions}, and more. Try rephrasing?`,
      });
      return;
    }

    addMessage({
      role: 'bot',
      text: match.intent.response,
      actions: match.intent.actions,
    });
  };

  const handleAction = async (action: IntentAction, msgIndex: number) => {
    const key = `${msgIndex}-${action.type}`;

    if (action.type === 'navigate' && action.route) {
      navigate(action.route);
      return;
    }

    if (action.type === 'tell_more' && action.faq) {
      addMessage({ role: 'bot', text: action.faq });
      return;
    }

    if (action.type === 'show_data' && action.query && user) {
      setLoading(key);
      const result = await fetchChatData(action.query, user.id);
      setLoading(null);
      addMessage({ role: 'bot', text: result, isData: true } as DataMessage);
    }
  };

  const clearChat = () => setMessages([{
    role: 'bot',
    text: "Hi! I can help you navigate the app, check your stats, or answer PT questions. What do you need?",
    actions: [],
  }]);

  return (
    <div className="max-w-2xl mx-auto flex flex-col h-[calc(100vh-8rem)]">

      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b mb-4">
        <div className="flex items-center gap-3">
          <MessageSquare className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-lg font-bold leading-tight">PT Assistant</h1>
            <p className="text-xs text-muted-foreground">Ask me anything about your training</p>
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

        {/* Suggestions — shown only when chat is empty */}
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
            <div className={`max-w-[85%] space-y-2 ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>

              {/* Bubble */}
              <div className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap
                ${msg.role === 'user'
                  ? 'bg-primary text-primary-foreground rounded-br-sm'
                  : (msg as any).isData
                    ? 'bg-muted border font-mono text-xs rounded-bl-sm'
                    : 'bg-card border rounded-bl-sm'
                }`}>
                {msg.text}
              </div>

              {/* Action buttons */}
              {'actions' in msg && msg.actions && msg.actions.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {msg.actions.map(action => {
                    const key = `${i}-${action.type}`;
                    const isLoading = loading === key;
                    return (
                      <Button
                        key={action.type}
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs gap-1.5 rounded-full"
                        disabled={isLoading}
                        onClick={() => handleAction(action, i)}
                      >
                        {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : actionIcon(action.type)}
                        {action.label}
                      </Button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ))}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="pt-4 border-t mt-4">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Ask me anything..."
            className="flex-1 rounded-xl border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <Button onClick={() => handleSend()} disabled={!input.trim()} size="icon" className="rounded-xl h-10 w-10 shrink-0">
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground text-center mt-2">
          Keyword-based — no AI. Responses may not cover everything.
        </p>
      </div>

    </div>
  );
}
