import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Search, Sparkles } from "lucide-react";
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
import { researchTopic } from "@/lib/ai.functions";
import {
  HISTORY_KEYS,
  addHistoryItem,
  downloadFile,
  loadHistory,
  loadPrefs,
  logActivity,
  saveHistory,
  slugify,
  useActivityRefresh,
} from "@/lib/activity-store";
import { toast } from "sonner";

export const Route = createFileRoute("/research")({
  head: () => ({
    meta: [
      { title: "AI Research Assistant — Workplace AI" },
      { name: "description", content: "Get a structured briefing on any topic." },
    ],
  }),
  component: ResearchPage,
});

type Depth = "brief" | "standard" | "deep";
type ResearchHistoryItem = {
  id: string;
  createdAt: number;
  topic: string;
  depth: Depth;
  output: string;
};

const KEY = HISTORY_KEYS.research;

function ResearchPage() {
  const fn = useServerFn(researchTopic);
  const [topic, setTopic] = useState("");
  const [depth, setDepth] = useState<Depth>("standard");
  const [output, setOutput] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [history, setHistory] = useState<ResearchHistoryItem[]>([]);

  useEffect(() => {
    setHistory(loadHistory<ResearchHistoryItem>(KEY));
    setDepth(loadPrefs().defaultDepth);
    return useActivityRefresh(() => setHistory(loadHistory<ResearchHistoryItem>(KEY)));
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
    mutationFn: (vars: { topic: string; depth: Depth }) => fn({ data: vars }),
    onSuccess: (res, vars) => {
      setOutput(res.content);
      const item: ResearchHistoryItem = {
        id: crypto.randomUUID(),
        createdAt: Date.now(),
        ...vars,
        output: res.content,
      };
      setHistory(addHistoryItem<ResearchHistoryItem>(KEY, item));
      setActiveId(item.id);
      logActivity({ tool: "research", title: vars.topic });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const loadItem = (item: ResearchHistoryItem) => {
    setTopic(item.topic);
    setDepth(item.depth);
    setOutput(item.output);
    setActiveId(item.id);
  };

  const deleteItem = (id: string) => {
    const next = history.filter((h) => h.id !== id);
    setHistory(next);
    saveHistory(KEY, next);
    if (activeId === id) setActiveId(null);
  };

  const downloadItem = (item: ResearchHistoryItem) => {
    downloadFile(`research-${slugify(item.topic)}.md`, item.output);
  };

  return (
    <FeatureAccentProvider accent="azure">
      <PageHeader
        icon={Search}
        title="AI Research Assistant"
        description="Quickly explore a topic with a structured briefing."
      />
      <div className="grid gap-6 p-6 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)_minmax(0,280px)]">
        <form
          className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]"
          onSubmit={(e) => {
            e.preventDefault();
            if (!topic.trim()) {
              toast.error("Enter a topic first.");
              return;
            }
            mutation.mutate({ topic, depth });
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="topic">Topic</Label>
            <Input
              id="topic"
              placeholder="e.g. Vector databases for RAG"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="depth">Depth</Label>
            <Select value={depth} onValueChange={(v) => setDepth(v as Depth)}>
              <SelectTrigger id="depth">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="brief">Brief overview</SelectItem>
                <SelectItem value="standard">Standard briefing</SelectItem>
                <SelectItem value="deep">Deep dive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full gap-2" disabled={mutation.isPending}>
            <Sparkles className="h-4 w-4" />
            {mutation.isPending ? "Researching…" : "Research topic"}
          </Button>
          <Disclaimer />
        </form>

        <AiOutput value={output} onChange={setOutput} loading={mutation.isPending} />

        <HistoryPanel<ResearchHistoryItem>
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
              <div className="truncate font-medium">{item.topic}</div>
              <div className="truncate text-xs capitalize text-muted-foreground">
                {item.depth} briefing
              </div>
            </>
          )}
          emptyHint="Past briefings are saved here in your browser."
        />
      </div>
    </FeatureAccentProvider>
  );
}
