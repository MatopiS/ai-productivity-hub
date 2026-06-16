import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Mail, Send } from "lucide-react";
import { useState } from "react";

import { AiOutput } from "@/components/ai-output";
import { Disclaimer } from "@/components/disclaimer";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { generateEmail } from "@/lib/ai.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/email")({
  head: () => ({
    meta: [
      { title: "Smart Email Generator — Workplace AI" },
      { name: "description", content: "Draft professional emails with AI." },
    ],
  }),
  component: EmailPage,
});

function EmailPage() {
  const fn = useServerFn(generateEmail);
  const [recipient, setRecipient] = useState("");
  const [purpose, setPurpose] = useState("");
  const [tone, setTone] = useState("Professional");
  const [keyPoints, setKeyPoints] = useState("");
  const [output, setOutput] = useState("");

  const mutation = useMutation({
    mutationFn: (vars: {
      recipient: string;
      purpose: string;
      tone: string;
      keyPoints: string;
    }) => fn({ data: vars }),
    onSuccess: (res) => setOutput(res.content),
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <PageHeader
        icon={Mail}
        title="Smart Email Generator"
        description="Describe the email; AI drafts it for you to review and edit."
      />
      <div className="grid gap-6 p-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <form
          className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]"
          onSubmit={(e) => {
            e.preventDefault();
            if (!recipient.trim() || !purpose.trim()) {
              toast.error("Add a recipient and purpose first.");
              return;
            }
            mutation.mutate({ recipient, purpose, tone, keyPoints });
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="recipient">Recipient / audience</Label>
            <Input
              id="recipient"
              placeholder="e.g. Hiring manager at Acme Co."
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="purpose">Purpose</Label>
            <Input
              id="purpose"
              placeholder="e.g. Follow up after interview"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tone">Tone</Label>
            <Select value={tone} onValueChange={setTone}>
              <SelectTrigger id="tone">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["Professional", "Friendly", "Formal", "Concise", "Persuasive", "Apologetic"].map(
                  (t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="kp">Key points (optional)</Label>
            <Textarea
              id="kp"
              rows={5}
              placeholder="Bullet points or details to include"
              value={keyPoints}
              onChange={(e) => setKeyPoints(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full gap-2" disabled={mutation.isPending}>
            <Send className="h-4 w-4" />
            {mutation.isPending ? "Drafting…" : "Generate email"}
          </Button>
          <Disclaimer />
        </form>

        <AiOutput
          value={output}
          onChange={setOutput}
          loading={mutation.isPending}
          placeholder="Your email draft will appear here."
        />
      </div>
    </div>
  );
}
