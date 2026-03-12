import { createVertex } from "@ai-sdk/google-vertex";
import {
  createUIMessageStream,
  createUIMessageStreamResponse,
  streamText,
  generateText,
  stepCountIs,
  convertToModelMessages,
  type ModelMessage,
} from "ai";

import { getSystemPrompt, isInitialPrompt } from "@/constants/agent-prompts";
import type { ThemeVariables } from "@/lib/screen-utils";
import { createTools, type FrameState } from "@/lib/agent/tools";
import { runPlanningPipeline } from "@/lib/agent/planner";

export const maxDuration = 120;

const vertex = createVertex({
  ...(process.env.GOOGLE_CLIENT_EMAIL &&
    process.env.GOOGLE_PRIVATE_KEY && {
      googleAuthOptions: {
        credentials: {
          client_email: process.env.GOOGLE_CLIENT_EMAIL,
          private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
          private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
        },
      },
    }),
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function hasParts(
  msg: any,
): msg is { role: string; parts: Array<{ type: string }> } {
  return Array.isArray(msg?.parts);
}

/**
 * Strip base64 data URIs from message content to prevent bloating the
 * Gemini API request. Works by serializing/deserializing the entire
 * messages array to catch base64 data nested at any depth.
 */
function stripBase64FromMessages(messages: ModelMessage[]): ModelMessage[] {
  const BASE64_RE = /data:image\/[^;]+;base64,[A-Za-z0-9+/=]{100,}/g;
  const serialized = JSON.stringify(messages);
  if (!BASE64_RE.test(serialized)) return messages;
  return JSON.parse(
    serialized.replace(BASE64_RE, "(base64 image data omitted)"),
  ) as ModelMessage[];
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const rawMessages = Array.isArray(body?.messages) ? body.messages : [];
    const initialFrames = Array.isArray(body?.frames) ? body.frames : [];
    const initialTheme = (body?.theme ?? {}) as ThemeVariables;

    const lastMsg = rawMessages[rawMessages.length - 1];
    const userPrompt =
      typeof lastMsg?.content === "string"
        ? lastMsg.content
        : ((lastMsg?.parts?.[0] as { text?: string })?.text ?? "");

    // Mutable state captured by tool closures
    const frames: FrameState[] = initialFrames.map((f: FrameState) => ({
      id: f.id,
      label: f.label,
      left: f.left ?? 0,
      top: f.top ?? 0,
      html: f.html ?? "",
    }));
    const theme: ThemeVariables = { ...initialTheme };
    const imageMap: Record<string, string> = {};

    const stream = createUIMessageStream({
      execute: async ({ writer }) => {
        writer.write({
          type: "data-agent-status",
          data: {
            status: "received",
            message: "Request received, AI responding…",
          },
          transient: true,
        });

        // 1. Planning pipeline (if initial request)
        let planContext = "";
        if (isInitialPrompt(frames, theme) && userPrompt.trim()) {
          planContext = await runPlanningPipeline(userPrompt, vertex, writer);
        }

        // 2. Create tools with mutable context
        const tools = createTools({ frames, theme, imageMap, writer, vertex });

        // 3. Build system prompt
        const system = getSystemPrompt(frames, theme, planContext);

        // 4. Prepare messages
        const modelMessages =
          rawMessages.length > 0 && rawMessages.some(hasParts)
            ? await convertToModelMessages(rawMessages, { tools })
            : rawMessages.map(
                (m: {
                  role: string;
                  content?: string;
                  parts?: Array<{ type: string; text?: string }>;
                }) => ({
                  role: m.role,
                  content:
                    m.content ??
                    (Array.isArray(m.parts)
                      ? m.parts
                          .filter(
                            (p): p is { type: string; text: string } =>
                              p.type === "text" && p.text != null,
                          )
                          .map((p) => p.text)
                          .join("")
                      : ""),
                }),
              );

        const validMessages = modelMessages.filter(
          (m: ModelMessage) =>
            (typeof m.content === "string" && m.content.length > 0) ||
            (Array.isArray(m.content) && m.content.length > 0),
        );
        const messagesToSend: ModelMessage[] =
          validMessages.length === 0
            ? [
                {
                  role: "user" as const,
                  content: userPrompt?.trim() || "Hello",
                },
              ]
            : validMessages;

        // 5. Strip base64 images from history to avoid Gemini payload limits
        const sanitizedMessages = stripBase64FromMessages(messagesToSend);

        // 6. Run agentic streamText
        const result = streamText({
          model: vertex("gemini-3-pro-preview"),
          system,
          messages: sanitizedMessages,
          tools,
          stopWhen: stepCountIs(10),
          experimental_repairToolCall: async ({
            toolCall,
            inputSchema,
            error,
          }) => {
            const schema = await inputSchema({
              toolName: toolCall.toolName,
            });
            if (!schema) return null;
            const repaired = await generateText({
              model: vertex("gemini-2.0-flash"),
              prompt: [
                `The following tool call arguments are invalid and caused this error: ${error.message}`,
                `Tool: ${toolCall.toolName}`,
                `Arguments: ${toolCall.input}`,
                `Expected JSON schema: ${JSON.stringify(schema)}`,
                `Return ONLY the corrected JSON arguments object, nothing else.`,
              ].join("\n"),
            });
            try {
              JSON.parse(repaired.text);
              return {
                type: "tool-call" as const,
                toolCallId: toolCall.toolCallId,
                toolName: toolCall.toolName,
                input: repaired.text,
              };
            } catch {
              return null;
            }
          },
        });

        // 7. Merge into UIMessageStream
        writer.merge(result.toUIMessageStream());
      },
    });

    return createUIMessageStreamResponse({ stream });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Chat API error" },
      { status: 500 },
    );
  }
}
