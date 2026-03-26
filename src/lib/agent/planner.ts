import { generateObject } from "ai";
import { z } from "zod";
import type { UIMessageStreamWriter } from "ai";
import type { GoogleVertexProvider } from "@ai-sdk/google-vertex";
import type { ThemeVariables } from "@/lib/screen-utils";

const PLANNER_CLASSIFY_PROMPT =
  'Given a user request for a mobile app, determine if they want to "generate" (create new screens) or "edit" (modify existing). Reply with intent only.';

const PLANNER_SCREENS_PROMPT =
  'Given a user request and that intent is "generate", list the screens to create. Each screen has name and description.';

const PLANNER_STYLE_PROMPT = `\
Given a user request and the screens to create, provide detailed visual guidelines for a BEAUTIFUL, premium mobile app design system.
Your goal is to produce designs that look like award-winning apps on Dribbble and Behance.

Your guidelines MUST include:
- Color palette: rich, harmonious primary color, background (light/dark), accent colors, text colors — choose colors that feel premium and modern
- Typography: modern Google Fonts (e.g. 'Plus Jakarta Sans', 'Inter', 'DM Sans', 'Space Grotesk', 'Outfit', 'Satoshi'), bold expressive headings, clean readable body text
- Mood: always premium and polished — modern, minimal, elegant, refined, bold, or luxurious
- Spacing: ALWAYS spacious — generous padding, breathing room between elements
- Border radius: rounded (rounded-xl to rounded-2xl) for a soft, modern feel
- Shadow style: soft, layered shadows for depth (shadow-sm to shadow-lg)
- Visual effects: subtle gradients, glassmorphism, or layered backgrounds where appropriate
- Any brand-specific style cues from the user's request

Be specific with color hex values when the user implies a style (e.g. "dark theme" → rich dark backgrounds like #0A0A0F, "vibrant" → saturated primaries).
If the user doesn't specify a style, choose a BEAUTIFUL palette — avoid generic blues. Think: warm gradients, rich purples, elegant dark themes, vibrant coral, soft sage green.
Always aim for the aesthetic quality of apps like Airbnb, Spotify, Linear, Arc Browser, or Apple Health.

ALWAYS set shouldGenerate to true for new app designs. Only set to false if the user is explicitly editing existing screens without style changes.`;

let planCallCounter = 0;

function nextPlanCallId(step: string): string {
  return `plan-${step}-${++planCallCounter}`;
}

function emitPlanStart(
  writer: UIMessageStreamWriter,
  toolCallId: string,
  toolName: string,
) {
  writer.write({
    type: "tool-input-start",
    toolCallId,
    toolName,
  });
}

function emitPlanEnd(
  writer: UIMessageStreamWriter,
  toolCallId: string,
  _toolName: string,
  _output: object,
) {
  writer.write({
    type: "tool-output-available",
    toolCallId,
    output: _output,
  });
}

export interface PlanningResult {
  planContext: string;
}

export async function runPlanningPipeline(
  userPrompt: string,
  vertex: GoogleVertexProvider,
  writer: UIMessageStreamWriter,
  _theme: ThemeVariables,
): Promise<PlanningResult> {
  try {
    const classifyId = nextPlanCallId("classifyIntent");
    emitPlanStart(writer, classifyId, "classifyIntent");
    const classify = await generateObject({
      model: vertex("gemini-2.0-flash"),
      schema: z.object({ intent: z.enum(["generate", "edit"]) }),
      prompt: `${PLANNER_CLASSIFY_PROMPT}\n\nUser request:\n${userPrompt}`,
    });
    const intent = classify.object.intent;
    emitPlanEnd(writer, classifyId, "classifyIntent", { intent });

    let screens: Array<{ name: string; description: string }> = [];
    const screensId = nextPlanCallId("planScreens");
    emitPlanStart(writer, screensId, "planScreens");
    if (intent === "generate") {
      const screensPlan = await generateObject({
        model: vertex("gemini-2.0-flash"),
        schema: z.object({
          screens: z.array(
            z.object({
              name: z.string(),
              description: z.string(),
            }),
          ),
        }),
        prompt: `${PLANNER_SCREENS_PROMPT}\n\nUser request:\n${userPrompt}`,
      });
      screens = screensPlan.object.screens;
    }
    emitPlanEnd(writer, screensId, "planScreens", { screens });

    const styleId = nextPlanCallId("planStyle");
    emitPlanStart(writer, styleId, "planStyle");
    const stylePlan = await generateObject({
      model: vertex("gemini-2.0-flash"),
      schema: z.object({
        guidelines: z.string(),
        shouldGenerate: z.boolean(),
      }),
      prompt: `${PLANNER_STYLE_PROMPT}\n\nUser request:\n${userPrompt}\n\nScreens: ${JSON.stringify(screens)}\n\nOutput visual guidelines and whether to generate (true for new designs).`,
    });
    const { guidelines, shouldGenerate } = stylePlan.object;
    emitPlanEnd(writer, styleId, "planStyle", { guidelines, shouldGenerate });

    // For initial prompts (no frames), theme generation is always required
    const themeRequired = intent === "generate" || shouldGenerate;
    const planContext = `## Planning (from pipeline)\n- Intent: ${intent}\n- Screens to create: ${JSON.stringify(screens, null, 2)}\n- Visual guidelines: ${guidelines}\n- Theme generation required: ${themeRequired ? "YES — call build_theme FIRST before creating any screens" : "NO — user is editing existing screens, skip theme creation"}\n`;
    return { planContext };
  } catch {
    // Planning failed — provide a minimal fallback so the agent still works
    const fallback = `## Planning (from pipeline — fallback due to error)\n- Intent: generate\n- Screens to create: (use your best judgment based on the user's prompt)\n- Visual guidelines: (infer from the app type described in the prompt)\n- Theme generation required: YES — call build_theme FIRST before creating any screens\n`;
    return { planContext: fallback };
  }
}
