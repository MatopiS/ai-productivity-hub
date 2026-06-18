import { Download, History as HistoryIcon, Trash2 } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";

export type HistoryPanelItem = {
  id: string;
  createdAt: number;
};

export function HistoryPanel<T extends HistoryPanelItem>({
  items,
  activeId,
  onLoad,
  onDelete,
  onDownload,
  onClear,
  renderLabel,
  emptyHint = "Generated items are saved here in your browser.",
}: {
  items: T[];
  activeId: string | null;
  onLoad: (item: T) => void;
  onDelete: (id: string) => void;
  onDownload: (item: T) => void;
  onClear: () => void;
  renderLabel: (item: T) => ReactNode;
  emptyHint?: string;
}) {
  return (
    <aside className="rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-card)] lg:max-h-[calc(100vh-12rem)] lg:overflow-y-auto">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <HistoryIcon className="h-4 w-4" /> History
        </div>
        {items.length > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
          >
            Clear
          </Button>
        )}
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground">{emptyHint}</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => {
            const isActive = item.id === activeId;
            return (
              <li
                key={item.id}
                className={`group rounded-lg border p-3 text-sm transition-colors ${
                  isActive
                    ? "border-primary/50 bg-primary/5"
                    : "border-border hover:bg-muted/50"
                }`}
              >
                <button
                  type="button"
                  onClick={() => onLoad(item)}
                  className="block w-full text-left"
                >
                  {renderLabel(item)}
                  <div className="mt-1 text-[11px] text-muted-foreground">
                    {new Date(item.createdAt).toLocaleString()}
                  </div>
                </button>
                <div className="mt-2 flex gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 flex-1 gap-1 text-xs"
                    onClick={() => onDownload(item)}
                  >
                    <Download className="h-3 w-3" /> Download
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                    onClick={() => onDelete(item.id)}
                    aria-label="Delete"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </aside>
  );
}
