// Browser-local store for tool history, activity feed, and user prefs.
// Everything is namespaced under `workplace-ai-*` keys in localStorage.

export type ToolKey = "email" | "meeting" | "tasks" | "research" | "chat";

export type ActivityEvent = {
  id: string;
  tool: ToolKey;
  title: string;
  createdAt: number;
};

export type BaseHistoryItem = {
  id: string;
  createdAt: number;
  output: string;
};

export const HISTORY_KEYS: Record<Exclude<ToolKey, "chat">, string> = {
  email: "workplace-ai-email-history-v1",
  meeting: "workplace-ai-history-meeting-v1",
  tasks: "workplace-ai-history-tasks-v1",
  research: "workplace-ai-history-research-v1",
};

export const ACTIVITY_KEY = "workplace-ai-activity-v1";
export const PREFS_KEY = "workplace-ai-prefs-v1";
export const CHAT_STORAGE_KEY = "workplace-ai-chat-v1";
export const CHAT_INCOGNITO_KEY = "workplace-ai-chat-incognito";
export const CHAT_INCOGNITO_DEFAULT_KEY = "workplace-ai-chat-incognito-default";
export const THEME_KEY = "workplace-ai-theme";

export const MAX_HISTORY = 25;
export const MAX_ACTIVITY = 50;

export type UserPrefs = {
  defaultTone: string;
  defaultDepth: "brief" | "standard" | "deep";
};

export const DEFAULT_PREFS: UserPrefs = {
  defaultTone: "Professional",
  defaultDepth: "standard",
};

const UPDATE_EVENT = "workplace-ai:updated";

function safeGet<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeSet(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent(UPDATE_EVENT));
  } catch {
    /* ignore quota errors */
  }
}

export function loadHistory<T extends BaseHistoryItem>(key: string): T[] {
  return safeGet<T[]>(key, []);
}

export function saveHistory<T extends BaseHistoryItem>(key: string, items: T[]) {
  safeSet(key, items.slice(0, MAX_HISTORY));
}

export function addHistoryItem<T extends BaseHistoryItem>(key: string, item: T): T[] {
  const next = [item, ...loadHistory<T>(key)].slice(0, MAX_HISTORY);
  safeSet(key, next);
  return next;
}

export function loadActivity(): ActivityEvent[] {
  return safeGet<ActivityEvent[]>(ACTIVITY_KEY, []);
}

export function logActivity(event: Omit<ActivityEvent, "id" | "createdAt">) {
  const full: ActivityEvent = {
    ...event,
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2),
    createdAt: Date.now(),
  };
  const next = [full, ...loadActivity()].slice(0, MAX_ACTIVITY);
  safeSet(ACTIVITY_KEY, next);
}

export function clearActivity() {
  safeSet(ACTIVITY_KEY, []);
}

export function getCounts(): Record<ToolKey, number> {
  const chat = safeGet<unknown[]>(CHAT_STORAGE_KEY, []);
  return {
    email: loadHistory(HISTORY_KEYS.email).length,
    meeting: loadHistory(HISTORY_KEYS.meeting).length,
    tasks: loadHistory(HISTORY_KEYS.tasks).length,
    research: loadHistory(HISTORY_KEYS.research).length,
    chat: Array.isArray(chat) ? chat.length : 0,
  };
}

export function loadPrefs(): UserPrefs {
  return { ...DEFAULT_PREFS, ...safeGet<Partial<UserPrefs>>(PREFS_KEY, {}) };
}

export function savePrefs(prefs: Partial<UserPrefs>) {
  safeSet(PREFS_KEY, { ...loadPrefs(), ...prefs });
}

export function clearAllHistory() {
  if (typeof window === "undefined") return;
  for (const key of Object.values(HISTORY_KEYS)) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  }
  try {
    window.localStorage.removeItem(ACTIVITY_KEY);
    window.localStorage.removeItem(CHAT_STORAGE_KEY);
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent(UPDATE_EVENT));
}

export function clearToolHistory(tool: Exclude<ToolKey, "chat">) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(HISTORY_KEYS[tool]);
    window.dispatchEvent(new CustomEvent(UPDATE_EVENT));
  } catch {
    /* ignore */
  }
}

export function useActivityRefresh(cb: () => void) {
  if (typeof window === "undefined") return () => {};
  const handler = () => cb();
  window.addEventListener(UPDATE_EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(UPDATE_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

export function slugify(s: string) {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "item"
  );
}

export function downloadFile(filename: string, content: string, mime = "text/markdown") {
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

export function relativeTime(ts: number) {
  const diff = Date.now() - ts;
  const s = Math.floor(diff / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(ts).toLocaleDateString();
}
