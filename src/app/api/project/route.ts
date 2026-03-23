import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  recordsToUiMessages,
  type ChatSessionMessageRecord,
} from "@/lib/chat-session";

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

    const [project, chatSession] = await Promise.all([
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
              theme: { select: { id: true, name: true, variables: true } },
            },
          },
        },
      }),
      prisma.chatSession.findUnique({
        where: { projectId_userId: { projectId, userId } },
        select: { messages: true },
      }),
    ]);

    if (!project) {
      return NextResponse.json({
        name: "Untitled Project",
        frames: [],
        messages: [],
      });
    }

    const records =
      (chatSession?.messages as ChatSessionMessageRecord[]) ?? [];
    const messages = recordsToUiMessages(records);

    const frames = project.frames.map((f) => ({
      id: f.id,
      label: f.label,
      left: f.left,
      top: f.top,
      html: f.html,
      themeId: f.themeId,
      theme: f.theme ? (f.theme.variables as Record<string, string>) : null,
    }));

    const allThemes = project.frames
      .filter((f) => f.theme)
      .reduce(
        (acc, f) => {
          if (f.theme && !acc[f.theme.id]) {
            acc[f.theme.id] = {
              id: f.theme.id,
              name: f.theme.name,
              variables: f.theme.variables as Record<string, string>,
            };
          }
          return acc;
        },
        {} as Record<string, { id: string; name: string; variables: Record<string, string> }>,
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
