import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma, ensureProject, ensureUser } from "@/lib/db";
import {
  CANVAS_CHAT_FRAME_ID,
  normalizeIncomingMessages,
  recordsToUiMessages,
  type ChatSessionMessageRecord,
} from "@/lib/chat-session";

function sessionJson(session: {
  id: string;
  projectId: string;
  frameId: string;
  userId: string;
  messages: unknown;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  const messages = (session.messages as ChatSessionMessageRecord[]) ?? [];
  return {
    id: session.id,
    projectId: session.projectId,
    frameId: session.frameId,
    userId: session.userId,
    messages,
    isActive: session.isActive,
    createdAt: session.createdAt.toISOString(),
    updatedAt: session.updatedAt.toISOString(),
  };
}

export async function GET(req: NextRequest) {
  try {
    const projectId = req.nextUrl.searchParams.get("projectId") ?? "";
    const frameId =
      req.nextUrl.searchParams.get("frameId") ?? CANVAS_CHAT_FRAME_ID;
    const userId = req.nextUrl.searchParams.get("userId") ?? "";

    if (!projectId || !userId) {
      return NextResponse.json(
        { error: "projectId and userId are required" },
        { status: 400 },
      );
    }

    await ensureUser(userId);

    const session = await prisma.chatSession.findUnique({
      where: {
        projectId_frameId_userId: {
          projectId,
          frameId,
          userId,
        },
      },
    });

    if (!session) {
      return NextResponse.json({
        session: null,
        messages: [] as ReturnType<typeof recordsToUiMessages>,
      });
    }

    const records = (session.messages as ChatSessionMessageRecord[]) ?? [];
    return NextResponse.json({
      session: sessionJson(session),
      messages: recordsToUiMessages(records),
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawMessages = Array.isArray(body?.messages) ? body.messages : [];
    const projectId = body?.projectId ?? "";
    const frameId = body?.frameId ?? CANVAS_CHAT_FRAME_ID;
    const userId =
      typeof body?.userId === "string" && body.userId.length > 0
        ? body.userId
        : "";

    if (!projectId || !userId) {
      return NextResponse.json(
        { error: "projectId and userId are required" },
        { status: 400 },
      );
    }
    const isActive = typeof body?.isActive === "boolean" ? body.isActive : true;

    const messages = normalizeIncomingMessages(rawMessages);
    const messagesJson = messages as unknown as Prisma.InputJsonValue;

    await ensureProject(projectId);
    await ensureUser(userId);

    await prisma.chatSession.upsert({
      where: {
        projectId_frameId_userId: {
          projectId,
          frameId,
          userId,
        },
      },
      create: {
        projectId,
        frameId,
        userId,
        messages: messagesJson,
        isActive,
      },
      update: {
        messages: messagesJson,
        isActive,
      },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 },
    );
  }
}
