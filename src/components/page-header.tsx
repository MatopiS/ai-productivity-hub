import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function PageHeader({
  icon: Icon,
  title,
  description,
  actions,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 border-b border-border bg-card/50 px-6 py-5 sm:flex sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3.5">
        <div
          className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-primary-foreground"
          style={{ background: "var(--gradient-primary)" }}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold tracking-tight sm:text-2xl">{title}</h1>
          <p className="truncate text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}
