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

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        frames: true,
        chatSessions: {
          where: { userId },
        },
      },
    });

    if (!project) {
      return NextResponse.json({
        frames: [],
        messages: [],
        theme: {},
      });
    }

    const frames = project.frames.map((f) => ({
      id: f.id,
      label: f.label,
      left: f.left,
      top: f.top,
      html: f.html,
    }));

    const canvasSession = project.chatSessions.find(
      (s) => s.frameId === CANVAS_CHAT_FRAME_ID,
    );
    const records =
      (canvasSession?.messages as ChatSessionMessageRecord[]) ?? [];
    const messages = recordsToUiMessages(records);

    return NextResponse.json({ frames, messages });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 },
    );
  }
}
