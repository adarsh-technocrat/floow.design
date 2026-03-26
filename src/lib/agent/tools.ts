import { tool, generateText, generateObject, streamText } from "ai";
import type { UIMessageStreamWriter } from "ai";
import type { GoogleVertexProvider } from "@ai-sdk/google-vertex";
import { z } from "zod";
import { FRAME_STEP } from "@/lib/canvas-utils";
import {
  wrapScreenBody,
  extractBodyContent,
  normalizeThemeVars,
  truncatePartialHtml,
  type ThemeVariables,
} from "@/lib/screen-utils";
import { type UpdateScreenStreamState } from "./stream-helpers";

export interface FrameState {
  id: string;
  label: string;
  left: number;
  top: number;
  html: string;
}

export interface ImageGenContext {
  generateAndUpload(args: {
    id: string;
    prompt: string;
    aspectRatio: string;
    background: string;
  }): Promise<string | null>;
}

export interface ToolContext {
  frames: FrameState[];
  theme: ThemeVariables;
  writer?: UIMessageStreamWriter;
  designModel?: {
    vertex: GoogleVertexProvider;
    modelId: string;
  };
  imageContext?: ImageGenContext;
  screenPositions?: Array<{ left: number; top: number }>;
  allowSpawnAgents?: boolean;
  excludeCreateScreen?: boolean;
}

function stripHtmlMarkdown(raw: string): string {
  const trimmed = raw.trim();
  return trimmed
    .replace(/^```(?:html)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

async function generateScreenHtmlWithDesignModel(
  vertex: GoogleVertexProvider,
  modelId: string,
  prompt: string,
  options?: { maxOutputTokens?: number },
): Promise<string | null> {
  try {
    const { text } = await generateText({
      model: vertex(modelId),
      prompt,
      maxOutputTokens: options?.maxOutputTokens ?? 16384,
      providerOptions: DESIGN_MODEL_PROVIDER_OPTIONS,
    });
    const out = stripHtmlMarkdown(text);
    return out || null;
  } catch {
    return null;
  }
}

function stripLeadingMarkdownFence(raw: string): string {
  return raw.replace(/^```(?:html)?\s*/i, "");
}

async function streamScreenHtmlWithDesignModel(
  vertex: GoogleVertexProvider,
  modelId: string,
  prompt: string,
  onChunk: (accumulated: string) => void,
  options?: { maxOutputTokens?: number },
): Promise<string | null> {
  try {
    const result = streamText({
      model: vertex(modelId),
      prompt,
      maxOutputTokens: options?.maxOutputTokens ?? 16384,
    });
    let accumulated = "";
    for await (const part of result.textStream) {
      accumulated += part;
      const cleaned = truncatePartialHtml(
        stripLeadingMarkdownFence(accumulated),
      );
      if (cleaned) onChunk(cleaned);
    }
    if (accumulated) onChunk(stripLeadingMarkdownFence(accumulated));
    const out = stripHtmlMarkdown(accumulated);
    return out || null;
  } catch {
    return null;
  }
}

const THEME_KEYS =
  "--background, --foreground, --primary, --primary-foreground, --secondary, --secondary-foreground, --muted, --muted-foreground, --card, --card-foreground, --border, --radius, --font-sans, --font-heading";

function buildThemeContext(theme: ThemeVariables): string {
  const entries = Object.entries(theme).filter(([k]) => k.startsWith("--"));
  if (entries.length === 0)
    return "\n\nNO THEME EXISTS. You MUST call build_theme before designing any screen. Do NOT proceed with design_screen until a theme is created.";
  const vars = entries.map(([k, v]) => `  ${k}: ${v}`).join("\n");
  const fontSans = theme["--font-sans"] ?? "system-ui, sans-serif";
  const fontHeading = theme["--font-heading"] ?? fontSans;
  return `\n\nACTIVE THEME — You MUST follow this exactly:

CSS Variables:
${vars}

Typography:
  Body font: ${fontSans}
  Heading font: ${fontHeading}

MANDATORY Tailwind class mapping (use ONLY these, never arbitrary colors):
  Backgrounds: bg-background, bg-primary, bg-secondary, bg-muted, bg-card, bg-accent, bg-destructive
  Text: text-foreground, text-primary-foreground, text-secondary-foreground, text-muted-foreground, text-card-foreground
  Borders: border-border, border-input
  Ring: ring-ring

FORBIDDEN: bg-blue-500, text-gray-700, bg-slate-900, text-zinc-400, or ANY arbitrary Tailwind color.
Every color must come from the theme variables above. This ensures all screens look like they belong to the same app.`;
}

