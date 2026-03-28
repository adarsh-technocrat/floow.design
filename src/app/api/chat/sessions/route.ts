import { NextRequest, NextResponse } from "next/server";
import { prisma, ensureUser } from "@/lib/db";
import {
  recordsToUiMessages,
  type ChatSessionMessageRecord,
} from "@/lib/chat-session";
import { requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const [userId, errorRes] = await requireAuth(req);
  if (errorRes) return errorRes;

  try {
    const projectId = req.nextUrl.searchParams.get("projectId") ?? "";

    if (!projectId) {
      return NextResponse.json(
        { error: "projectId is required" },
        { status: 400 },
      );
    }

    await ensureUser(userId);

    const session = await prisma.chatSession.findFirst({
      where: { projectId, userId },
    });

    if (!session) {
      return NextResponse.json({
        session: null,
        messages: [] as ReturnType<typeof recordsToUiMessages>,
      });
    }

    const records = (session.messages as ChatSessionMessageRecord[]) ?? [];
    return NextResponse.json({
      messages: recordsToUiMessages(records),
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 },
    );
  }
}
