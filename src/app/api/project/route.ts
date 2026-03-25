import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  recordsToUiMessages,
  type ChatSessionMessageRecord,
} from "@/lib/chat-session";
import { ensureVariantMap } from "@/lib/screen-utils";

export async function GET(req: NextRequest) {
  try {
    const projectId = req.nextUrl.searchParams.get("id") ?? "";
    const userId = req.nextUrl.searchParams.get("userId") ?? "";

    if (!projectId || !userId) {
      return NextResponse.json(
        { error: "id and userId are required" },
        { status: 400 },
      );
    }

    const [project, chatSession, userThemes] = await Promise.all([
      prisma.project.findUnique({
        where: { id: projectId },
        select: {
          name: true,
          frames: {
            select: {
              id: true,
              label: true,
              left: true,
              top: true,
              html: true,
              themeId: true,
              variantName: true,
              theme: { select: { id: true, name: true, variables: true } },
            },
          },
        },
      }),
      prisma.chatSession.findUnique({
        where: { projectId_userId: { projectId, userId } },
        select: { messages: true },
      }),
      prisma.theme.findMany({
        where: { userId },
        orderBy: { updatedAt: "desc" },
        select: { id: true, name: true, variables: true },
      }),
    ]);

    if (!project) {
      return NextResponse.json({
        name: "Untitled Project",
        frames: [],
        messages: [],
      });
    }

    const records = (chatSession?.messages as ChatSessionMessageRecord[]) ?? [];
    const messages = recordsToUiMessages(records);

    const frames = project.frames.map((f) => {
      // Legacy compatibility: historical global frames were persisted as "light".
      // If frame has no explicit theme assignment, treat that legacy default as unset
      // so the frame follows the currently active variant.
      const normalizedVariantName =
        !f.themeId && f.variantName === "light"
          ? undefined
          : (f.variantName ?? undefined);
      return {
        id: f.id,
        label: f.label,
        left: f.left,
        top: f.top,
        html: f.html,
        themeId: f.themeId,
        variantName: normalizedVariantName,
      };
    });

    const allThemes = userThemes.reduce(
      (acc, t) => {
        acc[t.id] = {
          id: t.id,
          name: t.name,
          variants: ensureVariantMap(t.variables),
        };
        return acc;
      },
      {} as Record<
        string,
        {
          id: string;
          name: string;
          variants: Record<string, Record<string, string>>;
        }
      >,
    );

    return NextResponse.json({
      name: project.name,
      frames,
      messages,
      themes: Object.values(allThemes),
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 },
    );
  }
}
