import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  CANVAS_CHAT_FRAME_ID,
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
            select: { id: true, label: true, left: true, top: true, html: true },
          },
        },
      }),
      prisma.chatSession.findUnique({
        where: { projectId_frameId_userId: { projectId, frameId: CANVAS_CHAT_FRAME_ID, userId } },
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

    return NextResponse.json({ name: project.name, frames: project.frames, messages });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 },
    );
  }
}
