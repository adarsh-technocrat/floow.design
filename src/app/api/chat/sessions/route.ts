import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma, ensureProject, ensureUser } from "@/lib/db";
import {
  normalizeIncomingMessages,
  recordsToUiMessages,
  type ChatSessionMessageRecord,
} from "@/lib/chat-session";

export async function GET(req: NextRequest) {
  try {
    const projectId = req.nextUrl.searchParams.get("projectId") ?? "";
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
        projectId_userId: { projectId, userId },
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
        projectId_userId: { projectId, userId },
      },
      create: {
        projectId,
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
