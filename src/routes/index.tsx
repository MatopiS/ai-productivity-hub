import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Mail,
  FileText,
  ListChecks,
  Search,
  MessagesSquare,
  LayoutDashboard,
  ArrowRight,
  Sparkles,
  Activity,
} from "lucide-react";
import { useEffect, useState } from "react";

import { Disclaimer } from "@/components/disclaimer";
import { PageHeader } from "@/components/page-header";
import {
  getCounts,
  loadActivity,
  relativeTime,
  subscribeActivity,
  type ActivityEvent,
  type ToolKey,
} from "@/lib/activity-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Workplace AI" },
      {
        name: "description",
        content:
          "Your AI workplace assistant: draft emails, summarize meetings, plan, research, chat.",
      },
    ],
  }),
  component: Dashboard,
});

const TOOL_META: Record<
  ToolKey,
  { title: string; href: "/email" | "/meeting" | "/tasks" | "/research" | "/chat"; icon: typeof Mail; iconClass: string; label: string }
> = {
  email: {
    title: "Smart Email Generator",
    href: "/email",
    icon: Mail,
    iconClass: "bg-sky-500/10 text-sky-600 dark:text-sky-300",
    label: "Emails",
  },
  meeting: {
    title: "Meeting Notes Summarizer",
    href: "/meeting",
    icon: FileText,
    iconClass: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300",
    label: "Meetings",
  },
  tasks: {
    title: "AI Task Planner",
    href: "/tasks",
    icon: ListChecks,
    iconClass: "bg-blue-700/10 text-blue-800 dark:text-blue-300",
    label: "Plans",
  },
  research: {
    title: "AI Research Assistant",
    href: "/research",
    icon: Search,
    iconClass: "bg-blue-500/10 text-blue-600 dark:text-blue-300",
    label: "Briefings",
  },
  chat: {
    title: "AI Chatbot",
    href: "/chat",
    icon: MessagesSquare,
    iconClass: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-300",
    label: "Chat msgs",
  },
};

const tools: Array<{
  title: string;
  description: string;
  href: "/email" | "/meeting" | "/tasks" | "/research" | "/chat";
  icon: typeof Mail;
  accent: string;
  iconClass: string;
}> = [
  {
    title: "Smart Email Generator",
    description: "Draft polished emails from a short brief.",
    icon: Mail,
    href: "/email",
    accent: "from-sky-500/20 to-blue-400/10",
    iconClass: "bg-sky-500/10 text-sky-600 dark:text-sky-300",
  },
  {
    title: "Meeting Notes Summarizer",
    description: "Turn raw notes into summaries, decisions and action items.",
    icon: FileText,
    href: "/meeting",
    accent: "from-cyan-500/20 to-sky-400/10",
    iconClass: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300",
  },
  {
    title: "AI Task Planner",
    description: "Break goals into milestones and prioritized tasks.",
    icon: ListChecks,
    href: "/tasks",
    accent: "from-blue-700/25 to-blue-500/10",
    iconClass: "bg-blue-700/10 text-blue-800 dark:text-blue-300",
  },
  {
    title: "AI Research Assistant",
    description: "Get structured briefings on any topic in seconds.",
    icon: Search,
    href: "/research",
    accent: "from-blue-500/20 to-indigo-400/10",
    iconClass: "bg-blue-500/10 text-blue-600 dark:text-blue-300",
  },
  {
    title: "AI Chatbot",
    description: "Chat with your assistant. Threads stored on your device.",
    icon: MessagesSquare,
    href: "/chat",
    accent: "from-indigo-500/20 to-blue-500/10",
    iconClass: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-300",
  },
];

function Dashboard() {
  const [counts, setCounts] = useState<Record<ToolKey, number>>({
    email: 0,
    meeting: 0,
    tasks: 0,
    research: 0,
    chat: 0,
  });
  const [activity, setActivity] = useState<ActivityEvent[]>([]);

  useEffect(() => {
    const refresh = () => {
      setCounts(getCounts());
      setActivity(loadActivity().slice(0, 8));
    };
    refresh();
    return subscribeActivity(refresh);
  }, []);

  const statOrder: ToolKey[] = ["email", "meeting", "tasks", "research", "chat"];

  return (
    <div>
      <PageHeader
        icon={LayoutDashboard}
        title="Workplace AI"
        description="Automate workplace tasks with AI — pick a tool to get started."
      />

      <div className="space-y-8 p-6">
        <section
          className="relative overflow-hidden rounded-2xl border border-border p-8 shadow-[var(--shadow-elegant)]"
          style={{ background: "var(--gradient-primary)" }}
        >
          <div className="relative z-10 max-w-2xl text-primary-foreground">
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-xs font-medium backdrop-blur">
              <Sparkles className="h-3 w-3" /> AI-powered
            </div>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Less busywork. More meaningful work.
            </h2>
            <p className="mt-2 max-w-xl text-sm opacity-90 sm:text-base">
              A focused suite of AI tools for professionals — draft, summarize, plan, and research
              from a single dashboard.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link
                to="/chat"
                className="inline-flex items-center gap-1.5 rounded-lg bg-white px-4 py-2 text-sm font-medium text-primary transition hover:bg-white/90"
              >
                Open chat <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                to="/email"
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/30 bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur transition hover:bg-white/20"
              >
                Draft an email
              </Link>
            </div>
          </div>
          <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-20 right-20 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
        </section>

        <section>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Your activity
          </h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {statOrder.map((k) => {
              const meta = TOOL_META[k];
              const Icon = meta.icon;
              return (
                <Link
                  key={k}
                  to={meta.href}
                  className="group rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:border-primary/40"
                >
                  <div className="flex items-center justify-between">
                    <div
                      className={`grid h-9 w-9 place-items-center rounded-lg ${meta.iconClass}`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="text-2xl font-semibold tabular-nums">{counts[k]}</div>
                  </div>
                  <div className="mt-2 text-xs font-medium text-muted-foreground">
                    {meta.label}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <section>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Tools
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tools.map((t) => (
              <Link
                key={t.href}
                to={t.href}
                className="group relative overflow-hidden rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[var(--shadow-elegant)]"
              >
                <div
                  className={`pointer-events-none absolute inset-0 bg-gradient-to-br opacity-0 transition group-hover:opacity-100 ${t.accent}`}
                />
                <div className="relative">
                  <div className={`mb-4 grid h-10 w-10 place-items-center rounded-lg ${t.iconClass}`}>
                    <t.icon className="h-5 w-5" />
                  </div>
                  <div className="font-semibold">{t.title}</div>
                  <p className="mt-1 text-sm text-muted-foreground">{t.description}</p>
                  <div className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary opacity-0 transition group-hover:opacity-100">
                    Open <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            <Activity className="h-3.5 w-3.5" /> Recent activity
          </h3>
          <div className="rounded-xl border border-border bg-card p-2 shadow-[var(--shadow-card)]">
            {activity.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                No activity yet — try a tool to get started.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {activity.map((ev) => {
                  const meta = TOOL_META[ev.tool];
                  const Icon = meta.icon;
                  return (
                    <li key={ev.id}>
                      <Link
                        to={meta.href}
                        className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition hover:bg-muted/50"
                      >
                        <div
                          className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${meta.iconClass}`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium">{ev.title}</div>
                          <div className="truncate text-xs text-muted-foreground">
                            {meta.title}
                          </div>
                        </div>
                        <div className="shrink-0 text-xs text-muted-foreground">
                          {relativeTime(ev.createdAt)}
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>

        <Disclaimer />
      </div>
    </div>
  );
}
