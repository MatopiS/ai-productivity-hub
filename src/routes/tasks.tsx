import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ListChecks, Sparkles } from "lucide-react";
import { useState } from "react";

import { AiOutput } from "@/components/ai-output";
import { Disclaimer } from "@/components/disclaimer";
import { FeatureAccentProvider } from "@/components/feature-accent";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { planTasks } from "@/lib/ai.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/tasks")({
  head: () => ({
    meta: [
      { title: "AI Task Planner — Workplace AI" },
      { name: "description", content: "Break goals into milestones and tasks." },
    ],
  }),
  component: TasksPage,
});

function TasksPage() {
  const fn = useServerFn(planTasks);
  const [goal, setGoal] = useState("");
  const [deadline, setDeadline] = useState("");
  const [context, setContext] = useState("");
  const [output, setOutput] = useState("");

  const mutation = useMutation({
    mutationFn: (vars: { goal: string; deadline: string; context: string }) =>
      fn({ data: vars }),
    onSuccess: (res) => setOutput(res.content),
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <FeatureAccentProvider accent="navy">
      <PageHeader
        icon={ListChecks}
        title="AI Task Planner"
        description="Describe a goal — get a prioritized plan with milestones and tasks."
      />
      <div className="grid gap-6 p-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <form
          className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]"
          onSubmit={(e) => {
            e.preventDefault();
            if (!goal.trim()) {
              toast.error("Describe your goal first.");
              return;
            }
            mutation.mutate({ goal, deadline, context });
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="goal">Goal</Label>
            <Input
              id="goal"
              placeholder="e.g. Launch beta of analytics dashboard"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="deadline">Deadline (optional)</Label>
            <Input
              id="deadline"
              placeholder="e.g. End of Q3, or 2026-09-30"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ctx">Context (optional)</Label>
            <Textarea
              id="ctx"
              rows={6}
              placeholder="Team, constraints, dependencies, anything that matters."
              value={context}
              onChange={(e) => setContext(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full gap-2" disabled={mutation.isPending}>
            <Sparkles className="h-4 w-4" />
            {mutation.isPending ? "Planning…" : "Generate plan"}
          </Button>
          <Disclaimer />
        </form>

        <AiOutput value={output} onChange={setOutput} loading={mutation.isPending} />
      </div>
    </FeatureAccentProvider>
  );
}
