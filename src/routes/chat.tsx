import { createFileRoute } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import {
  MessagesSquare,
  Send,
  EyeOff,
  Eye,
  Trash2,
  Save,
  Loader2,
  Square,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";

import { Disclaimer } from "@/components/disclaimer";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "AI Chat — Workplace AI" },
      { name: "description", content: "Chat with your AI workplace assistant." },
    ],
  }),
  component: ChatPage,
});

const STORAGE_KEY = "workplace-ai-chat-v1";
const INCOGNITO_KEY = "workplace-ai-chat-incognito";

const transport = new DefaultChatTransport({ api: "/api/chat" });

function loadStoredMessages(): UIMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as UIMessage[]) : [];
  } catch {
    return [];
  }
}

function loadIncognito(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(INCOGNITO_KEY) === "1";
}

function ChatPage() {
  const [incognito, setIncognito] = useState<boolean>(() => loadIncognito());
  const [initialMessages] = useState<UIMessage[]>(() =>
    loadIncognito() ? [] : loadStoredMessages(),
  );
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status, setMessages, stop, error } = useChat({
    transport,
    messages: initialMessages,
    onError: (e) => toast.error(e.message || "Chat failed"),
  });

  const isLoading = status === "submitted" || status === "streaming";

  // Persist messages when not incognito
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (incognito) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      /* ignore quota */
    }
  }, [messages, incognito]);

  // Persist incognito preference
  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(INCOGNITO_KEY, incognito ? "1" : "0");
  }, [incognito]);

  // Auto-scroll on new messages
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  // Keep composer focused
  useEffect(() => {
    if (!isLoading) textareaRef.current?.focus();
  }, [isLoading, messages.length]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;
    setInput("");
    void sendMessage({ text });
  };

  const handleToggleIncognito = (next: boolean) => {
    setIncognito(next);
    if (next) {
      // Remove any persisted chat when entering incognito
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        /* ignore */
      }
      toast.message("Incognito enabled", {
        description: "This conversation will not be saved to your device.",
      });
    } else {
      toast.message("Saving enabled", {
        description: "New messages will be saved to your browser.",
      });
    }
  };

  const handleClear = () => {
    setMessages([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    toast.success("Chat history cleared");
  };

  return (
    <div className="flex h-[calc(100svh-3rem)] flex-col">
      <PageHeader
        icon={MessagesSquare}
        title="AI Chat"
        description={
          incognito
            ? "Incognito mode — messages stay only in this session."
            : "Conversations are saved in your browser. Toggle incognito anytime."
        }
        actions={
          <>
            <div
              className={cn(
                "flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium",
                incognito
                  ? "border-warning/40 bg-warning/10 text-warning-foreground"
                  : "border-border bg-muted text-muted-foreground",
              )}
            >
              {incognito ? (
                <EyeOff className="h-3.5 w-3.5" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              <span className="hidden sm:inline">
                {incognito ? "Incognito" : "Saved locally"}
              </span>
              <Switch
                checked={incognito}
                onCheckedChange={handleToggleIncognito}
                aria-label="Toggle incognito"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClear}
              disabled={messages.length === 0}
              className="gap-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Clear</span>
            </Button>
          </>
        }
      />

      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-4 py-6">
          {messages.length === 0 ? (
            <EmptyState onPick={(t) => setInput(t)} />
          ) : (
            <div className="space-y-6">
              {messages.map((m) => (
                <MessageBubble key={m.id} message={m} />
              ))}
              {status === "submitted" && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Thinking…
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-border bg-card/50 px-4 py-3">
        <form onSubmit={handleSubmit} className="mx-auto max-w-3xl">
          <div className="relative flex items-end gap-2 rounded-xl border border-border bg-background p-2 shadow-[var(--shadow-card)] focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder="Ask anything — drafts, plans, summaries, ideas…"
              rows={1}
              className="max-h-40 min-h-[40px] flex-1 resize-none border-0 bg-transparent px-2 py-2 text-sm shadow-none focus-visible:ring-0"
            />
            {isLoading ? (
              <Button type="button" size="icon" variant="outline" onClick={() => stop()}>
                <Square className="h-4 w-4" />
              </Button>
            ) : (
              <Button type="submit" size="icon" disabled={!input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            )}
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>
              {incognito ? (
                <span className="inline-flex items-center gap-1">
                  <EyeOff className="h-3 w-3" /> Not being saved
                </span>
              ) : (
                <span className="inline-flex items-center gap-1">
                  <Eye className="h-3 w-3" /> Saved to this browser only
                </span>
              )}
            </span>
            <span>Enter to send · Shift+Enter for newline</span>
          </div>
          {error ? (
            <p className="mt-2 text-xs text-destructive">{error.message}</p>
          ) : null}
        </form>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: UIMessage }) {
  const isUser = message.role === "user";
  const text = message.parts
    .map((p) => (p.type === "text" ? p.text : ""))
    .join("");

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground shadow-sm">
          {text}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      <div
        className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-primary-foreground"
        style={{ background: "var(--gradient-primary)" }}
      >
        <MessagesSquare className="h-4 w-4" />
      </div>
      <div className="prose prose-sm max-w-none flex-1 dark:prose-invert prose-pre:bg-muted prose-pre:text-foreground prose-code:text-foreground prose-headings:font-semibold prose-h2:text-base prose-p:my-2 prose-li:my-0.5">
        <ReactMarkdown>{text || "…"}</ReactMarkdown>
      </div>
    </div>
  );
}

const STARTERS = [
  "Draft a follow-up email after a sales call",
  "Summarize my standup notes and pull out blockers",
  "Help me plan a product launch in 6 weeks",
  "Explain the trade-offs of monorepos vs polyrepos",
];

function EmptyState({ onPick }: { onPick: (t: string) => void }) {
  return (
    <div className="mx-auto max-w-2xl pt-10 text-center">
      <div
        className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl text-primary-foreground shadow-[var(--shadow-elegant)]"
        style={{ background: "var(--gradient-primary)" }}
      >
        <MessagesSquare className="h-7 w-7" />
      </div>
      <h2 className="text-2xl font-semibold tracking-tight">How can I help today?</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Ask anything work-related — I can draft, plan, summarize, explain, and brainstorm.
      </p>
      <div className="mx-auto mt-6 grid max-w-xl gap-2 sm:grid-cols-2">
        {STARTERS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onPick(s)}
            className="rounded-xl border border-border bg-card p-3 text-left text-sm transition hover:border-primary/40 hover:bg-accent/30"
          >
            {s}
          </button>
        ))}
      </div>
      <div className="mt-8">
        <Disclaimer />
      </div>
    </div>
  );
}