/**
 * Extract a concise structural summary from screen HTML so the design model
 * understands what was previously built (navigation items, sections, key UI
 * patterns) without receiving the entire HTML blob.
 */
function summarizeScreenHtml(html: string, maxLength = 600): string {
  const body = extractBodyContent(html);
  if (!body) return "(empty)";

  const parts: string[] = [];

  // Extract headings
  const headings = [...body.matchAll(/<h[1-3][^>]*>(.*?)<\/h[1-3]>/gi)]
    .map((m) => m[1].replace(/<[^>]+>/g, "").trim())
    .filter(Boolean);
  if (headings.length > 0) parts.push(`Headings: ${headings.join(", ")}`);

  // Extract navigation/tab bar items
  const navMatch = body.match(/<nav[^>]*>([\s\S]*?)<\/nav>/i);
  if (navMatch) {
    const navTexts = [...navMatch[1].matchAll(/>([^<]{2,30})</g)]
      .map((m) => m[1].trim())
      .filter((t) => t.length > 1 && !t.startsWith("<"));
    if (navTexts.length > 0) parts.push(`Nav items: ${navTexts.join(", ")}`);
  }

  // Extract bottom tab bar (common pattern: fixed bottom bar)
  const bottomBar = body.match(
    /fixed\s+bottom[\s\S]{0,500}?(<\/div>|<\/nav>)/i,
  );
  if (bottomBar) {
    const tabTexts = [...bottomBar[0].matchAll(/>([A-Z][a-z]{1,15})</g)].map(
      (m) => m[1],
    );
    if (tabTexts.length > 0) parts.push(`Bottom tabs: ${tabTexts.join(", ")}`);
  }

  // Extract buttons/CTAs
  const buttons = [
    ...body.matchAll(/<button[^>]*>(.*?)<\/button>/gi),
    ...body.matchAll(/<a[^>]*class="[^"]*btn[^"]*"[^>]*>(.*?)<\/a>/gi),
  ]
    .map((m) => m[1].replace(/<[^>]+>/g, "").trim())
    .filter((t) => t.length > 1 && t.length < 40);
  if (buttons.length > 0)
    parts.push(`Buttons: ${buttons.slice(0, 5).join(", ")}`);

  // Extract key text content (paragraphs, spans with substantial text)
  const textSnippets = [
    ...body.matchAll(/<(?:p|span|div)[^>]*>([^<]{10,80})</g),
  ]
    .map((m) => m[1].trim())
    .filter((t) => !t.includes("{") && !t.includes("hgi-"))
    .slice(0, 4);
  if (textSnippets.length > 0)
    parts.push(`Key text: ${textSnippets.join(" | ")}`);

  // Extract icon names used (HugeIcons pattern)
  const icons = [...body.matchAll(/hgi-([\w-]+)/g)]
    .map((m) => m[1])
    .filter((v, i, a) => a.indexOf(v) === i)
    .slice(0, 8);
  if (icons.length > 0) parts.push(`Icons used: ${icons.join(", ")}`);

  // Detect structural patterns
  const patterns: string[] = [];
  if (/fixed\s+bottom/i.test(body)) patterns.push("bottom tab bar");
  if (/fixed\s+top|sticky\s+top/i.test(body)) patterns.push("sticky top bar");
  if (/grid-cols-2|grid-cols-3/i.test(body)) patterns.push("grid layout");
  if (/overflow-x-auto|flex.*overflow/i.test(body))
    patterns.push("horizontal scroll");
  if (/rounded-2xl.*shadow|shadow.*rounded-2xl/i.test(body))
    patterns.push("elevated cards");
  if (patterns.length > 0) parts.push(`Patterns: ${patterns.join(", ")}`);

  const summary = parts.join("\n    ");
  return summary.length > maxLength
    ? summary.slice(0, maxLength) + "…"
    : summary;
}

