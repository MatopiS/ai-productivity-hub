import { Copy, Check, Loader2 } from "lucide-react";
import { useState } from "react";
import ReactMarkdown from "react-markdown";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export function AiOutput({
  value,
  onChange,
  loading,
  placeholder = "AI output will appear here. You can edit it before copying.",
}: {
  value: string;
  onChange: (v: string) => void;
  loading?: boolean;
  placeholder?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <div className="flex items-center gap-2 text-sm font-medium">
          {loading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
              <span>Generating…</span>
            </>
          ) : (
            <span>Output</span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={!value}
            onClick={() => setEditing((e) => !e)}
          >
            {editing ? "Preview" : "Edit"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={!value}
            onClick={copy}
            className="gap-1.5"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            Copy
          </Button>
        </div>
      </div>
      <div className="min-h-[280px] flex-1 overflow-auto">
        {editing || !value ? (
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="h-full min-h-[280px] resize-none border-0 bg-transparent px-5 py-4 font-mono text-sm shadow-none focus-visible:ring-0"
          />
        ) : (
          <div className="prose prose-sm max-w-none px-5 py-4 dark:prose-invert prose-headings:font-semibold prose-h2:mt-4 prose-h2:text-base prose-p:text-sm prose-li:text-sm">
            <ReactMarkdown>{value}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
