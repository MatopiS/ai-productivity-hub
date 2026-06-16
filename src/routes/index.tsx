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
} from "lucide-react";

import { Disclaimer } from "@/components/disclaimer";
import { PageHeader } from "@/components/page-header";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Workplace AI" },
      {
        name: "description",
        content: "Your AI workplace assistant: draft emails, summarize meetings, plan, research, chat.",
      },
    ],
  }),
  component: Dashboard,
});

const tools = [
  {
    title: "Smart Email Generator",
    description: "Draft polished emails from a short brief.",
    icon: Mail,
    href: "/email" as const,
    accent: "from-indigo-500/15 to-violet-500/10",
  },
  {
    title: "Meeting Notes Summarizer",
    description: "Turn raw notes into summaries, decisions and action items.",
    icon: FileText,
    href: "/meeting" as const,
    accent: "from-sky-500/15 to-indigo-500/10",
  },
  {
    title: "AI Task Planner",
    description: "Break goals into milestones and prioritized tasks.",
    icon: ListChecks,
    href: "/tasks" as const,
    accent: "from-emerald-500/15 to-teal-500/10",
  },
  {
    title: "AI Research Assistant",
    description: "Get structured briefings on any topic in seconds.",
    icon: Search,
    href: "/research" as const,
    accent: "from-amber-500/15 to-orange-500/10",
  },
  {
    title: "AI Chatbot",
    description: "Chat with your assistant. Threads stored on your device.",
    icon: MessagesSquare,
    href: "/chat" as const,
    accent: "from-fuchsia-500/15 to-pink-500/10",
  },
];

function Dashboard() {
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
                  <div className="mb-4 grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
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

        <Disclaimer />
      </div>
    </div>
  );
}