function buildScreenContext(frames: FrameState[], currentId: string): string {
  const siblings = frames.filter(
    (f) => f.id !== currentId && f.html && f.html.length > 100,
  );
  if (siblings.length === 0) return "";

  const summaries = siblings
    .map((f) => `  Screen "${f.label}":\n    ${summarizeScreenHtml(f.html)}`)
    .join("\n\n");

  return `\n\nPREVIOUSLY DESIGNED SCREENS — use these as reference for continuity and flow:\n${summaries}\n\nCONSISTENCY & NAVIGATION FLOW REQUIREMENTS:\n- The new screen MUST feel like it belongs to the same app as the screens above\n- Match the EXACT same navigation pattern (same bottom tab bar items, same active/inactive styling)\n- If existing screens have a bottom tab bar, include the SAME tabs with this screen's tab highlighted\n- Maintain the same visual language: card style, spacing scale, typography scale, button style, icon style\n- Ensure navigation flow makes sense: buttons like "View All", "See Details", etc. should lead to screens that exist\n- Use the same header/app bar pattern (back arrows, titles, action icons)\n- Match the same icon family and size (HugeIcons stroke-rounded)\n- Every screen should feel like a natural continuation of the user journey`;
}

async function generateThemeWithDesignModel(
  vertex: GoogleVertexProvider,
  modelId: string,
  prompt: string,
): Promise<Record<string, string> | null> {
  try {
    const { object } = await generateObject({
      model: vertex(modelId),
      schema: z.record(z.string(), z.string()),
      prompt: `${prompt}\n\nOutput a JSON object with CSS variable keys (e.g. ${THEME_KEYS}). Keys must start with --.`,
      providerOptions: DESIGN_MODEL_PROVIDER_OPTIONS,
    });
    return object && typeof object === "object" ? object : null;
  } catch {
    return null;
  }
}

const DESIGN_MODEL_PROVIDER_OPTIONS = {
  google: {
    thinkingConfig: {
      includeThoughts: false,
      thinkingBudget: 0,
    },
  },
} as const;

