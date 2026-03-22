import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// POST /api/projects/thumbnail — save a base64 thumbnail for a project
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      projectId?: string;
      thumbnail?: string;
    };
    const { projectId, thumbnail } = body;

    if (!projectId || !thumbnail) {
      return NextResponse.json(
        { error: "projectId and thumbnail are required" },
        { status: 400 },
      );
    }

    await prisma.project.update({
      where: { id: projectId },
      data: { thumbnail },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 },
    );
  }
}
