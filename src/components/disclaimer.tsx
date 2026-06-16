import { Info } from "lucide-react";

export function Disclaimer({ className = "" }: { className?: string }) {
  return (
    <div
      className={`flex items-start gap-2.5 rounded-lg border border-border bg-muted/50 px-3.5 py-2.5 text-xs text-muted-foreground ${className}`}
    >
      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
      <p>
        <span className="font-medium text-foreground">Responsible AI:</span> Generated content can
        be inaccurate or biased. Always review, fact-check, and edit before sending or acting on
        it. Avoid pasting confidential or personal data.
      </p>
    </div>
  );
}
