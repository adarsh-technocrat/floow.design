import { NextRequest, NextResponse } from "next/server";
import { prisma, ensureProject } from "@/lib/db";
import { DEFAULT_PROJECT_ID } from "@/constants/project";

export async function GET(req: NextRequest) {
  try {
    const agentId = req.nextUrl.searchParams.get("agentId") ?? "default";
    const projectId = req.nextUrl.searchParams.get("projectId") ?? DEFAULT_PROJECT_ID;

    const session = await prisma.chatSession.findUnique({
      where: {
        projectId_agentId: {
          projectId,
          agentId,
        },
      },
    });
    const messages = (session?.messages as unknown[]) ?? [];
    return NextResponse.json({ messages });
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
    const messages = Array.isArray(body?.messages) ? body.messages : [];
    const agentId = body?.agentId ?? "default";
    const projectId = body?.projectId ?? DEFAULT_PROJECT_ID;

    await ensureProject(projectId);

    await prisma.chatSession.upsert({
      where: {
        projectId_agentId: {
          projectId,
          agentId,
        },
      },
      create: { projectId, agentId, messages },
      update: { messages },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 },
    );
  }
}
