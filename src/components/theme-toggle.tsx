import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";

import { THEME_KEY } from "@/lib/activity-store";

export type ThemeChoice = "light" | "dark" | "system";

function resolveTheme(choice: ThemeChoice): "light" | "dark" {
  if (choice !== "system") return choice;
  if (typeof window === "undefined") return "light";
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function applyTheme(choice: ThemeChoice) {
  if (typeof document === "undefined") return;
  const effective = resolveTheme(choice);
  const root = document.documentElement;
  root.classList.toggle("dark", effective === "dark");
  root.style.colorScheme = effective;
}

export function loadStoredTheme(): ThemeChoice {
  if (typeof window === "undefined") return "system";
  try {
    const saved = window.localStorage.getItem(THEME_KEY);
    if (saved === "light" || saved === "dark" || saved === "system") return saved;
  } catch {
    /* ignore */
  }
  return "system";
}

export function persistTheme(choice: ThemeChoice) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(THEME_KEY, choice);
  } catch {
    /* ignore */
  }
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeChoice>("system");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const initial = loadStoredTheme();
    setTheme(initial);
    applyTheme(initial);
    setMounted(true);

    // React to system changes when in system mode
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!mq) return;
    const handler = () => {
      if (loadStoredTheme() === "system") applyTheme("system");
    };
    mq.addEventListener?.("change", handler);
    return () => mq.removeEventListener?.("change", handler);
  }, []);

  const cycle = () => {
    const order: ThemeChoice[] = ["light", "dark", "system"];
    const next = order[(order.indexOf(theme) + 1) % order.length];
    setTheme(next);
    persistTheme(next);
    applyTheme(next);
  };

  const Icon = theme === "system" ? Monitor : theme === "dark" ? Sun : Moon;
  const label =
    theme === "system" ? "System theme" : theme === "dark" ? "Dark mode" : "Light mode";

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={`Theme: ${label}. Click to change.`}
      title={`Theme: ${label}`}
      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background text-muted-foreground transition hover:bg-accent hover:text-accent-foreground"
    >
      {mounted ? <Icon className="h-4 w-4" /> : <Monitor className="h-4 w-4" />}
    </button>
  );
}
