import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { FileText, Sparkles } from "lucide-react";
import { useState } from "react";

import { AiOutput } from "@/components/ai-output";
import { Disclaimer } from "@/components/disclaimer";
import { FeatureAccentProvider } from "@/components/feature-accent";
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

function MeetingPage() {
  const fn = useServerFn(summarizeMeeting);
  const [notes, setNotes] = useState("");
  const [style, setStyle] = useState<"concise" | "detailed" | "executive">("concise");
  const [output, setOutput] = useState("");

  const mutation = useMutation({
    mutationFn: (vars: { notes: string; style: "concise" | "detailed" | "executive" }) =>
      fn({ data: vars }),
    onSuccess: (res) => setOutput(res.content),
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <FeatureAccentProvider accent="cyan">
      <PageHeader
        icon={FileText}
        title="Meeting Notes Summarizer"
        description="Paste raw notes; get a structured summary with action items."
      />
      <div className="grid gap-6 p-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
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
            <Select value={style} onValueChange={(v) => setStyle(v as typeof style)}>
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
      </div>
    </FeatureAccentProvider>
  );
}
