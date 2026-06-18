import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { FileText, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

import { AiOutput } from "@/components/ai-output";
import { Disclaimer } from "@/components/disclaimer";
import { FeatureAccentProvider } from "@/components/feature-accent";
import { HistoryPanel } from "@/components/history-panel";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { summarizeMeeting } from "@/lib/ai.functions";
import {
  HISTORY_KEYS,
  addHistoryItem,
  downloadFile,
  loadHistory,
  logActivity,
  saveHistory,
  subscribeActivity,
} from "@/lib/activity-store";
import { toast } from "sonner";

export const Route = createFileRoute("/meeting")({
  head: () => ({
    meta: [
      { title: "Meeting Notes Summarizer — Workplace AI" },
      { name: "description", content: "Turn raw meeting notes into clear summaries." },
    ],
  }),
  component: MeetingPage,
});

type Style = "concise" | "detailed" | "executive";
type MeetingHistoryItem = {
  id: string;
  createdAt: number;
  style: Style;
  notes: string;
  output: string;
};

const KEY = HISTORY_KEYS.meeting;

function MeetingPage() {
  const fn = useServerFn(summarizeMeeting);
  const [notes, setNotes] = useState("");
  const [style, setStyle] = useState<Style>("concise");
  const [output, setOutput] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [history, setHistory] = useState<MeetingHistoryItem[]>([]);

  useEffect(() => {
    setHistory(loadHistory<MeetingHistoryItem>(KEY));
    return subscribeActivity(() => setHistory(loadHistory<MeetingHistoryItem>(KEY)));
  }, []);

  useEffect(() => {
    if (!activeId) return;
    setHistory((prev) => {
      const next = prev.map((h) => (h.id === activeId ? { ...h, output } : h));
      saveHistory(KEY, next);
      return next;
    });
  }, [output, activeId]);

  const mutation = useMutation({
    mutationFn: (vars: { notes: string; style: Style }) => fn({ data: vars }),
    onSuccess: (res, vars) => {
      setOutput(res.content);
      const item: MeetingHistoryItem = {
        id: crypto.randomUUID(),
        createdAt: Date.now(),
        style: vars.style,
        notes: vars.notes,
        output: res.content,
      };
      setHistory(addHistoryItem<MeetingHistoryItem>(KEY, item));
      setActiveId(item.id);
      logActivity({ tool: "meeting", title: `${vars.style} summary` });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const loadItem = (item: MeetingHistoryItem) => {
    setNotes(item.notes);
    setStyle(item.style);
    setOutput(item.output);
    setActiveId(item.id);
  };

  const deleteItem = (id: string) => {
    const next = history.filter((h) => h.id !== id);
    setHistory(next);
    saveHistory(KEY, next);
    if (activeId === id) setActiveId(null);
  };

  const downloadItem = (item: MeetingHistoryItem) => {
    const base = `meeting-summary-${new Date(item.createdAt).toISOString().slice(0, 10)}`;
    downloadFile(`${base}.md`, item.output);
  };

  return (
    <FeatureAccentProvider accent="cyan">
      <PageHeader
        icon={FileText}
        title="Meeting Notes Summarizer"
        description="Paste raw notes; get a structured summary with action items."
      />
      <div className="grid gap-6 p-6 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)_minmax(0,280px)]">
        <form
          className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]"
          onSubmit={(e) => {
            e.preventDefault();
            if (notes.trim().length < 10) {
              toast.error("Paste your meeting notes first.");
              return;
            }
            mutation.mutate({ notes, style });
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="style">Summary style</Label>
            <Select value={style} onValueChange={(v) => setStyle(v as Style)}>
              <SelectTrigger id="style">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="concise">Concise</SelectItem>
                <SelectItem value="detailed">Detailed</SelectItem>
                <SelectItem value="executive">Executive (TL;DR)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notes">Raw notes / transcript</Label>
            <Textarea
              id="notes"
              rows={14}
              placeholder="Paste meeting notes, transcript, or rough bullets here…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="font-mono text-sm"
            />
          </div>
          <Button type="submit" className="w-full gap-2" disabled={mutation.isPending}>
            <Sparkles className="h-4 w-4" />
            {mutation.isPending ? "Summarizing…" : "Summarize"}
          </Button>
          <Disclaimer />
        </form>

        <AiOutput value={output} onChange={setOutput} loading={mutation.isPending} />

        <HistoryPanel<MeetingHistoryItem>
          items={history}
          activeId={activeId}
          onLoad={loadItem}
          onDelete={deleteItem}
          onDownload={downloadItem}
          onClear={() => {
            setHistory([]);
            saveHistory(KEY, []);
            setActiveId(null);
          }}
          renderLabel={(item) => (
            <>
              <div className="truncate font-medium capitalize">{item.style} summary</div>
              <div className="truncate text-xs text-muted-foreground">
                {item.notes.slice(0, 60) || "—"}
              </div>
            </>
          )}
          emptyHint="Past summaries are saved here in your browser."
        />
      </div>
    </FeatureAccentProvider>
  );
}
