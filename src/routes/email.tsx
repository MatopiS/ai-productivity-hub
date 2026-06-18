import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Download, Mail, Send } from "lucide-react";
import { useEffect, useState } from "react";

import { AiOutput } from "@/components/ai-output";
import { Disclaimer } from "@/components/disclaimer";
import { FeatureAccentProvider } from "@/components/feature-accent";
import { HistoryPanel } from "@/components/history-panel";
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
import {
  HISTORY_KEYS,
  addHistoryItem,
  downloadFile,
  loadHistory,
  loadPrefs,
  logActivity,
  saveHistory,
  slugify,
  subscribeActivity,
} from "@/lib/activity-store";
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
  output: string;
};

const KEY = HISTORY_KEYS.email;

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
    setHistory(loadHistory<EmailHistoryItem>(KEY));
    setTone(loadPrefs().defaultTone);
    return subscribeActivity(() => setHistory(loadHistory<EmailHistoryItem>(KEY)));
  }, []);

  // Persist edits to the active item
  useEffect(() => {
    if (!activeId) return;
    setHistory((prev) => {
      const next = prev.map((h) => (h.id === activeId ? { ...h, output } : h));
      saveHistory(KEY, next);
      return next;
    });
  }, [output, activeId]);

  const mutation = useMutation({
    mutationFn: (vars: { recipient: string; purpose: string; tone: string; keyPoints: string }) =>
      fn({ data: vars }),
    onSuccess: (res, vars) => {
      setOutput(res.content);
      const item: EmailHistoryItem = {
        id: crypto.randomUUID(),
        createdAt: Date.now(),
        ...vars,
        output: res.content,
      };
      const next = addHistoryItem<EmailHistoryItem>(KEY, item);
      setHistory(next);
      setActiveId(item.id);
      logActivity({ tool: "email", title: vars.purpose || "Drafted email" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const loadItem = (item: EmailHistoryItem) => {
    setRecipient(item.recipient);
    setPurpose(item.purpose);
    setTone(item.tone);
    setKeyPoints(item.keyPoints);
    setOutput(item.output);
    setActiveId(item.id);
  };

  const deleteItem = (id: string) => {
    const next = history.filter((h) => h.id !== id);
    setHistory(next);
    saveHistory(KEY, next);
    if (activeId === id) setActiveId(null);
  };

  const clearAll = () => {
    setHistory([]);
    saveHistory(KEY, []);
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
    downloadFile(`${base}.md`, item.output);
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

        <HistoryPanel<EmailHistoryItem>
          items={history}
          activeId={activeId}
          onLoad={loadItem}
          onDelete={deleteItem}
          onDownload={downloadItem}
          onClear={clearAll}
          renderLabel={(item) => (
            <>
              <div className="truncate font-medium">{item.purpose || "Untitled"}</div>
              <div className="truncate text-xs text-muted-foreground">
                {item.recipient} · {item.tone}
              </div>
            </>
          )}
          emptyHint="Generated emails are saved here in your browser."
        />
      </div>
    </FeatureAccentProvider>
  );
}