export function createTools(ctx: ToolContext) {
  const {
    frames,
    theme,
    writer,
    designModel,
    imageContext,
    allowSpawnAgents,
    excludeCreateScreen,
  } = ctx;

  const imagePlaceholders = new Map<string, string>();

  const updateScreenStreamState = new Map<string, UpdateScreenStreamState>();
  const editScreenStreamBuffer = new Map<string, string>();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const screenCreationTools: Record<string, any> = excludeCreateScreen
    ? {}
    : {
        create_all_screens: tool({
          description:
            "Creates multiple placeholder screens on the canvas at once. Use this in multi-agent mode to create all frames before spawning agents. Returns frame IDs for each screen.",
          inputSchema: z.object({
            screens: z
              .array(
                z.object({
                  name: z.string().describe("Screen label/name"),
                  description: z
                    .string()
                    .describe("Brief description of the screen"),
                }),
              )
              .min(1)
              .max(12),
          }),
          onInputStart: ({ toolCallId }) => {
            writer?.write({
              type: "tool-input-start",
              toolCallId,
              toolName: "create_all_screens",
            });
          },
          execute: async (
            {
              screens,
            }: { screens: Array<{ name: string; description: string }> },
            { toolCallId },
          ) => {
            const startIndex = frames.length;
            const results = screens.map((screen, i) => {
              const id = `${toolCallId}-${i}`;
              const left = (startIndex + i) * FRAME_STEP;
              const top = 0;
              frames.push({ id, label: screen.name, left, top, html: "" });
              writer?.write({
                type: "data-tool-call-end",
                data: {
                  toolCallId: id,
                  toolName: "create_all_screens",
                  frame: { id, label: screen.name, left, top, html: "" },
                },
              } as Parameters<typeof writer.write>[0]);
              return { name: screen.name, frameId: id, left, top };
            });
            return { success: true, screens: results };
          },
        }),
      };

  return {
    ...screenCreationTools,

    read_screen: tool({
      description:
        "Returns the current HTML of a screen. Call this before editing. id must be from the Current Screens table in the system context.",
      inputSchema: z.object({ id: z.string() }),
      onInputStart: ({ toolCallId }) => {
        writer?.write({
          type: "tool-input-start",
          toolCallId,
          toolName: "read_screen",
        });
      },
      execute: async (
        { id }: { id: string },
        { toolCallId }: { toolCallId: string },
      ) => {
        writer?.write({
          type: "data-tool-call-start",
          data: { toolCallId, toolName: "read_screen" },
        });
        const frame = frames.find((f) => f.id === id);
        const html = frame?.html ? extractBodyContent(frame.html) : "";
        const result = html || "(empty screen)";
        writer?.write({
          type: "data-tool-call-end",
          data: { toolCallId, toolName: "read_screen", id },
        });
        return result;
      },
    }),

    read_theme: tool({
      description:
        "Returns current CSS theme variables and fonts. No arguments needed.",
      inputSchema: z.object({}),
      onInputStart: ({ toolCallId }) => {
        writer?.write({
          type: "tool-input-start",
          toolCallId,
          toolName: "read_theme",
        });
      },
      execute: async () => {
        const result = JSON.stringify(theme, null, 2);
        return result;
      },
    }),

    generate_image: tool({
      description:
        'Generates an image and returns a URL to use in screen HTML. Call this BEFORE design_screen or update_screen that needs the image. Reference in HTML as src="<returned_url>". Use for app illustrations, backgrounds, photos, icons, and logos.',
      inputSchema: z.object({
        id: z
          .string()
          .describe(
            "Unique placeholder id for this image, e.g. img-hero, img-avatar-1",
          ),
        prompt: z
          .string()
          .describe(
            "Detailed description of the image to generate. Be specific about style, subject, colors, mood.",
          ),
        aspect_ratio: z
          .enum(["square", "landscape", "portrait"])
          .describe(
            "square (1:1, icons/avatars), landscape (16:9, banners/headers), portrait (9:16, full-screen backgrounds)",
          ),
        background: z
          .enum(["opaque", "transparent"])
          .describe(
            "opaque for photos/backgrounds/illustrations, transparent for icons/logos that overlay other content",
          ),
      }),
      onInputStart: ({ toolCallId }) => {
        writer?.write({
          type: "tool-input-start",
          toolCallId,
          toolName: "generate_image",
        });
      },
      execute: async (
        {
          id,
          prompt,
          aspect_ratio,
          background,
        }: {
          id: string;
          prompt: string;
          aspect_ratio: string;
          background: string;
        },
        { toolCallId },
      ) => {
        const placeholderUrl = `placeholder:${id}`;

        if (imageContext?.generateAndUpload) {
          try {
            const url = await imageContext.generateAndUpload({
              id,
              prompt,
              aspectRatio: aspect_ratio,
              background,
            });
            if (url) {
              imagePlaceholders.set(id, url);
              writer?.write({
                type: "data-tool-call-end",
                data: {
                  toolCallId,
                  toolName: "generate_image",
                },
              });
              return { success: true, url, id };
            }
          } catch (err) {
            // Fall through to placeholder
            console.error("[generate_image] failed:", err);
          }
        }

        // Fallback: return placeholder URL
        imagePlaceholders.set(id, placeholderUrl);
        writer?.write({
          type: "data-tool-call-end",
          data: {
            toolCallId,
            toolName: "generate_image",
          },
        });
        return {
          success: true,
          url: placeholderUrl,
          id,
          note: "Image generation not configured. Placeholder URL returned — replace with a real image later.",
        };
      },
    }),

    design_screen: tool({
      description:
        "Generates the full design for an existing screen frame. Use this to design screens created by create_all_screens. The design model generates the HTML from the description. Streams the design live into the frame. IMPORTANT: In the description, reference what was designed in previous screens (from their screenSummary) — especially navigation items, tab bar labels, shared UI patterns, and flow connections. This ensures visual and navigational continuity across the app.",
      inputSchema: z.object({
        id: z.string().describe("Frame id (from create_all_screens result)"),
        description: z
          .string()
          .describe(
            "Full description of the screen content and layout to generate. MUST include: (1) what this screen shows, (2) navigation items matching other screens (e.g. same bottom tab bar items), (3) how this screen connects to previously designed screens in the flow.",
          ),
      }),
      onInputStart: ({ toolCallId }) => {
        writer?.write({
          type: "tool-input-start",
          toolCallId,
          toolName: "design_screen",
        });
      },
      execute: async (
        { id, description }: { id: string; description: string },
        { toolCallId },
      ) => {
        const frame = frames.find((f) => f.id === id);
        if (!frame) {
          return { success: false, error: "Frame not found" };
        }
        // Block design if no theme exists — agent must call build_theme first
        const hasTheme = Object.keys(theme).some((k) => k.startsWith("--"));
        if (!hasTheme) {
          return {
            success: false,
            error:
              "No theme exists. You MUST call build_theme first to establish colors, typography, and spacing before designing any screen.",
          };
        }
        if (!designModel?.vertex || !designModel?.modelId) {
          return {
            success: false,
            error: "Design model is required for design_screen.",
          };
        }
        const themeCtx = buildThemeContext(theme);
        const screenCtx = buildScreenContext(frames, id);
        const designPrompt = `You are an elite mobile UI designer known for creating stunning, award-winning app screens. Generate the inner body HTML (no html/head/body tags) for a screen named "${frame.label}".\n\nDescription: ${description}${themeCtx}${screenCtx}\n\nDESIGN QUALITY RULES (NON-NEGOTIABLE):\n- Create BEAUTIFUL, premium designs that look like top Dribbble/Behance shots\n- Use ONLY Tailwind semantic theme classes (bg-primary, text-foreground, etc.) — NEVER arbitrary colors\n- Use HugeIcons font icons (class="hgi-stroke hgi-icon-name")\n- Apply font-heading to h1 and h2 elements with bold, large typography (text-2xl+ font-bold)\n- Use rounded-2xl on cards, rounded-xl on buttons, shadow-md or shadow-lg on elevated surfaces\n- Generous spacing: p-5/p-6 on containers, gap-4 to gap-6 between sections\n- Create clear visual hierarchy with 2-3 levels of text size and weight\n- Use text-muted-foreground for secondary text, uppercase tracking-wide text-xs for labels\n- Primary CTAs should be full-width, rounded-xl, py-4, font-semibold\n- Add realistic sample data (names, prices, dates, ratings, avatars) to make screens feel alive\n- Use subtle gradients (bg-gradient-to-b/br) and layered cards for depth\n- Minimum touch targets of 44px (min-h-11 or py-3 on buttons)\n- Whitespace is a feature — never let content feel cramped\n- Output only the complete inner body HTML, no markdown or explanation`;
        const generated = await streamScreenHtmlWithDesignModel(
          designModel.vertex,
          designModel.modelId,
          designPrompt,
          (accumulated) => {
            const wrapped = wrapScreenBody(accumulated, theme);
            writer?.write({
              type: "data-tool-call-delta",
              data: {
                toolCallId,
                toolName: "design_screen",
                frame: { id: frame.id, html: wrapped },
              },
            });
          },
          { maxOutputTokens: 16384 },
        );
        const finalHtml = generated?.trim() ?? "";
        if (!finalHtml) {
          return {
            success: false,
            error: "Design model did not return HTML. Try again.",
          };
        }
        frame.html = wrapScreenBody(finalHtml, theme);
        // Send full frame data to the UI via writer
        writer?.write({
          type: "data-tool-call-end",
          data: {
            toolCallId,
            toolName: "design_screen",
            frame: {
              id: frame.id,
              label: frame.label,
              left: frame.left,
              top: frame.top,
              html: frame.html,
            },
          },
        });
        // Return a summary to the orchestrator agent (not full HTML) to keep
        // context lean while giving it enough info to maintain continuity
        // when crafting descriptions for subsequent screens.
        const summary = summarizeScreenHtml(frame.html);
        return {
          success: true,
          id: frame.id,
          label: frame.label,
          screenSummary: summary,
          note: "Screen designed successfully. Use the screenSummary above as context when designing the next screen to maintain navigation flow and visual continuity.",
        };
      },
    }),

    update_screen: tool({
      description:
        "Replaces the ENTIRE screen body based on a description of the changes. Use only for broad layout redesigns on screens that already have content. Do NOT use for small targeted edits (use edit_design instead). The design model generates the new HTML from the current screen and your description.",
      inputSchema: z.object({
        id: z.string().describe("Frame id"),
        description: z
          .string()
          .describe(
            "Description of how the screen should be updated (layout, sections, style).",
          ),
      }),
      onInputStart: ({ toolCallId }) => {
        writer?.write({
          type: "tool-input-start",
          toolCallId,
          toolName: "update_screen",
        });
        updateScreenStreamState.set(toolCallId, { buffer: "", lastEmit: 0 });
      },
      onInputDelta: () => {},
      execute: async (
        { id, description }: { id: string; description: string },
        { toolCallId },
      ) => {
        updateScreenStreamState.delete(toolCallId);
        const frame = frames.find((f) => f.id === id);
        if (!frame) {
          return { success: false, error: "Screen not found" };
        }
        if (!designModel?.vertex || !designModel?.modelId) {
          return {
            success: false,
            error: "Design model is required for update_screen.",
          };
        }
        const currentBody = frame.html ? extractBodyContent(frame.html) : "";
        const themeCtx = buildThemeContext(theme);
        const designPrompt = currentBody
          ? `You are an elite mobile UI designer creating stunning, premium screens. Update this screen's inner body HTML according to the description below. Maintain beautiful design quality — generous spacing, bold typography, soft shadows, and visual depth. Output the complete updated inner body HTML only, no markdown or explanation.\n\nDescription of changes: ${description}${themeCtx}\n\nCurrent inner body HTML:\n${currentBody}`
          : `You are an elite mobile UI designer creating stunning, premium screens. Generate the inner body HTML (no html/head/body tags) for a screen named "${frame.label}".\n\nDescription: ${description}${themeCtx}\n\nCreate a beautiful, polished design with generous spacing, bold headings, layered cards with soft shadows, and clear visual hierarchy. Use Tailwind semantic theme classes and HugeIcons font icons (class="hgi-stroke hgi-icon-name"). Output only the complete inner body HTML, no markdown or explanation.`;
        const generated = await streamScreenHtmlWithDesignModel(
          designModel.vertex,
          designModel.modelId,
          designPrompt,
          (accumulated) => {
            const wrapped = wrapScreenBody(accumulated, theme);
            writer?.write({
              type: "data-tool-call-delta",
              data: {
                toolCallId,
                toolName: "update_screen",
                frame: { id: frame.id, html: wrapped },
              },
            });
          },
          { maxOutputTokens: 16384 },
        );
        const finalHtml = generated?.trim() ?? "";
        if (!finalHtml) {
          return {
            success: false,
            error: "Design model did not return HTML. Try again.",
          };
        }
        frame.html = wrapScreenBody(finalHtml, theme);
        const result = {
          success: true,
          frame: { id: frame.id, html: frame.html },
        };
        writer?.write({
          type: "data-tool-call-end",
          data: {
            toolCallId,
            toolName: "update_screen",
            frame: result.frame,
          },
        });
        return result;
      },
    }),

    edit_design: tool({
      description:
        "Targeted find/replace on screen HTML. Use for specific-section edits (e.g., change one button color). Preserves the rest of the UI. find must match read_screen output exactly. One edit per screen.",
      inputSchema: z.object({
        id: z.string(),
        find: z.string().describe("Exact string to find (from read_screen)"),
        replace: z.string().describe("Replacement string"),
      }),
      onInputStart: ({ toolCallId }) => {
        writer?.write({
          type: "tool-input-start",
          toolCallId,
          toolName: "edit_design",
        });
        editScreenStreamBuffer.set(toolCallId, "");
      },
      onInputDelta: ({ toolCallId, inputTextDelta }) => {
        const prev = editScreenStreamBuffer.get(toolCallId) ?? "";
        const buffer = prev + inputTextDelta;
        editScreenStreamBuffer.set(toolCallId, buffer);
        process.stdout.write(inputTextDelta);
      },
      execute: async (
        {
          id,
          find,
          replace,
        }: {
          id: string;
          find: string;
          replace: string;
        },
        { toolCallId },
      ) => {
        editScreenStreamBuffer.delete(toolCallId);
        process.stdout.write("\n");
        const frame = frames.find((f) => f.id === id);
        if (!frame?.html) {
          return { success: false, error: "Screen not found" };
        }
        if (!frame.html.includes(find)) {
          return {
            success: false,
            error:
              "Find string not found - ensure exact match from read_screen",
          };
        }
        let newHtml: string;
        if (designModel?.vertex && designModel?.modelId) {
          const currentBody = extractBodyContent(frame.html);
          const designPrompt = `You must perform exactly one replacement in the HTML below. Find the exact substring given under "Find" and replace it with the text under "Replace". Do not change any other part of the HTML. Do not add or remove sections. Output the complete inner body HTML with only that one replacement applied.\n\nFind (exact string to replace):\n${find}\n\nReplace with:\n${replace}\n\nCurrent inner body HTML:\n${currentBody}`;
          const generated = await generateScreenHtmlWithDesignModel(
            designModel.vertex,
            designModel.modelId,
            designPrompt,
            { maxOutputTokens: 16384 },
          );
          newHtml = generated
            ? wrapScreenBody(generated, theme)
            : frame.html.replace(find, replace);
        } else {
          newHtml = frame.html.replace(find, replace);
        }
        frame.html = newHtml;
        const result = {
          success: true,
          frame: { id: frame.id, html: frame.html },
        };
        writer?.write({
          type: "data-tool-call-end",
          data: {
            toolCallId,
            toolName: "edit_design",
            frame: result.frame,
          },
        });
        return result;
      },
    }),

    update_theme: tool({
      description:
        "Updates CSS theme variables for a specific variant. Use variantName to target light, dark, or a custom variant. Optionally provide a new themeName if the style direction has changed significantly.",
      inputSchema: z.object({
        themeName: z
          .string()
          .optional()
          .describe(
            'Optional new name for the theme if the style direction changed (e.g. "Warm Sunset"). Omit to keep the current name.',
          ),
        variantName: z
          .string()
          .optional()
          .describe(
            'Which variant to update: "light", "dark", or a custom name. Defaults to the currently active variant.',
          ),
        updates: z
          .record(z.string(), z.string())
          .describe(
            'Object: CSS variable name -> value, e.g. {"--primary":"#2563eb"}. Do NOT use -dark suffix — use variantName instead.',
          ),
      }),
      onInputStart: ({ toolCallId }) => {
        writer?.write({
          type: "tool-input-start",
          toolCallId,
          toolName: "update_theme",
        });
      },
      execute: async (
        {
          themeName,
          updates,
          variantName: inputVariantName,
        }: {
          themeName?: string;
          updates: Record<string, string>;
          variantName?: string;
        },
        { toolCallId },
      ) => {
        const targetVariant = inputVariantName ?? "light";
        let toApply = updates;
        if (
          designModel?.vertex &&
          designModel?.modelId &&
          Object.keys(updates).length > 0
        ) {
          const designPrompt = `Given current theme and requested updates, output a full coherent CSS theme as a flat object. Required keys: ${THEME_KEYS}. Current theme: ${JSON.stringify(theme)}. Requested updates: ${JSON.stringify(updates)}. Return the complete merged theme.`;
          const generated = await generateThemeWithDesignModel(
            designModel.vertex,
            designModel.modelId,
            designPrompt,
          );
          if (generated) {
            const normalized = normalizeThemeVars(generated);
            for (const k of Object.keys(theme)) delete theme[k];
            for (const [k, v] of Object.entries(normalized)) theme[k] = v;
            toApply = normalized;
          } else {
            for (const k of Object.keys(updates)) {
              const v = updates[k];
              if (v !== undefined) theme[k] = String(v);
            }
          }
        } else {
          for (const k of Object.keys(updates)) {
            const v = updates[k];
            if (v !== undefined) theme[k] = String(v);
          }
        }
        const result = {
          success: true,
          themeUpdates: { ...toApply },
          ...(themeName && { themeName }),
          variantName: targetVariant,
        };
        writer?.write({
          type: "data-tool-call-end",
          data: {
            toolCallId,
            toolName: "update_theme",
            themeUpdates: result.themeUpdates,
            ...(themeName && { themeName }),
            variantName: targetVariant,
          },
        });
        return result;
      },
    }),

    build_theme: tool({
      description:
        'Creates or replaces a theme variant. Pass CSS variables as a flat object. Use variantName to target a specific variant (default: "light"). Always provide a creative themeName.',
      inputSchema: z.object({
        themeName: z
          .string()
          .describe(
            'A creative, descriptive name for this theme based on the app type and style (e.g. "Ocean Breeze", "Midnight Professional", "Vibrant Fitness"). Never use "Default".',
          ),
        description: z.string().optional(),
        variantName: z
          .string()
          .optional()
          .describe(
            'Which variant to create/replace: "light", "dark", or a custom name. Defaults to "light".',
          ),
        variables: z
          .record(z.string(), z.string())
          .describe(
            'Flat object mapping CSS variable names to values. Example: {"--primary":"#2563eb","--background":"#0f172a","--radius":"0.5rem"}',
          ),
      }),
      onInputStart: ({ toolCallId }) => {
        writer?.write({
          type: "tool-input-start",
          toolCallId,
          toolName: "build_theme",
        });
      },
      execute: async (
        {
          themeName,
          description,
          variantName: inputVariantName,
          variables = {},
        }: {
          themeName: string;
          description?: string;
          variantName?: string;
          variables?: Record<string, string>;
        },
        { toolCallId },
      ) => {
        const targetVariant = inputVariantName ?? "light";
        const agentVars: Record<string, string> =
          variables && typeof variables === "object" ? variables : {};
        let varsToApply = { ...agentVars };
        if (designModel?.vertex && designModel?.modelId) {
          const contextParts: string[] = [];
          if (description?.trim())
            contextParts.push(`Guidelines: ${description}`);
          if (Object.keys(agentVars).length > 0)
            contextParts.push(
              `Draft variables from agent (refine or keep): ${JSON.stringify(agentVars)}`,
            );
          const designPrompt = `Generate a BEAUTIFUL, premium CSS theme for a mobile app as a flat JSON object. The theme should feel like it belongs in an award-winning app.\n\nRequired keys: ${THEME_KEYS}\n\nRules:\n- Colors must be rich, harmonious, and premium — avoid generic or dull palettes\n- Primary and secondary should complement each other beautifully\n- Foreground colors must have strong contrast against their background (WCAG AA minimum)\n- --primary-foreground must be readable on --primary background\n- --card should be slightly different from --background to create visual depth and layering\n- --muted should be a subtle, elegant tint of the primary or background\n- --border should be a soft, refined color that works on both --background and --card\n- --font-sans and --font-heading should be modern, premium Google Fonts (e.g. 'Plus Jakarta Sans', 'Inter', 'DM Sans', 'Space Grotesk', 'Outfit', 'Manrope')\n- --radius should be between 0.75rem and 1.25rem for a soft, modern mobile feel\n- Aim for the visual quality of Airbnb, Spotify, Linear, or Apple Health themes\n- Values: hex colors, rem for --radius, quoted font family strings\n\n${contextParts.join("\n\n")}`;
          const generated = await generateThemeWithDesignModel(
            designModel.vertex,
            designModel.modelId,
            designPrompt,
          );
          if (generated && Object.keys(generated).length > 0) {
            varsToApply = generated;
          }
        }
        if (!varsToApply || Object.keys(varsToApply).length === 0) {
          return {
            success: false,
            error:
              'variables is required. Pass an object like {"--primary":"#2563eb","--background":"#0f172a"}',
          };
        }
        const normalized = normalizeThemeVars(varsToApply);
        for (const k of Object.keys(theme)) delete theme[k];
        for (const [k, v] of Object.entries(normalized)) {
          theme[k] = v;
        }
        const result = {
          success: true,
          message: `Theme "${themeName}" variant "${targetVariant}" built`,
          theme: { ...theme },
          themeName,
          variantName: targetVariant,
        };
        writer?.write({
          type: "data-tool-call-end",
          data: {
            toolCallId,
            toolName: "build_theme",
            theme: result.theme,
            themeName,
            variantName: targetVariant,
          },
        });
        return result;
      },
    }),

    ...(allowSpawnAgents
      ? {
          spawn_agents: tool({
            description:
              "Start multiple agents to work in parallel on different screens or sub-tasks. Call this when you have a plan and want to delegate work to specialist agents (e.g. one per screen or per feature). Pass the list of agents with each agent's subTask and assignedScreens. The agents will run in parallel; the current chat stays open so you can spawn more or monitor. Use after you have created screens and have a clear task breakdown.",
            inputSchema: z.object({
              agents: z
                .array(
                  z.object({
                    subTask: z
                      .string()
                      .describe(
                        "Clear task for this agent (e.g. build Home Search screen)",
                      ),
                    assignedScreens: z
                      .array(z.string())
                      .describe(
                        "Screen labels or ids this agent owns (e.g. ['Home Search', 'Train Listing'])",
                      ),
                    assignedFrameIds: z
                      .array(z.string())
                      .optional()
                      .default([])
                      .describe(
                        "Canvas frame IDs for assigned screens (from create_all_screens results)",
                      ),
                  }),
                )
                .min(1)
                .max(6)
                .describe(
                  "List of agents to spawn with their tasks and screen assignments",
                ),
              planContext: z
                .string()
                .optional()
                .describe(
                  "Optional shared context or plan summary for all agents",
                ),
            }),
            onInputStart: ({ toolCallId }) => {
              writer?.write({
                type: "tool-input-start",
                toolCallId,
                toolName: "spawn_agents",
              });
            },
            execute: async (
              {
                agents: agentInputs,
                planContext = "",
              }: {
                agents: Array<{
                  subTask: string;
                  assignedScreens: string[];
                  assignedFrameIds?: string[];
                }>;
                planContext?: string;
              },
              { toolCallId: _toolCallId },
            ) => {
              const orchestrationId = crypto
                .randomUUID()
                .replace(/-/g, "")
                .slice(0, 12);
              let globalScreenIndex = 0;
              const agentsWithPositions = agentInputs.map((a, i) => {
                const positions = (a.assignedScreens || []).map((_, si) => ({
                  left: (globalScreenIndex + si) * FRAME_STEP,
                  top: 0,
                }));
                globalScreenIndex += a.assignedScreens?.length ?? 0;
                return {
                  id: String(i),
                  subTask: a.subTask,
                  assignedScreens: a.assignedScreens ?? [],
                  assignedFrameIds: a.assignedFrameIds ?? [],
                  screenPositions: positions,
                };
              });
              const result = {
                success: true,
                orchestrationId,
                agents: agentsWithPositions,
                planContext,
                theme: { ...theme },
              };
              writer?.write({
                type: "data-spawn-agents",
                data: result,
              } as Parameters<typeof writer.write>[0]);
              return result;
            },
          }),
        }
      : {}),
  };
}
