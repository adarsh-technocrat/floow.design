import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { DEFAULT_PROJECT_ID } from "@/constants/project";
import { ANONYMOUS_USER_ID } from "@/constants/user";
import {
  CANVAS_CHAT_FRAME_ID,
  recordsToUiMessages,
  type ChatSessionMessageRecord,
} from "@/lib/chat-session";

export async function GET(req: NextRequest) {
  try {
    const projectId = req.nextUrl.searchParams.get("id") ?? DEFAULT_PROJECT_ID;
    const userId = req.nextUrl.searchParams.get("userId") ?? ANONYMOUS_USER_ID;

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
