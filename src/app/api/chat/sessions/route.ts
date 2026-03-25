import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma, ensureProject, ensureUser } from "@/lib/db";
import {
  normalizeIncomingMessages,
  recordsToUiMessages,
  type ChatSessionMessageRecord,
} from "@/lib/chat-session";

const postBodySchema = z.object({
  projectId: z.string().min(1),
  userId: z.string().min(1),
  isActive: z.boolean().optional(),
  messages: z.array(z.unknown()).optional(),
});

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

export async function POST(req: NextRequest) {
  try {
    const parsed = postBodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "projectId and userId are required" },
        { status: 400 },
      );
    }

    const {
      projectId,
      userId,
      isActive: bodyIsActive,
      messages: raw,
    } = parsed.data;
    const isActive = bodyIsActive ?? true;
    const messages = normalizeIncomingMessages(raw ?? []);
    const messagesJson = JSON.parse(
      JSON.stringify(messages),
    ) as Prisma.InputJsonValue;

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
