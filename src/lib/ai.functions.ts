import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";

import { createLovableAiGatewayProvider } from "./ai-gateway.server";

const MODEL = "google/gemini-3-flash-preview";

function getModel() {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("Missing LOVABLE_API_KEY");
  const gateway = createLovableAiGatewayProvider(key);
  return gateway(MODEL);
}

async function run(system: string, prompt: string): Promise<string> {
  try {
    const { text } = await generateText({ model: getModel(), system, prompt });
    return text;
  } catch (err: unknown) {
    const e = err as { statusCode?: number; status?: number; message?: string };
    const code = e.statusCode ?? e.status;
    if (code === 429) throw new Error("Rate limit reached. Please try again in a moment.");
    if (code === 402)
      throw new Error("AI credits exhausted. Please add credits in your workspace billing.");
    throw new Error(e.message ?? "AI request failed");
  }
}

export const generateEmail = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      recipient: z.string().min(1),
      purpose: z.string().min(1),
      tone: z.string().min(1),
      keyPoints: z.string().optional().default(""),
    }),
  )
  .handler(async ({ data }) => {
    const system =
      "You are a professional email writing assistant. Write clear, well-structured business emails. Include a subject line on the first line prefixed with 'Subject: ', then a blank line, then the email body with greeting, body, and sign-off. Use the requested tone.";
    const prompt = `Recipient / audience: ${data.recipient}
Purpose: ${data.purpose}
Tone: ${data.tone}
Key points to include:
${data.keyPoints || "(none provided)"}

Draft the email now.`;
    return { content: await run(system, prompt) };
  });

export const summarizeMeeting = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      notes: z.string().min(10),
      style: z.enum(["concise", "detailed", "executive"]).default("concise"),
    }),
  )
  .handler(async ({ data }) => {
    const system = `You summarize meeting notes for busy professionals. Output well-formatted markdown with these sections:

## Summary
A ${data.style} 2-4 sentence overview.

## Key Decisions
- bullet list

## Action Items
- [ ] Owner — task — due date (if mentioned)

## Open Questions
- bullet list

Be faithful to the source; do not invent details.`;
    return { content: await run(system, data.notes) };
  });

export const planTasks = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      goal: z.string().min(1),
      deadline: z.string().optional().default(""),
      context: z.string().optional().default(""),
    }),
  )
  .handler(async ({ data }) => {
    const system = `You are a productivity coach. Given a goal, output an actionable plan in markdown:

## Plan: <short title>
Brief framing (1-2 sentences).

## Milestones
1. Milestone — target date
2. ...

## Tasks
Group by milestone. Each task: [ ] Task — estimated effort — priority (P0/P1/P2)

## Risks & Mitigations
- bullet list

Keep tasks small (≤ 1 day each where possible).`;
    const prompt = `Goal: ${data.goal}
Deadline: ${data.deadline || "(none specified)"}
Context: ${data.context || "(none)"}

Build the plan now.`;
    return { content: await run(system, prompt) };
  });

export const researchTopic = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      topic: z.string().min(1),
      depth: z.enum(["brief", "standard", "deep"]).default("standard"),
    }),
  )
  .handler(async ({ data }) => {
    const system = `You are a research assistant. Produce a ${data.depth} structured briefing in markdown:

## Overview
2-4 sentences.

## Key Concepts
- bullet points

## Current Landscape
Short prose paragraphs.

## Considerations & Trade-offs
- bullet points

## Suggested Next Steps
- bullet points

Be honest about uncertainty. If you don't have reliable info on something, say so.`;
    return { content: await run(system, `Topic: ${data.topic}`) };
  });
