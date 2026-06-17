import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Download, History, Mail, Send, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

import { AiOutput } from "@/components/ai-output";
import { Disclaimer } from "@/components/disclaimer";
import { FeatureAccentProvider } from "@/components/feature-accent";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { generateEmail } from "@/lib/ai.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/email")({
  head: () => ({
    meta: [
      { title: "Smart Email Generator — Workplace AI" },
      { name: "description", content: "Draft professional emails with AI." },
    ],
  }),
  component: EmailPage,
});

type EmailHistoryItem = {
  id: string;
  createdAt: number;
  recipient: string;
  purpose: string;
  tone: string;
  keyPoints: string;
  content: string;
};

const STORAGE_KEY = "workplace-ai-email-history-v1";
const MAX_HISTORY = 25;

function loadHistory(): EmailHistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as EmailHistoryItem[]) : [];
  } catch {
    return [];
  }
}

function saveHistory(items: EmailHistoryItem[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    /* ignore quota errors */
  }
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "email";
}

function downloadFile(filename: string, content: string, mime = "text/markdown") {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function EmailPage() {
  const fn = useServerFn(generateEmail);
  const [recipient, setRecipient] = useState("");
  const [purpose, setPurpose] = useState("");
  const [tone, setTone] = useState("Professional");
  const [keyPoints, setKeyPoints] = useState("");
  const [output, setOutput] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [history, setHistory] = useState<EmailHistoryItem[]>([]);

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  // Persist edits to the active history item
  useEffect(() => {
    if (!activeId) return;
    setHistory((prev) => {
      const next = prev.map((h) => (h.id === activeId ? { ...h, content: output } : h));
      saveHistory(next);
      return next;
    });
  }, [output, activeId]);

  const mutation = useMutation({
    mutationFn: (vars: {
      recipient: string;
      purpose: string;
      tone: string;
      keyPoints: string;
    }) => fn({ data: vars }),
    onSuccess: (res, vars) => {
      setOutput(res.content);
      const item: EmailHistoryItem = {
        id: crypto.randomUUID(),
        createdAt: Date.now(),
        ...vars,
        content: res.content,
      };
      setHistory((prev) => {
        const next = [item, ...prev].slice(0, MAX_HISTORY);
        saveHistory(next);
        return next;
      });
      setActiveId(item.id);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const loadItem = (item: EmailHistoryItem) => {
    setRecipient(item.recipient);
    setPurpose(item.purpose);
    setTone(item.tone);
    setKeyPoints(item.keyPoints);
    setOutput(item.content);
    setActiveId(item.id);
  };

  const deleteItem = (id: string) => {
    setHistory((prev) => {
      const next = prev.filter((h) => h.id !== id);
      saveHistory(next);
      return next;
    });
    if (activeId === id) setActiveId(null);
  };

  const clearHistory = () => {
    setHistory([]);
    saveHistory([]);
    setActiveId(null);
  };

  const downloadCurrent = (format: "md" | "txt") => {
    if (!output.trim()) {
      toast.error("Nothing to download yet.");
      return;
    }
    const base = `${slugify(purpose || "email")}-${new Date().toISOString().slice(0, 10)}`;
    downloadFile(`${base}.${format}`, output, format === "md" ? "text/markdown" : "text/plain");
  };

  const downloadItem = (item: EmailHistoryItem) => {
    const base = `${slugify(item.purpose)}-${new Date(item.createdAt).toISOString().slice(0, 10)}`;
    downloadFile(`${base}.md`, item.content);
  };

  return (
    <FeatureAccentProvider accent="sky">
      <PageHeader
        icon={Mail}
        title="Smart Email Generator"
        description="Describe the email; AI drafts it for you to review, edit, save, and download."
      />
      <div className="grid gap-6 p-6 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)_minmax(0,280px)]">
        <form
          className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]"
          onSubmit={(e) => {
            e.preventDefault();
            if (!recipient.trim() || !purpose.trim()) {
              toast.error("Add a recipient and purpose first.");
              return;
            }
            mutation.mutate({ recipient, purpose, tone, keyPoints });
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="recipient">Recipient / audience</Label>
            <Input
              id="recipient"
              placeholder="e.g. Hiring manager at Acme Co."
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="purpose">Purpose</Label>
            <Input
              id="purpose"
              placeholder="e.g. Follow up after interview"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tone">Tone</Label>
            <Select value={tone} onValueChange={setTone}>
              <SelectTrigger id="tone">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["Professional", "Friendly", "Formal", "Concise", "Persuasive", "Apologetic"].map(
                  (t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="kp">Key points (optional)</Label>
            <Textarea
              id="kp"
              rows={5}
              placeholder="Bullet points or details to include"
              value={keyPoints}
              onChange={(e) => setKeyPoints(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full gap-2" disabled={mutation.isPending}>
            <Send className="h-4 w-4" />
            {mutation.isPending ? "Drafting…" : "Generate email"}
          </Button>
          <Disclaimer />
        </form>

        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => downloadCurrent("md")}
              disabled={!output.trim()}
            >
              <Download className="h-4 w-4" /> .md
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => downloadCurrent("txt")}
              disabled={!output.trim()}
            >
              <Download className="h-4 w-4" /> .txt
            </Button>
          </div>
          <AiOutput
            value={output}
            onChange={setOutput}
            loading={mutation.isPending}
            placeholder="Your email draft will appear here."
          />
        </div>

        <aside className="rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-card)] lg:max-h-[calc(100vh-12rem)] lg:overflow-y-auto">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <History className="h-4 w-4" /> History
            </div>
            {history.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearHistory}
                className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
              >
                Clear
              </Button>
            )}
          </div>
          {history.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Generated emails are saved here in your browser.
            </p>
          ) : (
            <ul className="space-y-2">
              {history.map((item) => {
                const isActive = item.id === activeId;
                return (
                  <li
                    key={item.id}
                    className={`group rounded-lg border p-3 text-sm transition-colors ${
                      isActive
                        ? "border-primary/50 bg-primary/5"
                        : "border-border hover:bg-muted/50"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => loadItem(item)}
                      className="block w-full text-left"
                    >
                      <div className="truncate font-medium">{item.purpose || "Untitled"}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        {item.recipient} · {item.tone}
                      </div>
                      <div className="mt-1 text-[11px] text-muted-foreground">
                        {new Date(item.createdAt).toLocaleString()}
                      </div>
                    </button>
                    <div className="mt-2 flex gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 flex-1 gap-1 text-xs"
                        onClick={() => downloadItem(item)}
                      >
                        <Download className="h-3 w-3" /> Download
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => deleteItem(item.id)}
                        aria-label="Delete"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>
      </div>
    </FeatureAccentProvider>
  );
}
