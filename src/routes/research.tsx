import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Search, Sparkles } from "lucide-react";
import { useState } from "react";

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
import { researchTopic } from "@/lib/ai.functions";
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

function ResearchPage() {
  const fn = useServerFn(researchTopic);
  const [topic, setTopic] = useState("");
  const [depth, setDepth] = useState<"brief" | "standard" | "deep">("standard");
  const [output, setOutput] = useState("");

  const mutation = useMutation({
    mutationFn: (vars: { topic: string; depth: "brief" | "standard" | "deep" }) =>
      fn({ data: vars }),
    onSuccess: (res) => setOutput(res.content),
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <FeatureAccentProvider accent="azure">
      <PageHeader
        icon={Search}
        title="AI Research Assistant"
        description="Quickly explore a topic with a structured briefing."
      />
      <div className="grid gap-6 p-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
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
            <Select value={depth} onValueChange={(v) => setDepth(v as typeof depth)}>
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
      </div>
    </FeatureAccentProvider>
  );
}
