import { createFileRoute } from "@tanstack/react-router";
import { Settings as SettingsIcon, Trash2, Palette, Shield, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

import { Disclaimer } from "@/components/disclaimer";
import { FeatureAccentProvider } from "@/components/feature-accent";
import { PageHeader } from "@/components/page-header";
import { applyTheme, loadStoredTheme, persistTheme, type ThemeChoice } from "@/components/theme-toggle";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  CHAT_INCOGNITO_DEFAULT_KEY,
  clearAllHistory,
  clearToolHistory,
  loadPrefs,
  savePrefs,
} from "@/lib/activity-store";
import { toast } from "sonner";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Workplace AI" },
      { name: "description", content: "Customize appearance, AI defaults, and privacy." },
    ],
  }),
  component: SettingsPage,
});

const TONES = ["Professional", "Friendly", "Formal", "Concise", "Persuasive", "Apologetic"];
const DEPTHS: Array<"brief" | "standard" | "deep"> = ["brief", "standard", "deep"];

function SettingsPage() {
  const [theme, setTheme] = useState<ThemeChoice>("system");
  const [tone, setTone] = useState("Professional");
  const [depth, setDepth] = useState<"brief" | "standard" | "deep">("standard");
  const [incognitoDefault, setIncognitoDefault] = useState(false);

  useEffect(() => {
    setTheme(loadStoredTheme());
    const prefs = loadPrefs();
    setTone(prefs.defaultTone);
    setDepth(prefs.defaultDepth);
    if (typeof window !== "undefined") {
      setIncognitoDefault(window.localStorage.getItem(CHAT_INCOGNITO_DEFAULT_KEY) === "1");
    }
  }, []);

  const onTheme = (next: ThemeChoice) => {
    setTheme(next);
    persistTheme(next);
    applyTheme(next);
  };

  const onTone = (v: string) => {
    setTone(v);
    savePrefs({ defaultTone: v });
    toast.success("Default tone saved");
  };

  const onDepth = (v: "brief" | "standard" | "deep") => {
    setDepth(v);
    savePrefs({ defaultDepth: v });
    toast.success("Default depth saved");
  };

  const onIncognitoDefault = (checked: boolean) => {
    setIncognitoDefault(checked);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(CHAT_INCOGNITO_DEFAULT_KEY, checked ? "1" : "0");
    }
  };

  return (
    <FeatureAccentProvider accent="indigo">
      <PageHeader
        icon={SettingsIcon}
        title="Settings"
        description="Personalize your workspace, AI defaults, and privacy."
      />

      <div className="mx-auto max-w-3xl space-y-6 p-6">
        <Section icon={Palette} title="Appearance">
          <p className="text-sm text-muted-foreground">
            Choose how the app looks. System matches your OS preference.
          </p>
          <RadioGroup
            value={theme}
            onValueChange={(v) => onTheme(v as ThemeChoice)}
            className="mt-4 grid gap-3 sm:grid-cols-3"
          >
            {(["system", "light", "dark"] as ThemeChoice[]).map((opt) => (
              <Label
                key={opt}
                htmlFor={`theme-${opt}`}
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-background p-3 transition hover:border-primary/40 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
              >
                <RadioGroupItem id={`theme-${opt}`} value={opt} />
                <span className="text-sm capitalize">{opt}</span>
              </Label>
            ))}
          </RadioGroup>
        </Section>

        <Section icon={Sparkles} title="AI preferences">
          <p className="text-sm text-muted-foreground">
            Defaults used when you open the email and research tools.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="default-tone">Default email tone</Label>
              <Select value={tone} onValueChange={onTone}>
                <SelectTrigger id="default-tone">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TONES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="default-depth">Default research depth</Label>
              <Select value={depth} onValueChange={(v) => onDepth(v as typeof depth)}>
                <SelectTrigger id="default-depth">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DEPTHS.map((d) => (
                    <SelectItem key={d} value={d} className="capitalize">
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Section>

        <Section icon={Shield} title="Privacy & data">
          <div className="flex items-start justify-between gap-4 rounded-lg border border-border bg-background p-4">
            <div className="min-w-0">
              <div className="text-sm font-medium">Start chats in Incognito by default</div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                When enabled, new chat sessions won't be saved to this browser unless you turn
                incognito off.
              </p>
            </div>
            <Switch checked={incognitoDefault} onCheckedChange={onIncognitoDefault} />
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {(["email", "meeting", "tasks", "research"] as const).map((tool) => (
              <Button
                key={tool}
                type="button"
                variant="outline"
                size="sm"
                className="justify-start gap-2"
                onClick={() => {
                  clearToolHistory(tool);
                  toast.success(`${tool} history cleared`);
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Clear <span className="capitalize">{tool}</span> history
              </Button>
            ))}
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" className="mt-4 gap-2">
                <Trash2 className="h-4 w-4" /> Clear all history & activity
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear everything?</AlertDialogTitle>
                <AlertDialogDescription>
                  This removes all saved emails, summaries, plans, briefings, chat history, and
                  the activity feed from this browser. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    clearAllHistory();
                    toast.success("All history cleared");
                  }}
                >
                  Yes, clear everything
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </Section>

        <Disclaimer />
      </div>
    </FeatureAccentProvider>
  );
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof SettingsIcon;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
      <div className="mb-3 flex items-center gap-2">
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <h2 className="text-base font-semibold">{title}</h2>
      </div>
      {children}
    </section>
  );
}
