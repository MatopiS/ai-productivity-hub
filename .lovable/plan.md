# Plan: Dashboard stats, universal history, and Settings

## 1. Shared activity + history store
Create `src/lib/activity-store.ts` — a small localStorage-backed module used by every tool and the dashboard.

- Keys:
  - `workplace-ai-activity-v1` — array of activity events `{ id, tool, title, createdAt }` (capped at 50).
  - `workplace-ai-history-meeting-v1`, `...-tasks-v1`, `...-research-v1` — per-tool history arrays (capped at 25 each), mirroring the existing email history shape.
  - Reuse existing `workplace-ai-email-history-v1` already in `email.tsx`.
- Exports: `loadHistory(key)`, `saveHistory(key, items)`, `addHistoryItem(key, item)`, `logActivity(event)`, `loadActivity()`, `getCounts()` (returns `{ emails, meetings, tasks, research, chats }` derived from history lengths + chat message count).
- Emits a `storage`-like custom event (`workplace-ai:updated`) so the dashboard refreshes live without a reload.

## 2. History sidebar component
Create `src/components/history-panel.tsx` — generalized version of the email history UI already in `email.tsx`.

Props: `title`, `items`, `onLoad(item)`, `onDelete(id)`, `onDownload(item)`, `onClear()`, `activeId`, `renderLabel(item)`.

Refactor `src/routes/email.tsx` to use this component (keeping current behavior and download-as-md). Then add the panel to:
- `src/routes/meeting.tsx` — saves `{ id, createdAt, style, notesPreview, output }`; download as `meeting-summary-<date>.md`.
- `src/routes/tasks.tsx` — saves `{ id, createdAt, goal, deadline, output }`; download as `task-plan-<slug>.md`.
- `src/routes/research.tsx` — saves `{ id, createdAt, topic, depth, output }`; download as `research-<slug>.md`.

Each tool calls `addHistoryItem(...)` + `logActivity(...)` on successful AI generation.

## 3. Dashboard stats + Recent Activity
Update `src/routes/index.tsx`:

- Add a stats row above the tool cards: 5 compact stat cards (Emails, Meetings, Tasks, Research, Chats) reading from `getCounts()`. Each card uses the matching feature accent color.
- Add a "Recent Activity" section below the tool cards: list the last 8 activity events with tool icon, title, and relative time ("2m ago"). Empty state: "No activity yet — try a tool to get started."
- Subscribe to `workplace-ai:updated` and `storage` events to refresh counts/activity live.

## 4. Settings page
Create `src/routes/settings.tsx` (route `/settings`) with `head()` metadata and `FeatureAccentProvider accent="indigo"`.

Sections:
- **Appearance** — theme toggle (reuses `ThemeToggle` logic; radio: System / Light / Dark, persisted to existing `workplace-ai-theme` key with a new `"system"` value handled by the toggle).
- **AI Preferences** — default email tone (Formal/Friendly/Persuasive), default research depth (Quick/Standard/Deep). Stored in `workplace-ai-prefs-v1`. Email and Research routes read these on mount to seed their selects.
- **Privacy & Data** — toggle "Start chat in Incognito by default" (writes existing `workplace-ai-chat-incognito` default). Buttons: "Clear all history" (wipes every history key + activity log, confirms via `AlertDialog`), and per-tool "Clear" buttons.

Add Settings entry to `src/components/app-sidebar.tsx` (Settings icon) at the bottom of the menu.

## 5. Wiring + safety
- All localStorage reads are guarded with `typeof window !== "undefined"` for SSR.
- No backend / DB changes — everything stays browser-local, consistent with the existing chat persistence model.
- No changes to AI server functions or prompts.

## Files

Created:
- `src/lib/activity-store.ts`
- `src/components/history-panel.tsx`
- `src/routes/settings.tsx`

Edited:
- `src/routes/index.tsx` (stats + recent activity)
- `src/routes/email.tsx` (refactor to shared HistoryPanel, log activity, read default tone pref)
- `src/routes/meeting.tsx` (add history + activity)
- `src/routes/tasks.tsx` (add history + activity)
- `src/routes/research.tsx` (add history + activity, read default depth pref)
- `src/routes/chat.tsx` (log activity on send, read incognito default pref)
- `src/components/app-sidebar.tsx` (Settings link)
- `src/components/theme-toggle.tsx` (support "system" mode)
