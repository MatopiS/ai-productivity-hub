import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";

import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

const SYSTEM = `You are a helpful AI workplace productivity assistant. You help professionals draft communications, plan work, summarize information, and think through problems. Be concise, structured, and practical. Use markdown formatting (headings, lists, code blocks) where useful. If asked for something outside your knowledge or that requires real-time data you don't have, say so honestly.`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as { messages?: unknown };
        if (!Array.isArray(body.messages)) {
          return new Response("Messages required", { status: 400 });
        }
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const gateway = createLovableAiGatewayProvider(key);
        const result = streamText({
          model: gateway("google/gemini-3-flash-preview"),
          system: SYSTEM,
          messages: await convertToModelMessages(body.messages as UIMessage[]),
        });

        return result.toUIMessageStreamResponse({
          originalMessages: body.messages as UIMessage[],
          onError: (error) => {
            const e = error as { statusCode?: number; message?: string };
            if (e.statusCode === 429) return "Rate limit reached. Please try again shortly.";
            if (e.statusCode === 402)
              return "AI credits exhausted. Add credits in your workspace billing.";
            return e.message ?? "Something went wrong.";
          },
        });
      },
    },
  },
});
